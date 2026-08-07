"use client";

import * as React from "react";
import { Chess } from "chess.js";

import { createEngine, EngineCancelled, type StockfishEngine } from "@/lib/engine";
import { accuracyFrom, classifyMove, type Classified } from "@/lib/classify";
import {
  buildPuzzle,
  findCandidates,
  MINEABLE,
  type Candidate,
  type MineSource,
} from "@/lib/mine-puzzles";
import { useChessAccount } from "@/hooks/use-chess-account";
import type { ArchivedGame } from "@/lib/chesscom";
import type { PieceColor, SolvePuzzle } from "@/types";

/**
 * Depth for the sweep that runs behind the archive.
 *
 * Twenty games is a couple of thousand positions; this pass exists to find the
 * moves that went wrong and to score them, and both survive a shallower search.
 * A game opened deliberately is analysed at the same depth, so the table and
 * the review page can never quote two numbers for one game.
 */
const SWEEP_DEPTH = 14;

/**
 * Games auto-reviewed on connect: the most recent ones **Chess.com has already
 * reviewed**.
 *
 * Those rows are the ones already showing an accuracy, so leaving them without
 * a Solve button reads as a bug — the member has been told the game was worth
 * reviewing and then offered nothing to do about it. Reviewing exactly that set
 * closes the gap, and it is a far better-aimed twenty than a random draw:
 * asking for a game review is itself a signal the member cared how it went.
 */
const SWEEP_GAMES = 20;

/** Puzzles built for the day. */
export const DAILY_PUZZLE_TARGET = 15;

/** At most this many from one game, so a single collapse can't fill the set. */
const PER_GAME = 2;

/** When the member asks for one game's puzzles, they can have more of them. */
const PER_GAME_ON_DEMAND = 4;

/** Positions between publishes — 80 renders a game would make the app crawl. */
const PUBLISH_EVERY = 8;

export type ReviewSource = "chesscom" | "stockfish";

export interface GameReview {
  status: "queued" | "running" | "done" | "failed";
  /** Where the accuracy came from — Chess.com's own review, or ours. */
  source: ReviewSource | null;
  accuracy: { white: number; black: number } | null;
  /** One row per ply. Only ours carry these; Chess.com publishes accuracy alone. */
  rows: Classified[];
  /** Positions scored so far, and in the game. */
  done: number;
  total: number;
  /**
   * Moves of the member's own that a puzzle could be built from. Zero means
   * they played it cleanly — there is nothing here to drill.
   */
  mistakes: number;
}

export interface SweepState {
  /** Games the background pass intends to review. */
  target: number;
  /** Games it has finished. */
  done: number;
  running: boolean;
}

interface ReviewsValue {
  reviews: Record<string, GameReview>;
  /** Today's puzzles, mined from the most recently reviewed games. */
  puzzles: SolvePuzzle[];
  /** Puzzles built for one particular game, on request. */
  gamePuzzles: Record<string, SolvePuzzle[]>;
  /** True while the sweep is still looking for puzzles. */
  mining: boolean;
  sweep: SweepState;
  /** Ask for a game's review now — it jumps the queue. */
  request: (gameId: string) => void;
  /** Ask for one game's puzzles, reviewing it first if it hasn't been. */
  requestPuzzles: (gameId: string) => void;
}

/** One unit of engine work. */
type Job = { id: string; kind: "review" | "mine" };

const Ctx = React.createContext<ReviewsValue | null>(null);

function blank(): GameReview {
  return {
    status: "queued",
    source: null,
    accuracy: null,
    rows: [],
    done: 0,
    total: 0,
    mistakes: 0,
  };
}

/**
 * The games the sweep works through: the most recent ones Chess.com has already
 * reviewed, newest first, and nothing else.
 *
 * A game with no accuracy has never been asked about, so nobody is waiting on
 * it — it keeps its Review button and is read only if it is pressed.
 */
function sweepSet(games: ArchivedGame[]): ArchivedGame[] {
  return [...games]
    .sort((a, b) => b.endTime - a.endTime)
    .filter((g) => g.accuracies)
    .slice(0, SWEEP_GAMES);
}

/** Every position of a game, starting position first, with its moves beside it. */
function positionsOf(pgn: string) {
  const game = new Chess();
  game.loadPgn(pgn);
  const moves = game.history({ verbose: true });
  const replay = new Chess();
  const fens = [replay.fen()];
  for (const m of moves) {
    replay.move(m.san);
    fens.push(replay.fen());
  }
  return { moves, fens };
}

/**
 * Everything we know about how each game was played.
 *
 * Chess.com publishes an accuracy for every game reviewed on the site, which is
 * free and instant, so all of those are taken as they come and fill the
 * archive's accuracy column immediately. Knowing the accuracy is not enough to
 * drill a game, though — that needs the moves themselves — so a background
 * sweep re-reads the twenty most recently reviewed games on its own Stockfish
 * worker and mines the day's puzzles out of what went wrong in them. Any other
 * game is reviewed only when the member asks for it.
 */
export function ReviewsProvider({ children }: { children: React.ReactNode }) {
  const { games, profile, status } = useChessAccount();
  const [reviews, setReviews] = React.useState<Record<string, GameReview>>({});
  const [puzzles, setPuzzles] = React.useState<SolvePuzzle[]>([]);
  const [gamePuzzles, setGamePuzzles] = React.useState<
    Record<string, SolvePuzzle[]>
  >({});
  const [sweep, setSweep] = React.useState<SweepState>({
    target: 0,
    done: 0,
    running: false,
  });

  const engineRef = React.useRef<StockfishEngine | null>(null);
  const queueRef = React.useRef<Job[]>([]);
  const gamesRef = React.useRef(new Map<string, ArchivedGame>());
  /** Rows per finished game, readable without waiting for a render. */
  const rowsRef = React.useRef<Record<string, Classified[]>>({});
  /** Games whose mistakes feed the puzzle set. */
  const puzzleSetRef = React.useRef(new Set<string>());
  /** Games already taken apart for puzzles, so Solve never redoes the work. */
  const minedRef = React.useRef(new Set<string>());
  const puzzleCountRef = React.useRef(0);
  const pumpingRef = React.useRef(false);
  const aliveRef = React.useRef(true);
  /** The game being analysed right now, if any. */
  const currentRef = React.useRef<string | null>(null);
  /** Set when a game the member is waiting on needs the worker. */
  const abortRef = React.useRef(false);
  const reviewsRef = React.useRef(reviews);
  /** Games already queued for the sweep, as the archive streams in. */
  const plannedIdsRef = React.useRef(new Set<string>());
  const accountRef = React.useRef("");

  reviewsRef.current = reviews;

  React.useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      engineRef.current?.cancel();
    };
  }, []);

  const engine = React.useCallback(() => {
    if (!engineRef.current) engineRef.current = createEngine();
    return engineRef.current;
  }, []);

  /**
   * Analyse one game end to end, publishing rows as they land so a game being
   * watched fills in rather than appearing all at once.
   */
  const analyse = React.useCallback(
    async (
      game: ArchivedGame,
    ): Promise<{ finished: boolean; rows: Classified[] }> => {
      let parsed: ReturnType<typeof positionsOf>;
      try {
        parsed = positionsOf(game.pgn);
      } catch {
        setReviews((r) => ({ ...r, [game.id]: { ...blank(), status: "failed" } }));
        return { finished: true, rows: [] };
      }

      const { moves, fens } = parsed;
      const total = fens.length;
      const sideOf = (k: number): PieceColor =>
        moves[k].color === "w" ? "white" : "black";

      setReviews((r) => ({
        ...r,
        [game.id]: { ...(r[game.id] ?? blank()), status: "running", done: 0, total },
      }));

      const evals: { cp: number; mate: number | null; bestMove: string | null }[] =
        [];
      const eng = engine();
      let rows: Classified[] = [];

      for (let i = 0; i < total; i++) {
        if (!aliveRef.current || abortRef.current) return { finished: false, rows };
        try {
          // Scored from White's side throughout, so one polarity runs the game.
          const e = await eng.analyse(fens[i], "white", SWEEP_DEPTH);
          evals.push({ cp: e.cp, mate: e.mate, bestMove: e.bestMove });
        } catch (err) {
          if (err instanceof EngineCancelled) return { finished: false, rows };
          setReviews((r) => ({
            ...r,
            [game.id]: { ...(r[game.id] ?? blank()), status: "failed" },
          }));
          return { finished: true, rows };
        }

        // Every position after the first completes the move that led to it.
        rows = [];
        for (let k = 1; k < evals.length; k++) {
          const m = moves[k - 1];
          rows.push(
            classifyMove({
              san: m.san,
              from: m.from,
              to: m.to,
              side: sideOf(k - 1),
              before: evals[k - 1],
              after: evals[k],
              index: k - 1,
            }),
          );
        }

        const finished = i + 1 === total;
        if (!finished && i % PUBLISH_EVERY !== 0) continue;

        const done = i + 1;
        const snapshot = rows;
        const accuracy = finished
          ? {
              white: accuracyFrom(
                snapshot.filter((_, k) => sideOf(k) === "white").map((r) => r.wpLoss),
              ),
              black: accuracyFrom(
                snapshot.filter((_, k) => sideOf(k) === "black").map((r) => r.wpLoss),
              ),
            }
          : null;
        const mistakes = finished
          ? snapshot.filter(
              (r, k) =>
                sideOf(k) === game.userSide && MINEABLE.includes(r.classification),
            ).length
          : 0;

        if (finished) rowsRef.current[game.id] = snapshot;

        setReviews((r) => ({
          ...r,
          [game.id]: {
            status: finished ? "done" : "running",
            source: finished ? "stockfish" : (r[game.id]?.source ?? null),
            accuracy: accuracy ?? r[game.id]?.accuracy ?? null,
            rows: snapshot,
            done,
            total,
            mistakes,
          },
        }));
      }

      return { finished: true, rows };
    },
    [engine],
  );

  /**
   * Build puzzles out of a game that has been reviewed.
   *
   * `forDay` is the daily set — capped, and capped per game so one collapse
   * can't fill it. Anything else is somebody clicking Solve on a specific game,
   * where they want that game's mistakes and no cap applies.
   */
  const mine = React.useCallback(
    async (game: ArchivedGame, rows: Classified[], forDay = true) => {
      if (forDay && puzzleCountRef.current >= DAILY_PUZZLE_TARGET) return;

      const opponent = game.userSide === "white" ? game.black : game.white;
      const src: MineSource = {
        gameId: game.id,
        pgn: game.pgn,
        opponent: opponent.username,
        opponentRating: opponent.rating,
        userSide: game.userSide,
        endTime: game.endTime,
      };

      // Worst first, and only the worst handful — building a line is engine work.
      const limit = forDay ? PER_GAME : PER_GAME_ON_DEMAND;
      const candidates: Candidate[] = findCandidates(src, rows).slice(
        0,
        forDay ? 5 : 8,
      );
      let made = 0;
      const built: SolvePuzzle[] = [];

      for (const c of candidates) {
        if (!aliveRef.current || made >= limit) break;
        if (forDay && puzzleCountRef.current >= DAILY_PUZZLE_TARGET) break;

        let puzzle: SolvePuzzle | null = null;
        try {
          puzzle = await buildPuzzle(engine(), c);
        } catch (err) {
          if (err instanceof EngineCancelled) return;
          continue;
        }
        if (!puzzle) continue;

        const one = puzzle;
        made++;
        built.push(one);
        if (forDay) {
          puzzleCountRef.current++;
          setPuzzles((p) => (p.some((x) => x.id === one.id) ? p : [...p, one]));
        }
      }

      // Only the on-demand pass looks at every mistake; the daily one stops at
      // two, so the game can still be asked for in full later.
      if (!forDay) minedRef.current.add(game.id);

      // File them under the game too, so "Solve" on that row has them whether
      // they came from the daily pass or from the member asking. The on-demand
      // pass writes even when it found nothing — an empty entry is the answer
      // to "is there anything in this game?", and the solver needs to be able
      // to tell that apart from not having looked yet.
      if (forDay && built.length === 0) return;
      setGamePuzzles((g) => {
        const held = g[game.id] ?? [];
        const merged = [...held];
        for (const p of built) if (!merged.some((x) => x.id === p.id)) merged.push(p);
        return { ...g, [game.id]: merged };
      });
    },
    [engine],
  );

  const pump = React.useCallback(() => {
    if (pumpingRef.current) return;
    pumpingRef.current = true;
    setSweep((s) => ({ ...s, running: true }));

    void (async () => {
      try {
        while (aliveRef.current) {
          const job = queueRef.current.shift();
          if (!job) break;
          const game = gamesRef.current.get(job.id);
          if (!game) continue;

          if (job.kind === "mine") {
            if (minedRef.current.has(job.id)) continue;
            const rows = rowsRef.current[job.id];
            if (rows?.length) await mine(game, rows, false);
            continue;
          }

          abortRef.current = false;
          currentRef.current = job.id;
          const { finished, rows } = await analyse(game);
          currentRef.current = null;
          if (!aliveRef.current) break;

          if (!finished) {
            // Handed the worker to a game the member is waiting on. Pick this
            // one up again as soon as that is out of the way.
            if (!queueRef.current.some((j) => j.id === job.id && j.kind === "review"))
              queueRef.current.splice(1, 0, job);
            continue;
          }

          setSweep((s) => ({ ...s, done: s.done + 1 }));
          if (puzzleSetRef.current.has(job.id) && rows.length)
            await mine(game, rows);
        }
      } finally {
        pumpingRef.current = false;
        if (aliveRef.current) setSweep((s) => ({ ...s, running: false }));
      }
    })();
  }, [analyse, mine]);

  /** Put a game at the head of the queue, taking the worker off the sweep. */
  const request = React.useCallback(
    (gameId: string) => {
      const held = reviewsRef.current[gameId];
      if (held?.status === "done" && held.source === "stockfish") return;
      if (!gamesRef.current.has(gameId)) return;
      if (currentRef.current === gameId) return;

      queueRef.current = [
        { id: gameId, kind: "review" },
        ...queueRef.current.filter(
          (j) => !(j.id === gameId && j.kind === "review"),
        ),
      ];
      setReviews((r) =>
        r[gameId]?.status === "running"
          ? r
          : { ...r, [gameId]: { ...(r[gameId] ?? blank()), status: "queued" } },
      );

      if (currentRef.current) {
        abortRef.current = true;
        engineRef.current?.cancel();
      }
      pump();
    },
    [pump],
  );

  /**
   * Everything needed for "Solve" on one row: review the game if it hasn't been,
   * then mine its mistakes. Both jump the queue, because someone is waiting.
   */
  const requestPuzzles = React.useCallback(
    (gameId: string) => {
      if (!gamesRef.current.has(gameId)) return;
      const held = reviewsRef.current[gameId];
      const reviewed = held?.status === "done" && held.source === "stockfish";

      const rest = queueRef.current.filter((j) => j.id !== gameId);
      const head: Job[] = reviewed
        ? [{ id: gameId, kind: "mine" }]
        : [
            { id: gameId, kind: "review" },
            { id: gameId, kind: "mine" },
          ];
      queueRef.current = [...head, ...rest];

      if (!reviewed && currentRef.current && currentRef.current !== gameId) {
        abortRef.current = true;
        engineRef.current?.cancel();
      }
      pump();
    },
    [pump],
  );

  // Rebuild when the connected account changes, and feed the sweep as the
  // archive arrives.
  React.useEffect(() => {
    const me = profile?.username ?? "";
    if (me !== accountRef.current) {
      accountRef.current = me;
      queueRef.current = [];
      abortRef.current = true;
      engineRef.current?.cancel();
      puzzleSetRef.current = new Set();
      minedRef.current = new Set();
      plannedIdsRef.current = new Set();
      puzzleCountRef.current = 0;
      rowsRef.current = {};
      setReviews({});
      setPuzzles([]);
      setGamePuzzles({});
      setSweep({ target: 0, done: 0, running: false });
    }

    gamesRef.current = new Map(games.map((g) => [g.id, g]));

    // Chess.com's own accuracy is already an answer for the games it reviewed.
    setReviews((r) => {
      let next = r;
      for (const g of games) {
        if (!g.accuracies || next[g.id]) continue;
        if (next === r) next = { ...r };
        next[g.id] = {
          status: "done",
          source: "chesscom",
          accuracy: g.accuracies,
          rows: [],
          done: 0,
          total: 0,
          mistakes: 0,
        };
      }
      return next;
    });

    if (!me || games.length === 0) return;

    /**
     * Start reviewing while the archive is still downloading rather than after.
     *
     * Months arrive newest-first, so the reviewed games seen first really are
     * the most recent ones — the set can be filled in as it appears instead of
     * waiting for a thousand games to land. That puts the whole pass inside the
     * loading screen the member is already watching, rather than making them
     * wait through it twice.
     */
    const set = sweepSet(games).filter(
      (g) => !plannedIdsRef.current.has(g.id),
    );
    if (set.length === 0) return;

    for (const g of set) {
      plannedIdsRef.current.add(g.id);
      puzzleSetRef.current.add(g.id);
      queueRef.current.push({ id: g.id, kind: "review" });
    }

    setSweep((s) => ({
      target: plannedIdsRef.current.size,
      done: s.done,
      running: true,
    }));
    setReviews((r) => {
      const next = { ...r };
      for (const g of set) next[g.id] = { ...(next[g.id] ?? blank()), status: "queued" };
      return next;
    });
    pump();
  }, [games, profile, status, pump]);

  const value = React.useMemo<ReviewsValue>(
    () => ({
      reviews,
      puzzles,
      gamePuzzles,
      mining: sweep.running && puzzles.length < DAILY_PUZZLE_TARGET,
      sweep,
      request,
      requestPuzzles,
    }),
    [reviews, puzzles, gamePuzzles, sweep, request, requestPuzzles],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useReviews(): ReviewsValue {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useReviews must be used inside ReviewsProvider");
  return ctx;
}
