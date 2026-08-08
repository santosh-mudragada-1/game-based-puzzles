"use client";

import * as React from "react";

import { useReviews, DAILY_PUZZLE_TARGET } from "@/hooks/use-reviews";
import { useVersion, V1_WINDOW } from "@/hooks/use-version";
import { CATEGORY_PLURAL, solvePuzzles } from "@/data/solve-puzzles";
import { demoSchedule } from "@/lib/daily-demo";
import type { PuzzleCategory, SolvePuzzle } from "@/types";

export interface ActivePuzzles {
  /** The queue every counter in the app is measured against. */
  puzzles: SolvePuzzle[];
  /** True when these came out of the member's own games rather than the sample set. */
  live: boolean;
  /** Still being mined out of the reviewed games. */
  mining: boolean;
  /** Puzzles the set is aiming for. */
  target: number;
  /** Theme rows for the start screen, counted from the queue itself. */
  categories: { category: PuzzleCategory; label: string; count: number }[];
  /** v2: every day that has puzzles, newest first. */
  days: string[];
  /** v2: the day on screen. */
  day: string | null;
  /** v2: the whole month, so the calendar can tick off the days you've cleared. */
  schedule: Map<string, SolvePuzzle[]>;
}

/**
 * The puzzles on offer right now.
 *
 * Two versions read the same mined pool differently. **v1** takes the best of
 * the last ten games as one standing set. **v2** treats the pool as a diary and
 * hands back the puzzles from the games played on one particular day, so the
 * set is as long as that day's chess deserved — no target, no padding.
 *
 * With no account (or before the first game is read) the authored sample set
 * stands in, so the flow is never empty.
 */
export function useActivePuzzles(): ActivePuzzles {
  const { puzzles, pool, mining } = useReviews();
  const { version, day, setDay } = useVersion();

  /*
    The v2 month.

    Built from whatever real puzzles exist — mined ones once the sweep has found
    any, the authored sample set before that — so this version has nothing to
    wait for. It is a prototype of a shape, and the shape is legible whether or
    not the dates it is drawn on are the ones you actually played.
  */
  const schedule = React.useMemo(() => {
    if (version !== "v2") return new Map<string, SolvePuzzle[]>();
    // Your own games first, then the authored set behind them — enough distinct
    // material for a month that never shows the same position twice.
    const seen = new Set<string>();
    const source = [...pool, ...solvePuzzles].filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
    return demoSchedule(source);
  }, [version, pool]);

  /** Days that hold puzzles, newest first. */
  const days = React.useMemo(
    () => [...schedule.keys()].sort((a, b) => b.localeCompare(a)),
    [schedule],
  );

  // Land on the most recent day that has something in it. "Today" is only the
  // right default for somebody who played today; for everyone else it is an
  // empty screen that makes the feature look broken.
  const activeDay = day ?? days[0] ?? null;
  React.useEffect(() => {
    if (version === "v2" && day == null && days.length) setDay(days[0]);
  }, [version, day, days, setDay]);

  const live = version === "v2" ? days.length > 0 : puzzles.length > 0;

  const list = React.useMemo(() => {
    if (version === "v2") {
      return (activeDay && schedule.get(activeDay)) || [];
    }
    if (!live) return solvePuzzles;
    return puzzles.slice(0, DAILY_PUZZLE_TARGET);
  }, [live, version, activeDay, schedule, puzzles]);

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
    // A v2 day is complete the moment it is dealt. The background sweep may
    // still be running for v1, but saying "still reviewing for more" over a
    // finished day promises puzzles that are never going to arrive.
    mining: version === "v2" ? false : mining,
    // Both versions report what the games actually held. There is no daily
    // quota to fall short of any more — a day is as long as it is.
    target: list.length,
    categories,
    days,
    day: activeDay,
    schedule,
  };
}

/** Games a v1 set is drawn from — quoted in the copy, so it lives with it. */
export { V1_WINDOW };
