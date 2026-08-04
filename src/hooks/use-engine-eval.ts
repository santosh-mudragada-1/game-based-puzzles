"use client";

import * as React from "react";
import { getEngine, EMPTY_EVAL, type EngineEval } from "@/lib/engine";
import type { PieceColor } from "@/types";

export interface EngineEvalState extends EngineEval {
  /** True until the first score for the current position lands. */
  thinking: boolean;
  /** True when the engine couldn't boot — the caller's fallback is in use. */
  failed: boolean;
}

interface Options {
  /** Target search depth. 16 is instant on the lite build and plenty here. */
  depth?: number;
  /** Skip analysis entirely (e.g. no puzzle on screen). */
  enabled?: boolean;
  /**
   * Authored eval to show while the engine is still thinking, and to keep if it
   * fails to load — so the prototype degrades to the pre-baked numbers rather
   * than a dead bar.
   */
  fallback?: { cp: number; mate: number | null };
}

/**
 * Evaluate a position with Stockfish, reported from `userSide`'s point of view
 * (positive = the solver is better). Scores stream in as the search deepens, and
 * a position change supersedes the previous search rather than queueing behind it.
 */
export function useEngineEval(
  fen: string | null,
  userSide: PieceColor,
  { depth = 16, enabled = true, fallback }: Options = {},
): EngineEvalState {
  const seed = React.useMemo<EngineEval>(
    () =>
      fallback
        ? { ...EMPTY_EVAL, cp: fallback.cp, mate: fallback.mate }
        : { ...EMPTY_EVAL },
    // Re-seed whenever the authored eval changes (i.e. a new position).
    [fallback?.cp, fallback?.mate], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const [state, setState] = React.useState<EngineEvalState>({
    ...seed,
    thinking: false,
    failed: false,
  });

  React.useEffect(() => {
    if (!fen || !enabled) {
      setState({ ...seed, thinking: false, failed: false });
      return;
    }

    let live = true;
    // Show the authored eval immediately; the engine refines it in place.
    setState({ ...seed, thinking: true, failed: false });

    getEngine()
      .analyse(fen, userSide, depth, (e) => {
        if (live) setState({ ...e, thinking: true, failed: false });
      })
      .then((e) => {
        if (live) setState({ ...e, thinking: false, failed: false });
      })
      .catch(() => {
        if (live) setState({ ...seed, thinking: false, failed: true });
      });

    return () => {
      live = false;
    };
  }, [fen, userSide, depth, enabled, seed]);

  return state;
}
