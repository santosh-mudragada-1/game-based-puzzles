import type { PieceColor } from "@/types";

/** The WASM build copied into /public by scripts/copy-engine.mjs. */
const ENGINE_URL = "/engine/stockfish.js";

/** Magnitude reported for a forced mate, so bar maths stays bounded. */
export const MATE_CP = 3000;

export interface EngineEval {
  /** User-positive centipawns (higher = better for the solver), ±MATE_CP. */
  cp: number;
  /** User-positive signed distance to mate, or null for a normal score. */
  mate: number | null;
  /** Search depth this score came from. */
  depth: number;
  /** Engine's best move in UCI form ("e1e8"), once known. */
  bestMove: string | null;
  /**
   * User-positive score of the second-best line, when more than one was asked
   * for. The gap between this and `cp` is what makes a move the *only* move.
   */
  secondCp: number | null;
}

export const EMPTY_EVAL: EngineEval = {
  cp: 0,
  mate: null,
  depth: 0,
  bestMove: null,
  secondCp: null,
};

/**
 * How hard to think, mirroring Chess.com's own engine settings.
 *
 * `movetime` is the ceiling ("Maximum Time" in their panel) and `depth` the
 * other end of it — Stockfish stops at whichever comes first, so a simple
 * position finishes early instead of burning its whole allowance.
 */
export interface SearchLimits {
  depth?: number;
  /** Milliseconds. */
  movetime?: number;
  /** Lines to report ("Number of Lines"). */
  multiPv?: number;
}

const asLimits = (l: number | SearchLimits): SearchLimits =>
  typeof l === "number" ? { depth: l } : l;

/** Active colour, from a FEN's second field. */
export function fenSideToMove(fen: string): PieceColor {
  return fen.trim().split(/\s+/)[1] === "b" ? "black" : "white";
}

const clampCp = (n: number) => Math.max(-MATE_CP, Math.min(MATE_CP, n));

/**
 * Pull a score out of a UCI `info` line and convert it to the solver's point of
 * view. `sign` is +1 when the side to move is the user, −1 otherwise, because
 * the engine always scores for whoever is on move.
 */
function parseInfo(line: string, sign: number): Partial<EngineEval> | null {
  const mate = /\bscore mate (-?\d+)/.exec(line);
  const cp = /\bscore cp (-?\d+)/.exec(line);
  if (!mate && !cp) return null;

  const d = /\bdepth (\d+)/.exec(line);
  const depth = d ? Number(d[1]) : 0;

  if (mate) {
    const raw = Number(mate[1]);
    // `mate 0` means the side to move is *already* checkmated, so the win
    // belongs to the other side — there is no signed distance left to report.
    if (raw === 0) return { depth, mate: 0, cp: sign < 0 ? MATE_CP : -MATE_CP };
    const userMate = raw * sign;
    return { depth, mate: userMate, cp: userMate > 0 ? MATE_CP : -MATE_CP };
  }
  return { depth, mate: null, cp: clampCp(Number(cp![1]) * sign) };
}

/** Which line an `info` belongs to; 1 (the best) when MultiPV is off. */
function pvIndex(line: string): number {
  const m = /\bmultipv (\d+)/.exec(line);
  return m ? Number(m[1]) : 1;
}

type LineHandler = (line: string) => void;

/**
 * Thrown by `analyse` when a newer request (or `cancel`) took the worker over.
 *
 * A superseded search has no score to give — it must not resolve, because a
 * resolved promise reads as "the engine has spoken" and would publish an empty
 * 0.0 for a position it never actually looked at.
 */
export class EngineCancelled extends Error {
  constructor() {
    super("engine: search superseded");
    this.name = "EngineCancelled";
  }
}

/**
 * One shared Stockfish worker for the whole app.
 *
 * Only a single search runs at a time: starting a new one stops whatever is in
 * flight, so scrubbing quickly through a puzzle line never piles up stale work
 * or reports an eval for a position the user has already left.
 */
class StockfishEngine {
  private worker: Worker | null = null;
  private boot: Promise<void> | null = null;
  private handlers = new Set<LineHandler>();
  /** Serialises searches — each analyse chains onto the previous one. */
  private chain: Promise<unknown> = Promise.resolve();
  private searching = false;
  /** Bumped per request; a handler stops emitting once it's been superseded. */
  private token = 0;
  /** Lines currently configured, so the option is only re-sent when it changes. */
  private multiPv = 1;

  /** True when the worker failed to boot (callers fall back to authored evals). */
  failed = false;

  private send(cmd: string) {
    this.worker?.postMessage(cmd);
  }

  private onMessage = (e: MessageEvent) => {
    const line = typeof e.data === "string" ? e.data : "";
    if (!line) return;
    for (const h of [...this.handlers]) h(line);
  };

  /** Resolve once a line satisfying `test` arrives. */
  private expect(test: (line: string) => boolean): Promise<void> {
    return new Promise((resolve) => {
      const h: LineHandler = (line) => {
        if (!test(line)) return;
        this.handlers.delete(h);
        resolve();
      };
      this.handlers.add(h);
    });
  }

  /** Boot the worker once and complete the UCI handshake. */
  private start(): Promise<void> {
    if (this.boot) return this.boot;
    this.boot = (async () => {
      if (typeof window === "undefined") throw new Error("engine: no window");
      const worker = new Worker(ENGINE_URL);
      worker.onmessage = this.onMessage;
      worker.onerror = () => {
        this.failed = true;
      };
      this.worker = worker;

      const uciok = this.expect((l) => l.startsWith("uciok"));
      this.send("uci");
      await uciok;

      this.send("setoption name Hash value 32");
      this.send(`setoption name MultiPV value ${this.multiPv}`);

      const readyok = this.expect((l) => l.startsWith("readyok"));
      this.send("isready");
      await readyok;
    })().catch((err) => {
      this.failed = true;
      throw err;
    });
    return this.boot;
  }

  /**
   * Abandon whatever is being searched.
   *
   * Bumping the token orphans the in-flight handler so its result is discarded,
   * and `stop` tells the worker to put the CPU down — without it the engine
   * keeps thinking about a position nobody is looking at any more.
   */
  cancel() {
    this.token++;
    if (this.searching) {
      this.send("stop");
      this.searching = false;
    }
  }

  /**
   * Evaluate `fen` to `depth`, reporting progressively deeper scores through
   * `onUpdate` so the bar settles rather than snapping.
   */
  analyse(
    fen: string,
    userSide: PieceColor,
    limits: number | SearchLimits,
    onUpdate?: (e: EngineEval) => void,
  ): Promise<EngineEval> {
    const { depth, movetime, multiPv = 1 } = asLimits(limits);

    const run = async (): Promise<EngineEval> => {
      await this.start();
      const mine = ++this.token;
      const sign = fenSideToMove(fen) === userSide ? 1 : -1;

      if (multiPv !== this.multiPv) {
        this.multiPv = multiPv;
        this.send(`setoption name MultiPV value ${multiPv}`);
      }

      let latest: EngineEval = { ...EMPTY_EVAL };
      /** Whether any score at all came back for this position. */
      let scored = false;

      const done = new Promise<void>((resolve) => {
        const h: LineHandler = (line) => {
          if (line.startsWith("info ")) {
            // A newer request took over — stop collecting, but stay installed.
            if (this.token !== mine) return;
            const parsed = parseInfo(line, sign);
            if (parsed) {
              const pv = pvIndex(line);
              if (pv === 1) {
                scored = true;
                latest = { ...latest, ...parsed };
                onUpdate?.(latest);
              } else if (pv === 2 && parsed.cp != null) {
                // The runner-up, for spotting a move that was the only one.
                latest = { ...latest, secondCp: parsed.cp };
              }
            }
          } else if (line.startsWith("bestmove")) {
            // Always consume our *own* terminator, superseded or not. Bailing
            // out early leaves this `bestmove` ownerless, and because searches
            // are chained it lands on the next one instead — ending it before
            // it has scored, so that position never gets an evaluation at all.
            const mv = line.split(/\s+/)[1];
            latest = {
              ...latest,
              bestMove: mv && mv !== "(none)" ? mv : null,
            };
            this.handlers.delete(h);
            this.searching = false;
            resolve();
          }
        };
        this.handlers.add(h);
      });

      this.send(`position fen ${fen}`);
      this.searching = true;
      // Both limits together where both are given: Stockfish honours whichever
      // it reaches first, so an easy position stops early rather than sitting
      // out its whole time allowance.
      const go = [
        "go",
        depth != null ? `depth ${depth}` : "",
        movetime != null ? `movetime ${movetime}` : "",
      ]
        .filter(Boolean)
        .join(" ");
      this.send(go);
      await done;
      // Superseded mid-flight, or stopped before a single score landed. Note
      // `depth` is *not* a usable test: a position that is already checkmate is
      // reported as `depth 0 score mate 0`, which is a real answer.
      if (this.token !== mine || !scored) throw new EngineCancelled();
      onUpdate?.(latest);
      return latest;
    };

    // Cut short whatever is running so the new position starts promptly.
    if (this.searching) this.send("stop");
    this.chain = this.chain.then(run, run);
    return this.chain as Promise<EngineEval>;
  }
}

export type { StockfishEngine };

/** Lazily-created singleton — the worker boots on first analyse, not on import. */
let instance: StockfishEngine | null = null;

export function getEngine(): StockfishEngine {
  if (!instance) instance = new StockfishEngine();
  return instance;
}

/**
 * A private worker, for work that must not fight the one the UI is using.
 *
 * The shared engine runs one search at a time, so a background sweep of fifty
 * games would keep stopping the eval bar the member is actually looking at (and
 * vice versa). Bulk analysis gets its own thread instead.
 */
export function createEngine(): StockfishEngine {
  return new StockfishEngine();
}
