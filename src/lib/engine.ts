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
}

export const EMPTY_EVAL: EngineEval = {
  cp: 0,
  mate: null,
  depth: 0,
  bestMove: null,
};

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

type LineHandler = (line: string) => void;

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
      this.send("setoption name MultiPV value 1");

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
    depth: number,
    onUpdate?: (e: EngineEval) => void,
  ): Promise<EngineEval> {
    const run = async (): Promise<EngineEval> => {
      await this.start();
      const mine = ++this.token;
      const sign = fenSideToMove(fen) === userSide ? 1 : -1;

      let latest: EngineEval = { ...EMPTY_EVAL };

      const done = new Promise<void>((resolve) => {
        const h: LineHandler = (line) => {
          // A newer request took over — stop feeding this one.
          if (this.token !== mine) {
            this.handlers.delete(h);
            resolve();
            return;
          }
          if (line.startsWith("info ")) {
            const parsed = parseInfo(line, sign);
            if (parsed) {
              latest = { ...latest, ...parsed };
              onUpdate?.(latest);
            }
          } else if (line.startsWith("bestmove")) {
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
      this.send(`go depth ${depth}`);
      await done;
      onUpdate?.(latest);
      return latest;
    };

    // Cut short whatever is running so the new position starts promptly.
    if (this.searching) this.send("stop");
    this.chain = this.chain.then(run, run);
    return this.chain as Promise<EngineEval>;
  }
}

/** Lazily-created singleton — the worker boots on first analyse, not on import. */
let instance: StockfishEngine | null = null;

export function getEngine(): StockfishEngine {
  if (!instance) instance = new StockfishEngine();
  return instance;
}
