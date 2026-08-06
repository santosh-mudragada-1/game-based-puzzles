"use client";

import * as React from "react";
import { Chess } from "chess.js";
import { getEngine, EngineCancelled } from "@/lib/engine";
import { classifyMove, type Classified } from "@/lib/classify";

/**
 * Depth for a game pulled off the archive.
 *
 * The sample game ships with a depth-18 analysis baked in; a game clicked from
 * the history has to be worked out here and now, and 130 positions at depth 18
 * is minutes. 13 lands in the tens of seconds and still separates a blunder
 * from a good move — which is all the classification asks of it.
 */
const DEPTH = 13;

export interface AnalysisState {
  /** One row per ply, filled in as the engine works through the game. */
  rows: Classified[];
  /** Positions evaluated so far. */
  done: number;
  /** Positions in the game (plies + the starting position). */
  total: number;
  running: boolean;
  failed: boolean;
}

const EMPTY: AnalysisState = {
  rows: [],
  done: 0,
  total: 0,
  running: false,
  failed: false,
};

/**
 * Run Stockfish over an entire PGN in the browser, publishing rows as they land
 * so the review can open immediately and fill in behind the reader.
 */
export function useGameAnalysis(pgn: string | null): AnalysisState {
  const [state, setState] = React.useState<AnalysisState>(EMPTY);

  React.useEffect(() => {
    if (!pgn) {
      setState(EMPTY);
      return;
    }

    let live = true;
    const game = new Chess();
    try {
      game.loadPgn(pgn);
    } catch {
      setState({ ...EMPTY, failed: true });
      return;
    }
    const moves = game.history({ verbose: true });

    // Every position, starting position first.
    const replay = new Chess();
    const fens = [replay.fen()];
    for (const m of moves) {
      replay.move(m.san);
      fens.push(replay.fen());
    }

    setState({
      rows: [],
      done: 0,
      total: fens.length,
      running: true,
      failed: false,
    });

    (async () => {
      const engine = getEngine();
      const evals: { cp: number; mate: number | null; bestMove: string | null }[] =
        [];

      for (let i = 0; i < fens.length && live; i++) {
        try {
          // Scored from White's side so the whole game shares one polarity.
          const e = await engine.analyse(fens[i], "white", DEPTH);
          evals.push({ cp: e.cp, mate: e.mate, bestMove: e.bestMove });
        } catch (err) {
          if (err instanceof EngineCancelled) return;
          if (!live) return;
          setState((s) => ({ ...s, running: false, failed: true }));
          return;
        }
        if (!live) return;

        // Every position after the first completes the move that led to it.
        const rows: Classified[] = [];
        for (let k = 1; k < evals.length; k++) {
          const m = moves[k - 1];
          rows.push(
            classifyMove({
              san: m.san,
              from: m.from,
              to: m.to,
              side: m.color === "w" ? "white" : "black",
              before: evals[k - 1],
              after: evals[k],
              index: k - 1,
            }),
          );
        }
        setState({
          rows,
          done: i + 1,
          total: fens.length,
          running: i + 1 < fens.length,
          failed: false,
        });
      }
    })();

    return () => {
      live = false;
      getEngine().cancel();
    };
  }, [pgn]);

  return state;
}
