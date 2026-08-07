import { Chess } from "chess.js";
import type { StockfishEngine } from "@/lib/engine";
import { MATE_CP } from "@/lib/engine";
import type { Classified } from "@/lib/classify";
import type {
  MoveClassification,
  PieceColor,
  PuzzleCategory,
  PuzzleLinePly,
  PuzzleMove,
  SolvePuzzle,
} from "@/types";

/**
 * Turning a reviewed game into puzzles.
 *
 * A puzzle is one moment the member got wrong: the board is rewound to just
 * before their move, and they play the line the engine wanted instead. Only
 * mistakes with a *convincing* refutation survive — a puzzle whose answer wins
 * a tenth of a pawn teaches nothing, so the line has to end in mate or in a
 * clearly winning position.
 */

/** How deep the solution line is searched. Deeper than the sweep: this is the answer. */
const LINE_DEPTH = 12;

/** Half-moves of solution, at most. Odd, so the line finishes on the member's move. */
const MAX_LINE = 5;

/** Mistakes worth drilling, in the order we would rather show them. */
export const MINEABLE: MoveClassification[] = ["blunder", "missed", "mistake"];

/** Plies still counted as the opening, where a slip is an opening mistake. */
const OPENING_PLIES = 12;

const CATEGORY_OF: Record<string, PuzzleCategory> = {
  blunder: "blunder",
  mistake: "mistake",
  missed: "missed-opportunity",
};

export interface MineSource {
  gameId: string;
  pgn: string;
  opponent: string;
  opponentRating: number;
  userSide: PieceColor;
  /** Unix seconds — used only to order the candidate pool. */
  endTime: number;
}

/** A mistake we could build a puzzle from, before the engine has been asked. */
export interface Candidate {
  source: MineSource;
  /** 0-based index into the game's moves. */
  index: number;
  /** Position immediately before the mistake. */
  fen: string;
  played: PuzzleMove;
  category: PuzzleCategory;
  /** Win percentage thrown away — how badly this one hurt. */
  wpLoss: number;
  /** User-positive evaluation of what the member actually played. */
  startCp: number;
  startMate: number | null;
  moveNo: number;
}

const sideSign = (side: PieceColor) => (side === "white" ? 1 : -1);

/**
 * Every mistake in one game that is worth trying to build a puzzle from.
 * Sorted worst-first, so a game that fell apart offers its collapse and not its
 * mildest inaccuracy.
 */
export function findCandidates(
  source: MineSource,
  rows: Classified[],
): Candidate[] {
  const game = new Chess();
  try {
    game.loadPgn(source.pgn);
  } catch {
    return [];
  }

  const moves = game.history({ verbose: true });
  const replay = new Chess();
  const out: Candidate[] = [];
  const sign = sideSign(source.userSide);

  for (let i = 0; i < moves.length; i++) {
    const before = replay.fen();
    const m = moves[i];
    replay.move(m.san);

    const row = rows[i];
    if (!row) continue;
    const side: PieceColor = m.color === "w" ? "white" : "black";
    if (side !== source.userSide) continue;
    if (!MINEABLE.includes(row.classification)) continue;

    out.push({
      source,
      index: i,
      fen: before,
      played: { from: m.from, to: m.to, san: m.san },
      category:
        i < OPENING_PLIES
          ? "opening-mistake"
          : (CATEGORY_OF[row.classification] ?? "mistake"),
      wpLoss: row.wpLoss,
      startCp: row.cp * sign,
      startMate: row.mate === 0 ? 0 : row.mate == null ? null : row.mate * sign,
      moveNo: Math.floor(i / 2) + 1,
    });
  }

  return out.sort((a, b) => b.wpLoss - a.wpLoss);
}

/** Title and coach copy, written from what the line actually does. */
function copyFor(
  c: Candidate,
  line: PuzzleLinePly[],
  mateIn: number | null,
): { title: string; prompt: string; solvedLine: string } {
  const best = line[0];
  const gain = line[line.length - 1].cp - c.startCp;
  const sans = line.map((p) => p.san);

  const title = mateIn
    ? mateIn === 1
      ? "Missed Mate in One"
      : `Missed Mate in ${mateIn}`
    : gain >= 600
      ? "Missed a Winning Shot"
      : c.category === "blunder"
        ? "Threw Away the Advantage"
        : "There Was Better";

  const opening = c.category === "opening-mistake" ? " straight out of the opening" : "";
  const prompt = mateIn
    ? `On move ${c.moveNo} you played ${c.played.san} and let a forced mate slip${opening}. It is still there in this position — start it.`
    : `On move ${c.moveNo} you played ${c.played.san}${opening}, and the position turned. Something far stronger was available here. Find it.`;

  const rest = sans.slice(1).join(" ");
  const solvedLine = mateIn
    ? `${best.san}! ${rest ? `${rest} — ` : ""}checkmate.`
    : `${best.san}! ${rest ? `After ${rest}, ` : ""}the position is winning.`;

  return { title, prompt, solvedLine };
}

/**
 * Play out the engine's answer to one mistake and wrap it as a solvable puzzle.
 * Returns null when the refutation isn't convincing enough to be worth solving.
 */
export async function buildPuzzle(
  engine: StockfishEngine,
  c: Candidate,
): Promise<SolvePuzzle | null> {
  const board = new Chess(c.fen);
  const line: PuzzleLinePly[] = [];
  const userSide = c.source.userSide;

  for (let k = 0; k < MAX_LINE; k++) {
    if (board.isGameOver()) break;

    // The engine's move for whoever is on move — the member's answer first, the
    // opponent's best defence after it.
    const before = await engine.analyse(board.fen(), userSide, LINE_DEPTH);
    const uci = before.bestMove;
    if (!uci) break;

    const played = board.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.length > 4 ? uci.slice(4, 5) : "q",
    });
    if (!played) break;

    // Score the position we landed in rather than reusing the score above: a
    // mate distance counts down as the mating side moves, and only the position
    // itself knows how far along that count it is.
    const after = await engine.analyse(board.fen(), userSide, LINE_DEPTH);
    line.push({
      from: played.from,
      to: played.to,
      san: played.san,
      side: played.color === "w" ? "white" : "black",
      fen: board.fen(),
      cp: after.cp,
      mate: after.mate,
      isMate: board.isCheckmate(),
    });

    if (board.isCheckmate()) break;
  }

  // A line that trails off on the opponent's move leaves the member watching
  // rather than solving.
  while (line.length && line[line.length - 1].side !== userSide) line.pop();
  if (line.length === 0) return null;

  const first = line[0];
  // The engine agreed with the move that was played — nothing to teach.
  if (first.from === c.played.from && first.to === c.played.to) return null;

  const last = line[line.length - 1];
  // The line ends on the member's move, so their moves in it are the mate count.
  const mateIn = last.isMate
    ? line.filter((p) => p.side === userSide).length
    : null;
  const decisive = last.isMate || (last.cp >= 150 && last.cp - c.startCp >= 200);
  if (!decisive) return null;

  const { title, prompt, solvedLine } = copyFor(c, line, mateIn);

  return {
    id: `gbp-${c.source.gameId}-${c.index}`,
    category: c.category,
    fen: c.fen,
    orientation: userSide,
    sideToMove: userSide,
    played: c.played,
    start: {
      cp: Math.max(-MATE_CP, Math.min(MATE_CP, Math.round(c.startCp))),
      mate: c.startMate,
    },
    line,
    prompt,
    solvedLine,
    title,
    opponent: c.source.opponent,
    opponentRating: c.source.opponentRating,
    gameId: c.source.gameId,
    reviewPly: c.index + 1,
    archived: true,
  };
}
