"use client";

import { useReviews, DAILY_PUZZLE_TARGET } from "@/hooks/use-reviews";
import { CATEGORY_PLURAL, solvePuzzles } from "@/data/solve-puzzles";
import type { PuzzleCategory, SolvePuzzle } from "@/types";

export interface ActivePuzzles {
  /** The queue every counter in the app is measured against. */
  puzzles: SolvePuzzle[];
  /** True when these came out of the member's own games rather than the sample set. */
  live: boolean;
  /** Still being mined out of the reviewed games. */
  mining: boolean;
  /** Puzzles the day is aiming for. */
  target: number;
  /** Theme rows for the start screen, counted from the queue itself. */
  categories: { category: PuzzleCategory; label: string; count: number }[];
}

/**
 * The puzzles on offer right now.
 *
 * Once an account is connected these are mined from that member's own reviewed
 * games; with no account (or before the first one is found) the authored sample
 * set stands in, so the flow is never empty.
 */
export function useActivePuzzles(): ActivePuzzles {
  const { puzzles, mining } = useReviews();
  const live = puzzles.length > 0;
  // The day is fifteen puzzles. More than that can be mined — several games
  // finish at once and each brings its own — but the extras stay in the games
  // they came from rather than turning the day's set into a longer number.
  const list = live ? puzzles.slice(0, DAILY_PUZZLE_TARGET) : solvePuzzles;

  const categories = (Object.keys(CATEGORY_PLURAL) as PuzzleCategory[])
    .map((category) => ({
      category,
      label: CATEGORY_PLURAL[category],
      count: list.filter((p) => p.category === category).length,
    }))
    .filter((c) => c.count > 0);

  return {
    puzzles: list,
    live,
    mining,
    // Fifteen while there is still mining to come, so the day reads as the day
    // it is aiming to be. Once the engine has stopped, the target is whatever it
    // actually found — an archive that only had eleven tactics in it should say
    // "11", not leave someone stuck at 11/15 with nothing left to solve.
    target: live ? (mining ? DAILY_PUZZLE_TARGET : list.length) : list.length,
    categories,
  };
}
