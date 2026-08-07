import type { SearchLimits } from "@/lib/engine";

/**
 * Chess.com's own engine settings, as configured in Settings → Engine.
 *
 * Two jobs, two budgets, exactly as the panel splits them:
 *
 * **Game Review** — Stockfish 16, "Fast (~1 sec, 3270 Rating)". A second per
 * move, over every position of the game. This is the sweep behind the archive
 * and the lines the puzzles are built from.
 *
 * **Analysis** — Stockfish 18 Lite, "Maximum Time 5 sec", "Number of Lines 3".
 * The engine behind the eval bar, where one position is being stared at and it
 * is worth thinking properly about it.
 *
 * Both run on the same Stockfish 18 Lite WASM build — the 7MB download named in
 * the Analysis row — because the browser gets one engine, not two. What is
 * faithfully reproduced is the part that changes the answer: the time budget
 * and the number of lines. The "3270 Rating" in the Game Review row describes
 * full-strength Stockfish 16 on Chess.com's servers and isn't something a
 * WASM build in a tab can be held to.
 */

/**
 * Per move for the review pass.
 *
 * "Fast (~1 sec)" is a second of *Chess.com's server* — full-strength Stockfish
 * 16 across many cores. A browser tab has one thread per worker, so the honest
 * translation is not the wall-clock but the arithmetic: twenty games is ~1,400
 * positions, and reviewing them inside two minutes leaves ~340ms of thinking
 * per position on a four-core machine, whatever way the workers are arranged.
 * 250ms sits under that with room to spare, reaches depth 15-16 on three lines,
 * and is still six times the thinking the old depth-14 single-line search did.
 *
 * Raise it for a stronger review: the cost is linear and entirely predictable —
 * wall time = positions ÷ workers × movetime.
 */
export const REVIEW_LIMITS: SearchLimits = {
  movetime: 250,
  // A depth to stop at as well, so a forced recapture in a dead endgame doesn't
  // spend its whole allowance proving what it already knows.
  depth: 18,
  // Three lines, so a move that was the *only* move can be told apart from one
  // of several good ones — what makes a "Great" move great.
  multiPv: 3,
};

/** The interactive eval bar — "Maximum Time 5 sec", "Number of Lines 3". */
export const ANALYSIS_LIMITS: SearchLimits = {
  movetime: 5000,
  depth: 22,
  multiPv: 3,
};

/** Names, for anywhere the UI wants to say what it is running. */
export const ENGINE_LABEL = {
  review: "Stockfish 16",
  analysis: "Stockfish 18 Lite",
} as const;
