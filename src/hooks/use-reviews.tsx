"use client";

import * as React from "react";
import { Chess } from "chess.js";

import { createEngine, EngineCancelled, type StockfishEngine } from "@/lib/engine";
import { REVIEW_LIMITS } from "@/lib/engine-settings";
import { accuracyFrom, classifyMove, type Classified } from "@/lib/classify";
import {
  buildPuzzle,
  findCandidates,
  MINEABLE,
  type Candidate,
  type MineSource,
} from "@/lib/mine-puzzles";
import {
  difficultyFor,
  ratingOf,
  relaxFrom,
  rungsAbove,
} from "@/lib/difficulty";
import { useChessAccount } from "@/hooks/use-chess-account";
import {
  loadReviewCache,
  saveReviewCache,
  type CachedReview,
} from "@/lib/review-cache";
import type { ArchivedGame } from "@/lib/chesscom";
import type { PieceColor, SolvePuzzle } from "@/types";

/**
 * The sweep searches at the Game Review setting — "Fast (~1 sec)", three lines.
 * A game opened deliberately gets the same budget, so the table and the review
 * page can never quote two different numbers for one game.
 */
const SWEEP_LIMITS = REVIEW_LIMITS;

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

/**
 * Games reviewed before the loading screen lets go.
 *
 * Enough to have puzzles ready and the top of the archive filled in the moment
 * the dashboard appears; the other fifteen carry on behind it, so nobody waits
 * on a game they haven't scrolled to yet.
 */
export const FIRST_BATCH = 5;

/**
 * Extra waves of twenty games taken on when the day comes up short, on top of
 * the first. Three waves is sixty games — past that the archive is old enough
 * that the mistakes in it are no longer the ones being made now.
 */
const MAX_WAVES = 2;

/** Puzzles built for the day. */
export const DAILY_PUZZLE_TARGET = 15;

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
  /**
   * Games in the first batch — what the loading screen waits for. The rest of
   * the sweep runs behind the dashboard.
   */
  firstBatch: number;
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

/**
 * One unit of engine work. `forDay` marks a mining job that feeds the day's
 * capped set rather than one game the member asked to drill.
 */
type Job = { id: string; kind: "review" | "mine"; forDay?: boolean };

/** One Stockfish worker and the game it currently has. */
interface Lane {
  engine: StockfishEngine;
  current: string | null;
  /** Set when the member is waiting on something else and this lane should let go. */
  abort: boolean;
  busy: boolean;
}

/**
 * How many games are read at once.
 *
 * A Stockfish WASM build is single-threaded, so one worker leaves most of the
 * machine idle — the review is embarrassingly parallel across games and this is
 * the difference between minutes and tens of seconds. Two cores are left for
 * the page itself, so scrolling the archive while it works still feels right.
 */
function poolSize(): number {
  const cores =
    typeof navigator !== "undefined" ? (navigator.hardwareConcurrency ?? 4) : 4;
  // One core left for the page, and never more than six workers — past that the
  // lanes are only splitting the same CPU into thinner slices.
  return Math.max(2, Math.min(6, cores - 1));
}

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
    firstBatch: 0,
  });

  const lanesRef = React.useRef<Lane[]>([]);
  const queueRef = React.useRef<Job[]>([]);
  const gamesRef = React.useRef(new Map<string, ArchivedGame>());
  /** Rows per finished game, readable without waiting for a render. */
  const rowsRef = React.useRef<Record<string, Classified[]>>({});
  /** Games whose mistakes feed the puzzle set. */
  const puzzleSetRef = React.useRef(new Set<string>());
  /** Games already taken apart for puzzles, so Solve never redoes the work. */
  const minedRef = React.useRef(new Set<string>());
  const puzzleCountRef = React.useRef(0);
  const aliveRef = React.useRef(true);
  const reviewsRef = React.useRef(reviews);
  /** Games the sweep need not look at again — queued now, or read last visit. */
  const plannedIdsRef = React.useRef(new Set<string>());
  /** The first few — mined immediately, so puzzles exist at the door. */
  const firstBatchRef = React.useRef(new Set<string>());
  /**
   * Games queued for the engine *this* visit. The loading screen waits on the
   * first few of these, and only these — games restored from the cache are
   * already done and must not be counted as something to wait for.
   */
  const queuedRef = React.useRef(0);
  /** Set on restore: top the day's set up from cached rows, without re-reading. */
  const topUpRef = React.useRef(false);
  const accountRef = React.useRef("");
  /**
   * How hard a puzzle is allowed to be, from the connected account's rating.
   * Read through a ref because mining runs inside long-lived lane loops that
   * must not be rebuilt every time the profile object changes identity.
   */
  const difficultyRef = React.useRef(difficultyFor(null));
  difficultyRef.current = difficultyFor(ratingOf(profile));
  /** Relaxed passes already run over the reviewed games; 0 is the strict one. */
  const relaxStageRef = React.useRef(0);
  /** Extra twenty-game waves taken on to fill a short day. */
  const wavesRef = React.useRef(0);

  reviewsRef.current = reviews;

  React.useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      for (const lane of lanesRef.current) lane.engine.cancel();
    };
  }, []);

  /** The pool, created on first use — one Stockfish worker per lane. */
  const lanes = React.useCallback((): Lane[] => {
    if (lanesRef.current.length === 0) {
      lanesRef.current = Array.from({ length: poolSize() }, () => ({
        engine: createEngine(),
        current: null,
        abort: false,
        busy: false,
      }));
    }
    return lanesRef.current;
  }, []);

  /**
   * Get the engines up while the member is still typing their username.
   *
   * Nothing can be reviewed before we know whose games they are, but the
   * workers can be downloaded, compiled and handshaken — a second or two per
   * lane that would otherwise be spent with a progress bar on screen. By the
   * time the first month lands they are sitting idle and ready.
   *
   * The first lane goes up alone. The build is 7 MB of WebAssembly, and six
   * lanes started together on a cold cache is six simultaneous downloads of it
   * plus six compiles — forty megabytes and every core busy, on the one screen
   * where all anyone is doing is typing into a box. Once the first has been
   * through, the file is in the HTTP cache and the rest can come up together
   * for nothing.
   */
  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [first, ...rest] = lanes();
      if (!first) return;
      await first.engine.warmUp();
      if (cancelled) return;
      await Promise.all(rest.map((l) => l.engine.warmUp()));
    })();
    return () => {
      cancelled = true;
    };
  }, [lanes]);

  /**
   * Analyse one game end to end, publishing rows as they land so a game being
   * watched fills in rather than appearing all at once.
   */
  const analyse = React.useCallback(
    async (
      game: ArchivedGame,
      lane: Lane,
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

      const evals: {
        cp: number;
        mate: number | null;
        bestMove: string | null;
        secondCp: number | null;
      }[] = [];
      let rows: Classified[] = [];

      for (let i = 0; i < total; i++) {
        if (!aliveRef.current || lane.abort) return { finished: false, rows };
        try {
          // Scored from White's side throughout, so one polarity runs the game.
          const e = await lane.engine.analyse(fens[i], "white", SWEEP_LIMITS);
          // `secondCp` comes from the third line the engine is now asked for;
          // it is what tells an only-move apart from one of several good ones.
          evals.push({
            cp: e.cp,
            mate: e.mate,
            bestMove: e.bestMove,
            secondCp: e.secondCp,
          });
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
    [],
  );

  /**
   * Build puzzles out of a game that has been reviewed.
   *
   * `forDay` is the daily set — capped, and capped per game so one collapse
   * can't fill it. Anything else is somebody clicking Solve on a specific game,
   * where they want that game's mistakes and no cap applies.
   */
  const mine = React.useCallback(
    async (game: ArchivedGame, rows: Classified[], lane: Lane, forDay = true) => {
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
      // How deep to look depends on the difficulty rules: the stricter they are,
      // the more of a game has to be examined to find something that passes.
      const d = forDay
        ? relaxFrom(difficultyRef.current, relaxStageRef.current)
        : difficultyRef.current;
      const limit = forDay ? d.keepPerGame : PER_GAME_ON_DEMAND;
      const candidates: Candidate[] = findCandidates(src, rows).slice(
        0,
        forDay ? d.tryPerGame : 10,
      );
      let made = 0;
      const built: SolvePuzzle[] = [];

      for (const c of candidates) {
        if (!aliveRef.current || made >= limit) break;
        if (forDay && puzzleCountRef.current >= DAILY_PUZZLE_TARGET) break;

        let puzzle: SolvePuzzle | null = null;
        try {
          puzzle = await buildPuzzle(lane.engine, c, d);
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
          // Several lanes finish at once, so the count can be read as under the
          // target by two of them together and overshoot it. The set itself is
          // the last word on how long the day is; the extras stay filed under
          // the games they came from.
          setPuzzles((p) =>
            p.length >= DAILY_PUZZLE_TARGET || p.some((x) => x.id === one.id)
              ? p
              : [...p, one],
          );
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
    [],
  );

  /**
   * Keep every lane fed.
   *
   * Each lane pulls the next job off the shared queue and works it on its own
   * worker, so the games are read several at a time rather than one after
   * another. Called whenever work is added; lanes already running are left
   * alone and will pick the new job up on their own.
   */
  /**
   * Take in the next twenty already-reviewed games.
   *
   * Reached when the day has come up short. Twenty games do not always hold
   * fifteen findable tactics, and the answer to that is more games rather than
   * looser rules: another wave at the same standard adds puzzles of the same
   * difficulty, where relaxing adds harder ones. Only when the archive runs out
   * of reviewed games does the standard move. Returns false when there is
   * nothing left to take.
   */
  const extendSweep = React.useCallback((): boolean => {
    if (wavesRef.current >= MAX_WAVES) return false;
    const next = [...gamesRef.current.values()]
      .filter((g) => g.accuracies && !plannedIdsRef.current.has(g.id))
      .sort((a, b) => b.endTime - a.endTime)
      .slice(0, SWEEP_GAMES);
    if (next.length === 0) return false;

    wavesRef.current++;
    for (const g of next) {
      plannedIdsRef.current.add(g.id);
      puzzleSetRef.current.add(g.id);
      queueRef.current.push({ id: g.id, kind: "review" });
    }
    setSweep((s) => ({ ...s, target: s.target + next.length, running: true }));
    setReviews((r) => {
      const out = { ...r };
      for (const g of next) out[g.id] = { ...(out[g.id] ?? blank()), status: "queued" };
      return out;
    });
    return true;
  }, []);

  /** Lets a lane restart the pool from inside its own loop, without a cycle. */
  const pumpRef = React.useRef<() => void>(() => {});

  const pump = React.useCallback(() => {
    setSweep((s) => ({ ...s, running: true }));

    for (const lane of lanes()) {
      if (lane.busy) continue;
      lane.busy = true;

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
              if (rows?.length) await mine(game, rows, lane, job.forDay ?? false);
              continue;
            }

            lane.abort = false;
            lane.current = job.id;
            const { finished, rows } = await analyse(game, lane);
            lane.current = null;
            if (!aliveRef.current) break;

            if (!finished) {
              // Handed this lane to a game the member is waiting on. Pick the
              // interrupted one up again once that is out of the way.
              if (
                !queueRef.current.some(
                  (j) => j.id === job.id && j.kind === "review",
                )
              ) {
                queueRef.current.splice(1, 0, job);
              }
              continue;
            }

            setSweep((s) => ({ ...s, done: s.done + 1 }));

            if (puzzleSetRef.current.has(job.id) && rows.length) {
              if (firstBatchRef.current.has(job.id)) {
                // The first few are mined on the spot: these are the puzzles
                // that have to exist by the time the loading screen lets go,
                // or the member arrives at an empty queue.
                await mine(game, rows, lane);
              } else {
                // Everything after that waits its turn at the back. Building a
                // line is engine work too, and doing it inline would take this
                // lane off the review pass — the count the member is watching
                // would crawl while a line nobody has asked for is worked out.
                queueRef.current.push({ id: job.id, kind: "mine", forDay: true });
              }
            }
          }
        } finally {
          lane.busy = false;
          lane.current = null;
          if (aliveRef.current && lanesRef.current.every((l) => !l.busy)) {
            // Everything queued is done. A short day is worth more work: first
            // more games at the same standard, and only when the archive has no
            // more reviewed games to give, the same games judged a rung looser.
            if (puzzleCountRef.current < DAILY_PUZZLE_TARGET) {
              if (extendSweep()) {
                pumpRef.current();
                return;
              }
              if (
                relaxStageRef.current < rungsAbove(difficultyRef.current) &&
                puzzleSetRef.current.size > 0
              ) {
                relaxStageRef.current++;
                for (const id of puzzleSetRef.current) {
                  if (rowsRef.current[id]?.length)
                    queueRef.current.push({ id, kind: "mine", forDay: true });
                }
                if (queueRef.current.length) {
                  pumpRef.current();
                  return;
                }
              }
            }
            setSweep((s) => ({ ...s, running: false }));
          }
        }
      })();
    }
  }, [analyse, mine, lanes, extendSweep]);

  pumpRef.current = pump;

  /** Put a game at the head of the queue, freeing a lane for it if need be. */
  const request = React.useCallback(
    (gameId: string) => {
      const held = reviewsRef.current[gameId];
      if (held?.status === "done" && held.source === "stockfish") return;
      if (!gamesRef.current.has(gameId)) return;
      // Already being read — nothing to hurry along.
      if (lanesRef.current.some((l) => l.current === gameId)) return;

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

      // If every lane is mid-game, take one off what it is doing — the member
      // is waiting on this one and the interrupted game goes back in the queue.
      const pool = lanes();
      if (pool.every((l) => l.busy && l.current)) {
        const victim = pool[0];
        victim.abort = true;
        victim.engine.cancel();
      }
      pump();
    },
    [pump, lanes],
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

      // Free a lane if they are all mid-game and this one still needs reading.
      const pool = lanes();
      if (
        !reviewed &&
        pool.every((l) => l.busy && l.current && l.current !== gameId)
      ) {
        pool[0].abort = true;
        pool[0].engine.cancel();
      }
      pump();
    },
    [pump, lanes],
  );

  // Rebuild when the connected account changes, and feed the sweep as the
  // archive arrives.
  React.useEffect(() => {
    const me = profile?.username ?? "";
    if (me !== accountRef.current) {
      accountRef.current = me;
      queueRef.current = [];
      for (const lane of lanesRef.current) {
        lane.abort = true;
        lane.engine.cancel();
      }
      puzzleSetRef.current = new Set();
      minedRef.current = new Set();
      plannedIdsRef.current = new Set();
      firstBatchRef.current = new Set();
      queuedRef.current = 0;
      relaxStageRef.current = 0;
      wavesRef.current = 0;
      puzzleCountRef.current = 0;
      rowsRef.current = {};
      setReviews({});
      setPuzzles([]);
      setGamePuzzles({});
      setSweep({ target: 0, done: 0, running: false, firstBatch: 0 });

      /*
        Pick up where the last visit left off. Every restored game goes into
        `plannedIds`, which is what the sweep filters against — so those games
        are never queued, the loading screen has nothing to wait for, and the
        member comes back to the same fifteen puzzles rather than fifteen
        freshly-mined ones in a set they were halfway through.
      */
      const cached = me ? loadReviewCache(me) : null;
      if (cached) {
        const restored: Record<string, GameReview> = {};
        for (const [id, r] of Object.entries(cached.reviews)) {
          rowsRef.current[id] = r.rows;
          plannedIdsRef.current.add(id);
          puzzleSetRef.current.add(id);
          restored[id] = {
            status: "done",
            source: "stockfish",
            accuracy: r.accuracy,
            rows: r.rows,
            done: r.total,
            total: r.total,
            mistakes: r.mistakes,
          };
        }
        for (const id of cached.mined) minedRef.current.add(id);
        puzzleCountRef.current = cached.puzzles.length;
        setReviews(restored);
        setPuzzles(cached.puzzles);
        setGamePuzzles(cached.gamePuzzles);
        // A visit that was interrupted mid-sweep can come back short of a full
        // day. The rows are already here, so the rest is mining, not reviewing.
        topUpRef.current = cached.puzzles.length < DAILY_PUZZLE_TARGET;
      }
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

    // Restored short of a full day: mine the games already read rather than
    // reading anything again. Only possible once the archive has arrived, since
    // a job needs its game.
    if (topUpRef.current) {
      topUpRef.current = false;
      const ready = Object.keys(rowsRef.current).filter(
        (id) =>
          gamesRef.current.has(id) &&
          rowsRef.current[id]?.length &&
          !minedRef.current.has(id),
      );
      if (ready.length) {
        for (const id of ready)
          queueRef.current.push({ id, kind: "mine", forDay: true });
        pump();
      }
    }

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
      if (queuedRef.current < FIRST_BATCH) firstBatchRef.current.add(g.id);
      queuedRef.current++;
      plannedIdsRef.current.add(g.id);
      puzzleSetRef.current.add(g.id);
      queueRef.current.push({ id: g.id, kind: "review" });
    }

    setSweep((s) => ({
      target: queuedRef.current,
      done: s.done,
      running: true,
      firstBatch: Math.min(FIRST_BATCH, queuedRef.current),
    }));
    setReviews((r) => {
      const next = { ...r };
      for (const g of set) next[g.id] = { ...(next[g.id] ?? blank()), status: "queued" };
      return next;
    });
    pump();
  }, [games, profile, status, pump]);

  /**
   * Keep the cache up to date with whatever has been worked out so far.
   *
   * Only our own finished reviews are worth storing: Chess.com's accuracies
   * come back with the archive for nothing, and a half-read game would restore
   * as done with a partial move list. Debounced, because a sweep publishes
   * every few positions and this is a few hundred kilobytes of JSON.
   */
  const snapshotRef = React.useRef<() => void>(() => {});
  snapshotRef.current = () => {
    const me = accountRef.current;
    if (!me) return;
    const keep: Record<string, CachedReview> = {};
    for (const [id, r] of Object.entries(reviews)) {
      if (r.status !== "done" || r.source !== "stockfish" || !r.rows.length)
        continue;
      keep[id] = {
        accuracy: r.accuracy,
        rows: r.rows,
        total: r.total,
        mistakes: r.mistakes,
      };
    }
    if (Object.keys(keep).length === 0) return;
    saveReviewCache({
      username: me,
      savedAt: Date.now(),
      reviews: keep,
      puzzles,
      gamePuzzles,
      mined: [...minedRef.current],
    });
  };

  React.useEffect(() => {
    const t = setTimeout(() => snapshotRef.current(), 1200);
    return () => clearTimeout(t);
  }, [reviews, puzzles, gamePuzzles]);

  // A reload mid-sweep would otherwise throw away everything since the last
  // debounce — exactly the moment the cache is worth the most.
  React.useEffect(() => {
    const flush = () => snapshotRef.current();
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, []);

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
