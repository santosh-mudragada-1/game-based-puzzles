import type { MoveClassification } from "@/types";

/**
 * Move classification, shared by the baked analysis of the sample game and the
 * live analysis of any game pulled off Chess.com — so both read the same way.
 *
 * Everything is expressed in *win percentage*, not centipawns: giving up half a
 * pawn in a dead-equal position matters, giving it up when you're a rook ahead
 * does not, and the win curve is what captures that.
 */

/** Lichess/Chess.com's win model. `cp` is from the mover's point of view. */
export function winPct(cp: number): number {
  const c = Math.max(-1000, Math.min(1000, cp));
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * c)) - 1);
}

export interface PositionEval {
  /** White-positive centipawns, clamped to ±3000. */
  cp: number;
  /** White-positive forced-mate distance; 0 once mate is on the board. */
  mate: number | null;
  /** The engine's move in UCI form, for spotting whether it was found. */
  bestMove?: string | null;
  /** White-positive score of the second-best line, when known. */
  secondCp?: number | null;
}

export interface MoveInput {
  san: string;
  from: string;
  to: string;
  side: "white" | "black";
  /** Evaluation of the position *before* the move. */
  before: PositionEval;
  /** Evaluation of the position *after* it. */
  after: PositionEval;
  /** 0-based index in the game. */
  index: number;
}

export interface Classified {
  classification: MoveClassification;
  /** Win percentage the mover gave up — 0 when they found the best move. */
  wpLoss: number;
  /** Evaluation after the move, white-positive. */
  cp: number;
  mate: number | null;
}

const CLAMP = (v: number) => Math.max(-3000, Math.min(3000, v));

export function classifyMove(m: MoveInput): Classified {
  const sign = m.side === "white" ? 1 : -1;
  const mated = m.san.endsWith("#");

  // Stockfish reports a mated position as "mate 0" with no principal variation,
  // which arrives as a 0 — so a delivered mate is written in explicitly.
  const afterCp = mated ? 3000 * sign : CLAMP(m.after.cp);
  const afterMate = mated ? 0 : m.after.mate;

  const bBefore = CLAMP(m.before.cp) * sign;
  const cAfter = afterCp * sign;
  const wpLoss = Math.max(0, winPct(bBefore) - winPct(cAfter));

  const uci = m.from + m.to;
  const playedBest =
    !!m.before.bestMove && m.before.bestMove.slice(0, 4) === uci.slice(0, 4);

  const hadMate = m.before.mate != null && m.before.mate * sign > 0;
  const keptMate = afterMate != null && afterMate * sign > 0;
  const missedWin =
    (hadMate && !keptMate) || (bBefore >= 500 && cAfter < 150 && wpLoss > 8);

  // "Great" is the only move that holds — and only worth saying while the game
  // is still in the balance; a forced recapture in a won position isn't.
  const second = m.before.secondCp == null ? null : m.before.secondCp * sign;
  const onlyMove =
    playedBest &&
    second != null &&
    Math.abs(bBefore) < 400 &&
    winPct(bBefore) - winPct(second) > 18;

  let classification: MoveClassification;
  if (m.index < 4) classification = "book";
  // Delivering mate ends the game — the engine reports "no mate available"
  // afterwards, which would otherwise read as having missed one.
  else if (mated) classification = "best";
  else if (missedWin) classification = "missed";
  else if (onlyMove) classification = "great";
  else if (playedBest) classification = "best";
  else if (wpLoss <= 2) classification = "excellent";
  else if (wpLoss <= 5) classification = "good";
  else if (wpLoss <= 10) classification = "inaccuracy";
  else if (wpLoss <= 20) classification = "mistake";
  else classification = "blunder";

  return { classification, wpLoss, cp: Math.round(afterCp), mate: afterMate };
}

/**
 * Accuracy from a side's *average* win-percentage loss. Averaging per-move
 * accuracy instead lets a wall of forced recaptures drown out the blunders and
 * hands a 500-rated player a 91%.
 */
export function accuracyFrom(losses: number[]): number {
  if (losses.length === 0) return 0;
  const mean = losses.reduce((s, x) => s + x, 0) / losses.length;
  const a = 103.1668 * Math.exp(-0.04354 * mean) - 3.1669;
  return Math.round(Math.max(0, Math.min(100, a)) * 10) / 10;
}
