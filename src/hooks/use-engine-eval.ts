"use client";

import * as React from "react";
import {
  getEngine,
  EngineCancelled,
  EMPTY_EVAL,
  type EngineEval,
  type SearchLimits,
} from "@/lib/engine";
import { ANALYSIS_LIMITS } from "@/lib/engine-settings";
import type { PieceColor } from "@/types";

export interface EngineEvalState extends EngineEval {
  /** True once a *completed* search for the current position has landed. */
  settled: boolean;
  /** True when the engine couldn't run — the authored fallback is showing. */
  failed: boolean;
}

interface Options {
  /**
   * How hard to think. Defaults to the app's Analysis setting — Chess.com's
   * "Maximum Time 5 sec", three lines — because this hook *is* the eval bar.
   */
  limits?: SearchLimits;
  /** Skip analysis entirely (e.g. no puzzle on screen). */
  enabled?: boolean;
  /** Authored eval to show before the engine's first answer, and if it fails. */
  fallback?: { cp: number; mate: number | null };
  /**
   * Changing this resets the reading back to `fallback` — use the puzzle id.
   *
   * Within a single puzzle the hook deliberately *holds* the last engine score
   * while the next position is searched, so the bar makes one clean move per ply
   * instead of flicking through the authored number on its way to the real one.
   */
  resetKey?: string | number;
  /**
   * Which shared worker to think on. Two readings that are wanted at the same
   * moment — the live position and the one that was available — need one each,
   * or the second sits in a queue behind the first's whole time budget.
   */
  channel?: string;
}

/**
 * Evaluate a position with Stockfish, reported from `userSide`'s point of view
 * (positive = the solver is better).
 *
 * Only completed searches are published. Streaming every deepening score sounds
 * nicer but re-targets the eval bar a dozen times per position, and each change
 * restarts its transition — which reads as a stutter rather than a settle.
 */
export function useEngineEval(
  fen: string | null,
  userSide: PieceColor,
  {
    limits = ANALYSIS_LIMITS,
    enabled = true,
    fallback,
    resetKey,
    channel = "ui",
  }: Options = {},
): EngineEvalState {
  const fbCp = fallback?.cp ?? 0;
  const fbMate = fallback?.mate ?? null;
  // Kept in a ref so the search doesn't re-run just because the authored value
  // for the next ply changed — that would defeat the hold described above.
  const fbRef = React.useRef({ cp: fbCp, mate: fbMate });
  fbRef.current = { cp: fbCp, mate: fbMate };

  const [state, setState] = React.useState<EngineEvalState>({
    ...EMPTY_EVAL,
    cp: fbCp,
    mate: fbMate,
    settled: false,
    failed: false,
  });

  // A new puzzle clears whatever the previous one left on screen.
  React.useEffect(() => {
    setState({
      ...EMPTY_EVAL,
      cp: fbRef.current.cp,
      mate: fbRef.current.mate,
      settled: false,
      failed: false,
    });
  }, [resetKey]);

  React.useEffect(() => {
    if (!fen || !enabled) return;
    let live = true;
    setState((s) => ({ ...s, settled: false }));

    getEngine(channel)
      .analyse(fen, userSide, limits)
      .then((e) => {
        if (live) setState({ ...e, settled: true, failed: false });
      })
      .catch((err) => {
        // A superseded search says nothing about this position — leave whatever
        // is on screen alone rather than reporting a 0.0 nobody searched for.
        if (err instanceof EngineCancelled) return;
        if (live)
          setState({
            ...EMPTY_EVAL,
            cp: fbRef.current.cp,
            mate: fbRef.current.mate,
            settled: true,
            failed: true,
          });
      });

    return () => {
      live = false;
    };
  }, [fen, userSide, limits, enabled, channel]);

  // Stop the worker when the screen goes away — otherwise it carries on burning
  // CPU on a board nobody is looking at.
  //
  // Deliberately *not* done when the position changes: the next `analyse`
  // already supersedes the previous search.
  React.useEffect(() => () => getEngine(channel).cancel(), [channel]);

  return state;
}
