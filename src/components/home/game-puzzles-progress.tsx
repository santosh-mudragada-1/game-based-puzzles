"use client";

import { ProgressBar } from "@/components/shared/progress";
import { usePuzzleProgress } from "@/hooks/use-puzzle-progress";

/**
 * The count on the home hero's "Game Puzzles" card.
 *
 * Reads the same shared progress the puzzle queue writes to, so solving a puzzle
 * moves this immediately — the two screens can't drift the way a hardcoded
 * figure did.
 */
export function GamePuzzlesProgress() {
  const { solved, total } = usePuzzleProgress();

  return (
    <div className="min-w-0 flex-1">
      <p className="truncate text-[15px] text-ink">
        <span className="font-display font-bold tabular-nums text-ink">
          {solved}/{total}
        </span>{" "}
        <span className="text-ink-muted">completed</span>
      </p>
      <ProgressBar
        value={total ? (solved / total) * 100 : 0}
        color="brand"
        trackClassName="h-2.5"
        className="mt-2"
        label="Game puzzles completed"
      />
    </div>
  );
}
