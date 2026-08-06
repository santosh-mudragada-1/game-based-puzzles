/**
 * Chess.com's public read-only API (https://www.chess.com/news/view/published-data-api).
 *
 * No key and no auth — but it does want a real User-Agent and it does not send
 * CORS headers for every endpoint, so everything goes through our own route
 * handlers rather than being called from the browser.
 */

export interface ArchivedPlayer {
  username: string;
  rating: number;
  result: string;
  /**
   * ISO 3166 code, e.g. "IN" — only known for the connected account, since the
   * archive doesn't carry it and a lookup per opponent would be hundreds of
   * extra requests.
   */
  country?: string;
}

export interface ArchivedGame {
  /** Chess.com's own game id, taken off the end of the game URL. */
  id: string;
  url: string;
  pgn: string;
  /** "rapid" | "blitz" | "bullet" | "daily" — the API's own bucket. */
  timeClass: string;
  /** Human time control, e.g. "15 + 10". */
  timeControl: string;
  rated: boolean;
  /** Unix seconds. */
  endTime: number;
  white: ArchivedPlayer;
  black: ArchivedPlayer;
  /** Which side the account we looked up played. */
  userSide: "white" | "black";
  result: "win" | "loss" | "draw";
  /** Full moves, from the movetext. */
  moves: number;
  /** Only present when the game has already been reviewed on Chess.com. */
  accuracies?: { white: number; black: number };
  /** True when the opponent is one of Chess.com's bots. */
  vsBot: boolean;
}

/** Result codes that mean the game was drawn rather than lost. */
const DRAW_RESULTS = new Set([
  "agreed",
  "repetition",
  "stalemate",
  "insufficient",
  "50move",
  "timevsinsufficient",
]);

/** "900+10" → "15 + 10"; "1/86400" (daily) → "1 day". */
export function formatTimeControl(tc: string): string {
  if (tc.startsWith("1/")) {
    const days = Math.round(Number(tc.slice(2)) / 86400);
    return days === 1 ? "1 day" : `${days} days`;
  }
  const [base, inc] = tc.split("+");
  const secs = Number(base);
  const mins = secs % 60 === 0 ? secs / 60 : secs / 60;
  const left = Number.isInteger(mins) ? String(mins) : mins.toFixed(1);
  return inc ? `${left} + ${inc}` : left;
}

/** Highest full-move number in the movetext — cheaper than replaying the game. */
export function countMoves(pgn: string): number {
  let last = 0;
  const re = /(?:^|\s)(\d+)\.(?!\.)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(pgn))) last = Math.max(last, Number(m[1]));
  return last;
}

interface RawSide {
  username: string;
  rating: number;
  result: string;
  "@id"?: string;
  uuid?: string;
}
interface RawGame {
  url: string;
  pgn?: string;
  time_control: string;
  time_class: string;
  rated?: boolean;
  end_time: number;
  rules?: string;
  white: RawSide;
  black: RawSide;
  accuracies?: { white: number; black: number };
}

/**
 * Normalise one archive entry, from the point of view of `username`.
 * Returns null for anything that isn't a standard game we can review.
 */
export function normaliseGame(
  raw: RawGame,
  username: string,
): ArchivedGame | null {
  if (!raw.pgn || (raw.rules && raw.rules !== "chess")) return null;

  const lower = username.toLowerCase();
  const userSide =
    raw.white.username.toLowerCase() === lower ? "white" : "black";
  const mine = userSide === "white" ? raw.white : raw.black;

  const result: ArchivedGame["result"] =
    mine.result === "win"
      ? "win"
      : DRAW_RESULTS.has(mine.result)
        ? "draw"
        : "loss";

  return {
    id: raw.url.split("/").pop() ?? raw.url,
    url: raw.url,
    pgn: raw.pgn,
    timeClass: raw.time_class,
    timeControl: formatTimeControl(raw.time_control),
    rated: raw.rated ?? false,
    endTime: raw.end_time,
    white: {
      username: raw.white.username,
      rating: raw.white.rating,
      result: raw.white.result,
    },
    black: {
      username: raw.black.username,
      rating: raw.black.rating,
      result: raw.black.result,
    },
    userSide,
    result,
    moves: countMoves(raw.pgn),
    accuracies: raw.accuracies,
    // Bot games sit under /game/computer/ rather than /game/live/. Note the
    // public archive rarely publishes them at all, so this is usually false.
    vsBot: raw.url.includes("/game/computer/"),
  };
}

/** Country code → flag emoji, for the little flags beside each name. */
export function flagOf(code?: string): string {
  if (!code || code.length !== 2) return "";
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)),
  );
}

/**
 * An archived game in the dashboard table's shape, so one row component can
 * render either the sample data or a real archive.
 */
export function toGame(g: ArchivedGame): import("@/types").Game {
  const drawn = g.result === "draw";
  const score = (won: boolean) => (drawn ? 0.5 : won ? 1 : 0) as 0 | 0.5 | 1;
  const flag = (c?: string) => flagOf(c) || undefined;
  const cls = ["rapid", "blitz", "bullet", "daily"].includes(g.timeClass)
    ? (g.timeClass as import("@/types").TimeClass)
    : "rapid";

  return {
    id: g.id,
    timeControl: g.timeControl,
    timeClass: cls,
    white: {
      username: g.white.username,
      rating: g.white.rating,
      color: "white",
      countryFlag: flag(g.white.country),
      isBot: g.userSide === "black" && g.vsBot,
    },
    black: {
      username: g.black.username,
      rating: g.black.rating,
      color: "black",
      countryFlag: flag(g.black.country),
      isBot: g.userSide === "white" && g.vsBot,
    },
    result: g.result,
    whiteScore: score(g.white.result === "win"),
    blackScore: score(g.black.result === "win"),
    accuracy: g.accuracies,
    moves: g.moves,
    date: new Date(g.endTime * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    // "Reviewed" here means Chess.com already published accuracies for it; the
    // blind-spot mining is our own job and hasn't run.
    blindSpots: 0,
    reviewed: g.accuracies != null,
  };
}
