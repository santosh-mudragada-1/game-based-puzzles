"use client";

import * as React from "react";
import { useActivePuzzles } from "@/hooks/use-active-puzzles";
import type { PuzzleOutcome } from "@/types";

/** Ordering for "keep the best attempt" when a puzzle is replayed. */
const RANK: Record<PuzzleOutcome, number> = {
  failed: 0,
  "solved-hint": 1,
  "solved-clean": 2,
};

interface PuzzleProgressValue {
  /** Best outcome per puzzle id, across every session this visit. */
  record: Record<string, PuzzleOutcome>;
  /** File an attempt. Only ever upgrades a puzzle's standing, never downgrades. */
  recordOutcome: (puzzleId: string, outcome: PuzzleOutcome) => void;
  /** Puzzles finished with a solve (clean or hinted). */
  solved: number;
  /** Puzzles solved with no hint, reveal or wrong move. */
  clean: number;
  /** Puzzles finished at least once, however they went. */
  attempted: number;
  /** Puzzles that were finished but not cleanly — the retry pool. */
  unsolved: number;
  /** Size of the whole queue. */
  total: number;
}

const PuzzleProgressContext = React.createContext<PuzzleProgressValue | null>(
  null,
);

/**
 * One source of truth for puzzle progress, shared by every screen.
 *
 * Lives above the routes so the home card and the puzzle queue can never
 * disagree — solving a puzzle updates both immediately, with no refetch and no
 * refresh. Deliberately **not** persisted: this is a feature prototype, and a
 * reviewer should get a clean slate on reload (only the chosen plan sticks).
 */
export function PuzzleProgressProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [record, setRecord] = React.useState<Record<string, PuzzleOutcome>>({});
  // Measured against whatever queue is live — the member's own mined puzzles
  // once their games have been reviewed, the sample set until then.
  const { puzzles, target } = useActivePuzzles();

  const recordOutcome = React.useCallback(
    (puzzleId: string, outcome: PuzzleOutcome) => {
      setRecord((prev) => {
        const held = prev[puzzleId];
        if (held != null && RANK[outcome] <= RANK[held]) return prev;
        return { ...prev, [puzzleId]: outcome };
      });
    },
    [],
  );

  const value = React.useMemo<PuzzleProgressValue>(() => {
    /*
      Counted against the day's queue, not against everything ever solved.

      The record also holds puzzles solved from a single game's "Solve" button,
      and puzzles that were in the set before it was re-ranked and are no longer
      in it. Both are real outcomes worth keeping — but counting them against a
      fifteen-puzzle day is how a meter ends up reading 16/15.
    */
    const outcomes = puzzles
      .map((p) => record[p.id])
      .filter((o): o is PuzzleOutcome => o != null);
    return {
      record,
      recordOutcome,
      solved: outcomes.filter((o) => o.startsWith("solved")).length,
      clean: outcomes.filter((o) => o === "solved-clean").length,
      attempted: outcomes.length,
      unsolved: outcomes.filter((o) => o !== "solved-clean").length,
      total: target,
    };
  }, [record, recordOutcome, puzzles, target]);

  return (
    <PuzzleProgressContext.Provider value={value}>
      {children}
    </PuzzleProgressContext.Provider>
  );
}

export function usePuzzleProgress(): PuzzleProgressValue {
  const ctx = React.useContext(PuzzleProgressContext);
  if (!ctx) {
    throw new Error("usePuzzleProgress must be used within PuzzleProgressProvider");
  }
  return ctx;
}
