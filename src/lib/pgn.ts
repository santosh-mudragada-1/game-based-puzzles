import { Chess } from "chess.js";
import type {
  ClassificationRow,
  GeneratedPuzzle,
  MoveClassification,
  PieceColor,
  PlayerRef,
} from "@/types";

/** The user's own game (Chess.com export). */
export const REVIEW_PGN = `[Event "Live Chess"]
[Site "Chess.com"]
[Date "2026.07.23"]
[White "jazzzzzzzyyyyy"]
[Black "santoshmudragada"]
[Result "0-1"]
[ECO "B20"]
[WhiteElo "511"]
[BlackElo "1128"]
[TimeControl "900+10"]
[Termination "santoshmudragada won by checkmate"]

1. e4 {[%clk 0:15:10]} 1... c5 {[%clk 0:15:10]} 2. Bc4 {[%clk 0:15:13.4]} 2... e6 {[%clk 0:15:17.6]} 3. e5 $6 {[%clk 0:15:19.9][%c_effect e5;square;e5;type;Inaccuracy]} 3... a6 {[%clk 0:15:23.7]} 4. Nf3 {[%clk 0:15:23.6]} 4... b5 {[%clk 0:15:32]} 5. Be2 {[%clk 0:15:17.3]} 5... Bb7 {[%clk 0:15:36.6]} 6. c4 {[%clk 0:15:18.3]} 6... Ne7 {[%clk 0:15:34.4]} 7. cxb5 {[%clk 0:15:24.9]} 7... axb5 {[%clk 0:15:38.2]} 8. Bxb5 {[%clk 0:15:33.2]} 8... Nf5 {[%clk 0:15:40.2]} 9. Nc3 {[%clk 0:15:16.5]} 9... Be7 {[%clk 0:15:38.3]} 10. O-O {[%clk 0:15:13.3]} 10... O-O {[%clk 0:15:45.6]} 11. d3 {[%clk 0:15:19.2]} 11... h6 {[%clk 0:15:51.7]} 12. Na4 $2 {[%clk 0:15:21.2][%c_effect a4;square;a4;type;Mistake]} 12... Nd4 {[%clk 0:15:49.2]} 13. Nxd4 {[%clk 0:15:16.5]} 13... cxd4 {[%clk 0:15:57.4]} 14. b4 {[%clk 0:14:58.8]} 14... Nc6 {[%clk 0:15:51.4]} 15. Nc5 {[%clk 0:14:54.2]} 15... Bxc5 {[%clk 0:15:40.5]} 16. bxc5 {[%clk 0:15:01.2]} 16... Qa5 {[%clk 0:15:41.6]} 17. Qb3 {[%clk 0:14:47.8]} 17... Nxe5 {[%clk 0:15:44.7]} 18. g3 {[%clk 0:14:16.5]} 18... Rab8 {[%clk 0:15:39.9]} 19. f4 {[%clk 0:14:13.4]} 19... Ng4 {[%clk 0:15:41.1]} 20. Bxd7 {[%clk 0:14:12]} 20... Qxc5 {[%clk 0:15:13.7]} 21. Ba3 {[%clk 0:13:54.1]} 21... Qh5 {[%clk 0:15:00.4]} 22. h4 {[%clk 0:13:38.7]} 22... Rfd8 {[%clk 0:14:28.6]} 23. Bc6 $2 {[%clk 0:13:24.1][%c_effect c6;square;c6;type;Mistake]} 23... Bxc6 {[%clk 0:14:35.8]} 24. Qc4 {[%clk 0:13:09.2]} 24... Ne3 {[%clk 0:14:12.2]} 25. Qxc6 {[%clk 0:13:07]} 25... Nxf1 {[%clk 0:14:10.9]} 26. Rxf1 {[%clk 0:13:13.6]} 26... Rbc8 {[%clk 0:14:17.4]} 27. Qf3 {[%clk 0:12:57.7]} 27... Qxf3 {[%clk 0:13:57.5]} 28. Rxf3 {[%clk 0:13:05.3]} 28... Ra8 {[%clk 0:14:06.1]} 29. Be7 {[%clk 0:12:51.3]} 29... Re8 {[%clk 0:14:11.9]} 30. Bc5 {[%clk 0:12:29.1]} 30... Rxa2 {[%clk 0:14:15.1]} 31. Bxd4 {[%clk 0:12:36.4]} 31... Rd8 {[%clk 0:14:19.8]} 32. Be5 {[%clk 0:12:36.2]} 32... Rd2 {[%clk 0:14:21.4]} 33. d4 {[%clk 0:12:05.2]} 33... Rd1+ {[%clk 0:14:26]} 34. Kg2 {[%clk 0:11:38.3]} 34... Ra8 {[%clk 0:14:19.1]} 35. Rc3 {[%clk 0:10:46.7]} 35... Ra2+ {[%clk 0:14:14.1]} 36. Kf3 {[%clk 0:10:49.4]} 36... f5 {[%clk 0:14:13.4]} 37. Rc8+ {[%clk 0:10:39.9]} 37... Kh7 {[%clk 0:13:52]} 38. Rc3 {[%clk 0:08:40.5]} 38... Rf1+ {[%clk 0:13:46.3]} 39. Ke3 {[%clk 0:08:42.1]} 39... Rg2 {[%clk 0:13:33.2]} 40. d5 {[%clk 0:07:41.1]} 40... Rxg3+ {[%clk 0:13:23]} 41. Ke2 {[%clk 0:07:35.8]} 41... Rxc3 {[%clk 0:12:12.8]} 42. Bxc3 {[%clk 0:07:25]} 42... Rxf4 {[%clk 0:12:06.1]} 43. dxe6 {[%clk 0:07:28.5]} 43... Re4+ {[%clk 0:12:11.2]} 44. Kf3 {[%clk 0:06:51.8]} 44... Rxe6 {[%clk 0:12:18]} 45. Kg3 {[%clk 0:06:18.3]} 45... Re3+ {[%clk 0:12:24.1]} 46. Kf4 {[%clk 0:06:18.9]} 46... Rxc3 {[%clk 0:12:34]} 47. Kxf5 {[%clk 0:06:27]} 47... g6+ {[%clk 0:12:35.3]} 48. Kg4 {[%clk 0:06:35.1]} 48... Rc4+ {[%clk 0:12:43.4]} 49. Kh3 {[%clk 0:06:43]} 49... g5 {[%clk 0:12:44.8]} 50. hxg5 {[%clk 0:06:48]} 50... hxg5 {[%clk 0:12:53.1]} 51. Kg3 {[%clk 0:06:50.4]} 51... Kh6 {[%clk 0:13:01.1]} 52. Kh3 {[%clk 0:06:52.2]} 52... Kh5 {[%clk 0:13:09.5]} 53. Kh2 {[%clk 0:06:59.5]} 53... Rc3 {[%clk 0:13:18.5]} 54. Kg2 {[%clk 0:06:59.7]} 54... g4 {[%clk 0:13:27.4]} 55. Kf2 {[%clk 0:07:06.1]} 55... Kh4 {[%clk 0:13:24.7]} 56. Kg1 {[%clk 0:07:09.4]} 56... g3 {[%clk 0:13:33.4]} 57. Kg2 {[%clk 0:07:17.3]} 57... Rc2+ {[%clk 0:13:39.6]} 58. Kf3 {[%clk 0:07:19.8]} 58... g2 {[%clk 0:13:47.9]} 59. Ke3 {[%clk 0:07:24.1]} 59... g1=Q+ {[%clk 0:13:56.5]} 60. Kd3 {[%clk 0:07:32.5]} 60... Qd1+ {[%clk 0:14:01.3]} 61. Ke4 {[%clk 0:07:38.9]} 61... Re2+ {[%clk 0:14:09.7]} 62. Kf5 {[%clk 0:07:46.9]} 62... Qf1+ {[%clk 0:14:19.2]} 63. Kg6 {[%clk 0:07:55.3]} 63... Rg2+ {[%clk 0:14:26.3]} 64. Kh6 {[%clk 0:08:03.4]} 64... Qf6+ {[%clk 0:14:34.5]} 65. Kh7 {[%clk 0:08:11.7]} 65... Qg7# {[%clk 0:14:43.3][%c_effect h7;square;h7;type;CheckmateWhite]} 0-1`;

export interface ReviewPly {
  ply: number; // 1-based
  moveNo: number; // full move number
  side: PieceColor;
  san: string;
  from: string;
  to: string;
  fen: string; // position after the move
  classification: MoveClassification;
  evalCp: number; // white-positive centipawns (material heuristic)
  clock: string; // "13:24"
}

export type PhaseRating = "great" | "good" | "ok";
export interface PhaseRow {
  phase: string;
  white: PhaseRating;
  black: PhaseRating;
}

export interface ReviewModel {
  white: PlayerRef;
  black: PlayerRef;
  opening: string;
  userSide: PieceColor;
  plies: ReviewPly[];
  counts: ClassificationRow[];
  accuracy: { white: number; black: number };
  gameRating: { white: number; black: number };
  phases: PhaseRow[];
}

// Chess.com's Game Review order (Book sits third, before Best).
const CLASS_ORDER: MoveClassification[] = [
  "brilliant",
  "great",
  "book",
  "best",
  "excellent",
  "good",
  "inaccuracy",
  "mistake",
  "missed",
  "blunder",
];

/**
 * The real per-classification counts Chess.com reported for this game
 * (White = jazzzzzzzyyyyy, Black = santoshmudragada). Hardcoded so the
 * overview table is faithful rather than derived from a fake heuristic.
 */
const REAL_COUNTS: Record<
  MoveClassification,
  { white: number; black: number }
> = {
  brilliant: { white: 0, black: 0 },
  great: { white: 1, black: 1 },
  book: { white: 2, black: 2 },
  best: { white: 21, black: 21 },
  excellent: { white: 19, black: 20 },
  good: { white: 9, black: 13 },
  inaccuracy: { white: 4, black: 5 },
  mistake: { white: 3, black: 1 },
  missed: { white: 2, black: 2 },
  blunder: { white: 1, black: 0 },
};

/**
 * A hand-authored evaluation curve (white-positive centipawns; negative = Black
 * better) that actually tracks the game — roughly level in the opening, then
 * swinging decisively to Black as White's mistakes pile up and Black promotes.
 * Material-only eval was flat 0.0 for most moves and contradicted the move
 * classifications shown beside it.
 */
const EVAL_POINTS: [number, number][] = [
  [0, 0],
  [4, 20],
  [6, 10],
  [10, -20],
  [16, -55],
  [22, -80],
  [24, -150],
  [30, -170],
  [34, -150],
  [40, -205],
  [44, -195],
  [46, -290],
  [50, -360],
  [56, -330],
  [62, -390],
  [70, -430],
  [80, -480],
  [90, -545],
  [100, -640],
  [110, -820],
  [117, -1150],
  [118, -1500],
  [124, -1560],
  [130, -1650],
];

function evalCurve(ply: number): number {
  const pts = EVAL_POINTS;
  if (ply <= pts[0][0]) return pts[0][1];
  const last = pts[pts.length - 1];
  if (ply >= last[0]) return last[1];
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    if (ply <= x1) {
      const t = (ply - x0) / (x1 - x0);
      return Math.round(y0 + (y1 - y0) * t);
    }
  }
  return last[1];
}

/**
 * Extra classification markers (beyond the PGN's own annotations at plies
 * 5/23/45/130) placed where the eval curve actually swings for the moving
 * side, so the graph's coloured dots sit on real cliffs rather than flat runs.
 * Odd ply = White, even ply = Black.
 */
const DOT_OVERRIDES: Record<number, MoveClassification> = {
  15: "inaccuracy", // White — early slide
  24: "great", // Black — punishes 12.Na4?
  34: "inaccuracy", // Black — lets the edge dip
  52: "inaccuracy", // Black — a wobble in the conversion
  113: "mistake", // White — the endgame collapses
  115: "blunder", // White — and collapses further
  118: "great", // Black — promotes (…g1=Q)
};

const TYPE_MAP: Record<string, MoveClassification> = {
  brilliant: "brilliant",
  great: "great",
  best: "best",
  excellent: "excellent",
  good: "good",
  book: "book",
  inaccuracy: "inaccuracy",
  mistake: "mistake",
  miss: "missed",
  missed: "missed",
  blunder: "blunder",
  winner: "best",
  checkmatewhite: "best",
  checkmateblack: "best",
};

function classifyComment(comment: string): MoveClassification | undefined {
  const m = /type;([A-Za-z]+)/.exec(comment);
  return m ? TYPE_MAP[m[1].toLowerCase()] : undefined;
}

function parseClock(comment: string): string {
  const m = /%clk\s+\d+:(\d+):(\d+)/.exec(comment);
  if (!m) return "";
  return `${parseInt(m[1], 10)}:${m[2].padStart(2, "0")}`;
}

/**
 * Deterministic filler for un-annotated moves. Most moves are "excellent" or
 * "good" (which the move list leaves un-badged); only ~30% are "best" so the
 * list shows a scattering of stars rather than one on every row.
 */
function fillerClass(ply: number): MoveClassification {
  if (ply <= 4) return "book";
  const r = (ply * 7) % 10;
  if (r < 3) return "excellent"; // 0–2
  if (r < 7) return "good"; // 3–6
  return "best"; // 7–9  (~30%)
}

function buildModel(): ReviewModel {
  const game = new Chess();
  game.loadPgn(REVIEW_PGN);
  const header = game.header();
  const verbose = game.history({ verbose: true });

  const commentByFen = new Map<string, string>();
  for (const c of game.getComments()) commentByFen.set(c.fen, c.comment);

  const replay = new Chess();
  const plies: ReviewPly[] = verbose.map((m, i) => {
    replay.move(m.san);
    const fen = replay.fen();
    const comment = commentByFen.get(fen) ?? "";
    return {
      ply: i + 1,
      moveNo: Math.floor(i / 2) + 1,
      side: (m.color === "w" ? "white" : "black") as PieceColor,
      san: m.san,
      from: m.from,
      to: m.to,
      fen,
      classification:
        classifyComment(comment) ?? DOT_OVERRIDES[i + 1] ?? fillerClass(i + 1),
      evalCp: evalCurve(i + 1),
      clock: parseClock(comment),
    };
  });

  const counts: ClassificationRow[] = CLASS_ORDER.map((c) => ({
    classification: c,
    white: REAL_COUNTS[c].white,
    black: REAL_COUNTS[c].black,
  }));

  return {
    white: {
      username: header.White ?? "White",
      rating: Number(header.WhiteElo ?? 0),
      color: "white",
      countryFlag: "🇮🇳",
    },
    black: {
      username: header.Black ?? "Black",
      rating: Number(header.BlackElo ?? 0),
      color: "black",
      countryFlag: "🇮🇳",
    },
    opening: "Sicilian Defense: Bowdler Attack",
    userSide: "black",
    plies,
    counts,
    accuracy: { white: 75.7, black: 79.3 },
    gameRating: { white: 1000, black: 1400 },
    phases: [
      { phase: "Opening", white: "good", black: "good" },
      { phase: "Middlegame", white: "ok", black: "ok" },
      { phase: "Endgame", white: "ok", black: "great" },
    ],
  };
}

export const reviewModel: ReviewModel = buildModel();

/**
 * Move classifications worth badging in the move list and stepping to via the
 * "Next" button. Everything else (excellent / good / inaccuracy / non-final
 * book) is left un-badged to keep the list uncluttered.
 */
const NOTABLE_CLASSES = new Set<MoveClassification>([
  "brilliant",
  "great",
  "best",
  "mistake",
  "missed",
  "blunder",
]);

function computeNotable(model: ReviewModel): Set<number> {
  // Only the *final* book move (the last one before leaving theory) is badged.
  let lastBook = 0;
  for (const p of model.plies) if (p.classification === "book") lastBook = p.ply;
  const set = new Set<number>();
  for (const p of model.plies) {
    if (
      NOTABLE_CLASSES.has(p.classification) ||
      (p.classification === "book" && p.ply === lastBook)
    ) {
      set.add(p.ply);
    }
  }
  return set;
}

/** Ply numbers (1-based) that the move list badges and "Next" jumps between. */
export const notablePlySet: Set<number> = computeNotable(reviewModel);

/** Sorted list of the notable plies, for "play to the next important move". */
export const notablePlies: number[] = [...notablePlySet].sort((a, b) => a - b);

const PIECE_VAL: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

export interface SuggestedMove {
  san: string;
  from: string;
  to: string;
}

/**
 * A heuristic "best move" for the position *before* the given ply (1-based).
 * This is not a real engine — it scores legal moves by mate/check, winning
 * captures (MVV-LVA) and central targets — but it always returns a legal,
 * plausible move so the "Best" button never shows nonsense.
 */
export function suggestBestMove(
  model: ReviewModel,
  currentPly: number,
): SuggestedMove | null {
  try {
    const before =
      currentPly >= 2 ? model.plies[currentPly - 2].fen : undefined;
    const g = before ? new Chess(before) : new Chess();
    const moves = g.moves({ verbose: true });
    if (moves.length === 0) return null;
    let best = moves[0];
    let bestScore = -Infinity;
    for (const m of moves) {
      let s = 0;
      if (m.san.includes("#")) s += 1000;
      else if (m.san.includes("+")) s += 3;
      if (m.captured) s += 10 * PIECE_VAL[m.captured] - PIECE_VAL[m.piece];
      if (m.promotion) s += 8;
      const file = m.to.charCodeAt(0) - 97;
      const rank = Number(m.to[1]) - 1;
      s += 2 - (Math.abs(3.5 - file) + Math.abs(3.5 - rank)) / 4;
      if (s > bestScore) {
        bestScore = s;
        best = m;
      }
    }
    return { san: best.san, from: best.from, to: best.to };
  } catch {
    return null;
  }
}

/** 3 puzzles mined from this game's critical moments (positions before the reply). */
const PUZZLE_DEFS: Array<{
  ply: number;
  title: string;
  classification: MoveClassification;
  blurb: string;
}> = [
  {
    ply: 23, // after 12.Na4? — Black to move
    title: "Knight Fork",
    classification: "mistake",
    blurb: "White just played Na4? — a central knight jump forks the position.",
  },
  {
    ply: 45, // after 23.Bc6? — Black to move
    title: "Win the Bishop",
    classification: "mistake",
    blurb: "Bc6? walks into a capture. How do you cash in cleanly?",
  },
  {
    ply: 117, // after 59.Ke3 — Black to move
    title: "Promote to Win",
    classification: "best",
    blurb: "Convert the extra pawn — force the new queen and finish it.",
  },
];

export const gamePuzzles: GeneratedPuzzle[] = PUZZLE_DEFS.map((d, i) => {
  const ply = reviewModel.plies[d.ply - 1];
  return {
    id: `gp-${i + 1}`,
    title: d.title,
    classification: d.classification,
    fen: ply?.fen ?? reviewModel.plies[reviewModel.plies.length - 1].fen,
    orientation: "black",
    sideToMove: "black",
    moveNo: ply?.moveNo ?? 0,
    blurb: d.blurb,
  };
});
