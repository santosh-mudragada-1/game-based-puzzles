import { Chess } from "chess.js";
import type { StockfishEngine } from "@/lib/engine";
import { MATE_CP } from "@/lib/engine";
import { REVIEW_LIMITS } from "@/lib/engine-settings";
import { estimateDifficulty, type Standard, STANDARDS } from "@/lib/difficulty";
import type { Classified } from "@/lib/classify";
import type {
  MoveClassification,
  PieceColor,
  PuzzleCategory,
  PuzzleDifficulty,
  PuzzleLinePly,
  PuzzleMove,
  PuzzleObjective,
  PuzzleTheme,
  SolvePuzzle,
} from "@/types";

/**
 * Turning a reviewed game into puzzles.
 *
 * A puzzle is one moment the member got wrong, rewound to just before their
 * move so they can play what the engine wanted instead. The work is in deciding
 * *which* moments are worth that, and how much of the answer to ask for:
 *
 *  · a collapse is one lesson, not four — the puzzle is the move that would
 *    have prevented it, and everything after is the consequence of missing it;
 *  · the line runs until the idea is demonstrated and then stops, which is
 *    mate for a mating attack and a won piece for a combination, not five plies
 *    because five was the number;
 *  · nothing becomes a puzzle just because Stockfish prefers something. The
 *    answer has to be findable, singular, and worth finding — and the moment
 *    has to have put the result in doubt. A faster mate declined, or a slower
 *    road to the same won game, is not a mistake anybody needs drilling on.
 */

/**
 * The solution line is Game Review work, so it gets the Game Review budget —
 * a second a move. The Analysis budget would be five times that for a line
 * nobody is watching being built.
 */
const LINE_LIMITS = REVIEW_LIMITS;

/** Hard ceiling on solution length, whatever the idea. */
const MAX_PLIES = 9;

/** Mistakes worth looking at, before any of the tests below. */
export const MINEABLE: MoveClassification[] = ["blunder", "missed", "mistake"];

/** Plies still counted as the opening, where a slip is an opening mistake. */
const OPENING_PLIES = 12;

/** Pieces (bar kings and pawns) at or below which the position is an endgame. */
const ENDGAME_PIECES = 6;

/** Centipawns: a clear, decisive material advantage. */
const DECISIVE = 400;
/** Centipawns: enough of an edge to call a position won. */
const WINNING = 250;
/** Centipawns: a position successfully held. */
const HELD = -60;

/**
 * Above this, the move played kept the game won and there is nothing to fix.
 *
 * The same number a solved puzzle has to reach, used from the other side: if the
 * position the member actually chose is already at the level we would call a
 * puzzle *solved*, then asking them to solve it is asking them to be Stockfish.
 * Trading into a won endgame instead of mating in three is good chess — it is
 * how games are actually won, and a coach does not mark it wrong.
 */
const STILL_WINNING = DECISIVE;

const CATEGORY_OF: Record<string, PuzzleCategory> = {
  blunder: "blunder",
  mistake: "mistake",
  missed: "missed-opportunity",
};

export interface MineSource {
  gameId: string;
  pgn: string;
  opponent: string;
  opponentRating: number;
  userSide: PieceColor;
  /** Unix seconds — used only to order the candidate pool. */
  endTime: number;
}

/** A moment we could build a puzzle from, before the engine has been asked. */
export interface Candidate {
  source: MineSource;
  /** 0-based index into the game's moves. */
  index: number;
  /** Position immediately before the mistake. */
  fen: string;
  played: PuzzleMove;
  category: PuzzleCategory;
  theme: PuzzleTheme;
  objective: PuzzleObjective;
  /** Win percentage thrown away — how badly this one hurt. */
  wpLoss: number;
  /** User-positive evaluation of the position *before* the move. */
  preCp: number;
  /** User-positive evaluation of what the member actually played. */
  startCp: number;
  startMate: number | null;
  /** A forced mate was on the board before the move. */
  hadMate: boolean;
  moveNo: number;
  endgame: boolean;
}

const sideSign = (side: PieceColor) => (side === "white" ? 1 : -1);

/** Pieces left on the board bar kings and pawns — the endgame test. */
function heavyCount(fen: string): number {
  const board = fen.split(" ")[0];
  return (board.match(/[qrbnQRBN]/g) ?? []).length;
}

/**
 * What this moment is *about*.
 *
 * The classification says how bad the move was; this says what the position was
 * asking for, which is what decides both the lesson and where the answer stops.
 */
function readTheme(
  preCp: number,
  postCp: number,
  hadMate: boolean,
  cls: MoveClassification,
  opponentErred: boolean,
  endgame: boolean,
): { theme: PuzzleTheme; objective: PuzzleObjective } {
  // A forced mate was there and is gone. Nothing else in the position matters.
  if (hadMate) return { theme: "mate-attack", objective: "mate" };

  // The position was already won and now it isn't — the lesson is holding on to
  // it, which in a bare position is technique and in a full one is vigilance.
  if (preCp >= DECISIVE && postCp < WINNING) {
    return endgame
      ? { theme: "endgame-conversion", objective: "convert" }
      : { theme: "blunder-prevention", objective: "convert" };
  }

  // Level or worse, and now losing: the move to find is the one that survives.
  if (preCp < WINNING && postCp <= -WINNING) {
    return { theme: "defensive-resource", objective: "defend" };
  }

  // The opponent had just gone wrong and it went unpunished.
  if (opponentErred && cls === "missed") {
    return { theme: "punish-mistake", objective: "win-material" };
  }

  // Material handed over in a position that was otherwise fine. The lesson is
  // seeing what the position was threatening before playing into it.
  if (cls === "blunder" && postCp <= preCp - 200) {
    return { theme: "blunder-prevention", objective: "defend" };
  }

  // Everything else: something was there to be won and wasn't taken.
  return { theme: "missed-tactic", objective: "win-material" };
}

/**
 * Every moment in one game worth trying to build a puzzle from, worst first.
 *
 * Sequences are collapsed here rather than later: an evaluation that falls and
 * never recovers is one mistake with several consequences, and the puzzle
 * belongs at the top of the fall.
 */
export function findCandidates(
  source: MineSource,
  rows: Classified[],
): Candidate[] {
  const game = new Chess();
  try {
    game.loadPgn(source.pgn);
  } catch {
    return [];
  }

  const moves = game.history({ verbose: true });
  const replay = new Chess();
  const out: Candidate[] = [];
  const sign = sideSign(source.userSide);
  /** User-positive evaluation after ply i — index −1 is the start, dead level. */
  const evalAt = (i: number) => (i < 0 ? 0 : (rows[i]?.cp ?? 0) * sign);

  for (let i = 0; i < moves.length; i++) {
    const before = replay.fen();
    const m = moves[i];
    replay.move(m.san);

    const row = rows[i];
    if (!row) continue;
    const side: PieceColor = m.color === "w" ? "white" : "black";
    if (side !== source.userSide) continue;
    if (!MINEABLE.includes(row.classification)) continue;

    const preRow = rows[i - 1];
    const preCp = evalAt(i - 1);
    const postCp = row.cp * sign;
    const preMate = preRow?.mate == null ? null : preRow.mate * sign;
    const hadMate = preMate != null && preMate > 0;
    const postMate = row.mate == null ? null : row.mate * sign;

    /*
      Did missing this actually cost anything?

      A puzzle has to be a moment where the result was put in doubt. Two things
      are not that, however much evaluation the engine says they cost:

      · a mate that is still a mate, only longer — the game is over either way,
        and the difference is engine perfection, not chess;
      · a move that left the position decisively won anyway. Choosing the safe
        simplification over the flashy finish is how won games get won.

      Both used to become puzzles, and being told you were "wrong" for winning a
      won game is the least useful thing this feature could say to anybody.
    */
    const stillMating = postMate != null && postMate > 0;
    if (stillMating || postCp >= STILL_WINNING) continue;

    const endgame = heavyCount(before) <= ENDGAME_PIECES;
    const openingPhase = i < OPENING_PLIES;
    // The move before this one was the opponent's; if they had just erred, the
    // position on the board is a punishment waiting to be found.
    const opponentErred =
      preRow != null &&
      ["blunder", "mistake", "inaccuracy"].includes(preRow.classification);

    const { theme, objective } = readTheme(
      preCp,
      postCp,
      hadMate,
      row.classification,
      opponentErred,
      endgame,
    );

    out.push({
      source,
      index: i,
      fen: before,
      played: { from: m.from, to: m.to, san: m.san },
      category: openingPhase
        ? "opening-mistake"
        : (CATEGORY_OF[row.classification] ?? "mistake"),
      theme,
      objective,
      wpLoss: row.wpLoss,
      preCp,
      startCp: postCp,
      startMate: row.mate === 0 ? 0 : row.mate == null ? null : row.mate * sign,
      hadMate,
      moveNo: Math.floor(i / 2) + 1,
      endgame,
    });
  }

  return collapse(out, (i) => evalAt(i));
}

/** Plies within which a later mistake is still part of the same collapse. */
const SEQUENCE_SPAN = 14;
/** Recovery worth calling a fresh start rather than more of the same slide. */
const RECOVERY = 120;

/**
 * Fold a collapse into the move that would have prevented it.
 *
 * "Missed the tactic, then lost the exchange, then lost a rook, then got mated"
 * is one lesson told four times. A later mistake counts as part of the same
 * sequence when it lands soon after and the evaluation never climbed back in
 * between — if it did climb back, the position genuinely stabilised and going
 * wrong again is a new thing to learn.
 */
function collapse(
  candidates: Candidate[],
  evalAt: (ply: number) => number,
): Candidate[] {
  const kept: Candidate[] = [];

  for (const c of candidates) {
    const head = kept[kept.length - 1];
    if (head && c.index - head.index <= SEQUENCE_SPAN) {
      // Did the position recover between the two? Measured against where it
      // stood before the first mistake, which is what was actually thrown away.
      let recovered = false;
      for (let p = head.index + 1; p < c.index; p++) {
        if (evalAt(p) >= head.preCp - RECOVERY) {
          recovered = true;
          break;
        }
      }
      if (!recovered) continue; // same collapse — the head already teaches it
    }
    kept.push(c);
  }

  // Worst first: a game that fell apart offers its collapse, not its mildest slip.
  return kept.sort((a, b) => b.wpLoss - a.wpLoss);
}

/** Has the solution done what it set out to do? */
function objectiveMet(
  objective: PuzzleObjective,
  cp: number,
  mated: boolean,
  preCp: number,
): boolean {
  if (mated) return true;
  switch (objective) {
    case "mate":
      return false; // only mate finishes a mating attack
    case "defend":
      return cp >= HELD;
    case "convert":
      return cp >= Math.min(preCp - 80, DECISIVE);
    case "win-material":
    default:
      return cp >= DECISIVE;
  }
}

/** Title, coach copy and the one-line lesson, written from what the line does. */
function copyFor(
  c: Candidate,
  line: PuzzleLinePly[],
  mateIn: number | null,
): { title: string; prompt: string; solvedLine: string; learning: string; why: string } {
  const best = line[0];
  const gain = line[line.length - 1].cp - c.startCp;
  const rest = line.slice(1).map((p) => p.san).join(" ");
  const moves = line.filter((p) => p.side === c.source.userSide).length;

  const title = mateIn
    ? mateIn === 1
      ? "Missed Mate in One"
      : `Missed Mate in ${mateIn}`
    : c.theme === "defensive-resource"
      ? "There Was a Defence"
      : c.theme === "endgame-conversion"
        ? "Let the Endgame Slip"
        : c.theme === "punish-mistake"
          ? "Let Them Off"
          : c.theme === "blunder-prevention"
            ? "Threw Away the Advantage"
            : gain >= 600
              ? "Missed a Winning Shot"
              : "There Was Better";

  const learning = mateIn
    ? `Spot a forced mate in ${mateIn} and start it with the right move.`
    : c.theme === "defensive-resource"
      ? "Find the move that holds the position when everything else loses."
      : c.theme === "endgame-conversion"
        ? "Convert a won endgame instead of letting it drift."
        : c.theme === "punish-mistake"
          ? "Punish the mistake your opponent just made."
          : c.theme === "blunder-prevention"
            ? "Keep the advantage you had — see what the position was threatening."
            : moves > 1
              ? "Calculate a combination through to the material win."
              : "Win material that was sitting there for the taking.";

  const opening = c.category === "opening-mistake" ? " straight out of the opening" : "";
  const prompt = mateIn
    ? `On move ${c.moveNo} you played ${c.played.san} and let a forced mate slip${opening}. It is still there in this position — start it.`
    : c.theme === "defensive-resource"
      ? `On move ${c.moveNo} you played ${c.played.san} and the position fell apart${opening}. There was a way to hold it. Find it.`
      : c.theme === "punish-mistake"
        ? `Your opponent had just gone wrong, and on move ${c.moveNo} you played ${c.played.san} instead of punishing it${opening}. Take what was on offer.`
        : c.theme === "endgame-conversion"
          ? `On move ${c.moveNo} you played ${c.played.san} and a won endgame started slipping${opening}. Bring it home.`
          : `On move ${c.moveNo} you played ${c.played.san}${opening}, and the position turned. Something far stronger was available here. Find it.`;

  const solvedLine = mateIn
    ? `${best.san}! ${rest ? `${rest} — ` : ""}checkmate.`
    : c.theme === "defensive-resource"
      ? `${best.san}! ${rest ? `After ${rest}, ` : ""}the position holds.`
      : `${best.san}! ${rest ? `After ${rest}, ` : ""}the position is winning.`;

  const why = mateIn
    ? `A forced mate in ${mateIn} was on the board and the game went on instead.`
    : `${c.played.san} cost ${(Math.abs(gain) / 100).toFixed(1)} pawns of evaluation, and the position was decided by one idea rather than a long grind.`;

  return { title, prompt, solvedLine, learning, why };
}

/**
 * Play out the engine's answer and wrap it as a puzzle — or decide there isn't
 * one here worth solving.
 *
 * The line stops the moment the objective is met and the opponent has had their
 * best reply to it: mate for a mating attack, a decisive material edge for a
 * combination, a level position for a defence. Not one ply further, because
 * everything after that is the engine talking to itself.
 */
export async function buildPuzzle(
  engine: StockfishEngine,
  c: Candidate,
  standard: Standard = STANDARDS[0],
): Promise<SolvePuzzle | null> {
  const board = new Chess(c.fen);
  const line: PuzzleLinePly[] = [];
  const userSide = c.source.userSide;
  /** The answer is a capture, a check or mate — something with a reason to look. */
  let forcing = false;
  /** How far clear of the runner-up the answer is; large means one right answer. */
  let margin: number | null = null;
  /** How many moves are genuinely playable here — the calculation load. */
  let alternatives = 1;
  /** Set once the objective has been met and the opponent has answered it. */
  let complete = false;

  // One search per position, carried forward: the score of the position a move
  // lands in *is* the search that then chooses the reply, so evaluating both
  // ends of every ply separately was asking the engine the same question twice.
  let node = await engine.analyse(board.fen(), userSide, LINE_LIMITS);

  for (let k = 0; k < MAX_PLIES && !complete; k++) {
    if (board.isGameOver()) break;

    const uci = node.bestMove;
    if (!uci) break;

    const mover: PieceColor = board.turn() === "w" ? "white" : "black";
    const played = board.move({
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      promotion: uci.length > 4 ? uci.slice(4, 5) : "q",
    });
    if (!played) break;

    if (k === 0) {
      forcing = Boolean(played.captured) || board.inCheck();
      // MultiPV is on, so the runners-up come back with the best line. A move
      // that is only just ahead of two others is a position with real choices
      // in it; one that is far ahead is a position with an answer.
      margin = node.secondCp == null ? null : node.cp - node.secondCp;
      const near = (v: number | null) =>
        v != null && node.cp - v <= standard.alternativeBand;
      alternatives = 1 + (near(node.secondCp) ? 1 : 0) + (near(node.thirdCp) ? 1 : 0);
    }

    const mated = board.isCheckmate();
    // Checkmate ends the line — there is nothing left to search.
    node = mated
      ? { ...node, cp: MATE_CP, mate: 0, bestMove: null }
      : await engine.analyse(board.fen(), userSide, LINE_LIMITS);

    line.push({
      from: played.from,
      to: played.to,
      san: played.san,
      side: mover,
      fen: board.fen(),
      cp: node.cp,
      mate: node.mate,
      isMate: mated,
    });

    if (mated) break;
    // The objective is judged after the *opponent* has replied to it: material
    // that comes straight back is not material won, and a defence that survives
    // one move is not a defence.
    if (mover !== userSide) {
      complete = objectiveMet(c.objective, node.cp, false, c.preCp);
      // Going nowhere: no mate in sight and nothing decisive after two of the
      // solver's own moves. Better to abandon this candidate than to spend the
      // rest of the ceiling proving there was no puzzle here.
      if (!complete && c.objective !== "mate" && k >= 3 && node.cp < WINNING) break;
    }
  }

  // A line that trails off on the opponent's move leaves the member watching
  // rather than solving.
  while (line.length && line[line.length - 1].side !== userSide) line.pop();
  if (line.length === 0) return null;

  const first = line[0];
  // The engine agreed with the move that was played — nothing to teach.
  if (first.from === c.played.from && first.to === c.played.to) return null;

  const last = line[line.length - 1];
  const mateIn = last.isMate
    ? line.filter((p) => p.side === userSide).length
    : null;

  // A mating attack that never reaches mate inside the ceiling is a calculation
  // exercise, not a puzzle with an end. Let it be judged on material instead.
  const swing = last.cp - c.startCp;
  const met =
    last.isMate ||
    objectiveMet(
      c.objective === "mate" ? "win-material" : c.objective,
      last.cp,
      false,
      c.preCp,
    );
  if (!met) return null;
  if (swing < standard.minSwing && !last.isMate) return null;

  // The answer has to be findable and it has to be *the* answer. One of two
  // equally good ideas, with only one accepted, is not a puzzle — it is a coin
  // toss the solver is told they lost.
  if (standard.requireForcing && !forcing && !last.isMate) return null;
  if (
    standard.onlyMargin != null &&
    margin != null &&
    margin < standard.onlyMargin
  )
    return null;

  const userMoves = line.filter((p) => p.side === userSide).length;
  // Named from what the answer turned out to need: one move that wins material
  // is a tactic spotted, several is a combination calculated.
  const theme: PuzzleTheme =
    c.theme === "missed-tactic" && userMoves > 1 ? "winning-combination" : c.theme;

  const difficulty: PuzzleDifficulty = estimateDifficulty({
    userMoves,
    alternatives,
    forcing,
    swing,
    mate: mateIn != null,
  });

  const { title, prompt, solvedLine, learning, why } = copyFor(
    { ...c, theme },
    line,
    mateIn,
  );

  return {
    id: `gbp-${c.source.gameId}-${c.index}`,
    category: c.category,
    theme,
    objective: c.objective,
    learning,
    difficulty,
    why,
    fen: c.fen,
    orientation: userSide,
    sideToMove: userSide,
    played: c.played,
    start: {
      cp: Math.max(-MATE_CP, Math.min(MATE_CP, Math.round(c.startCp))),
      mate: c.startMate,
    },
    line,
    prompt,
    solvedLine,
    title,
    opponent: c.source.opponent,
    opponentRating: c.source.opponentRating,
    gameId: c.source.gameId,
    reviewPly: c.index + 1,
    archived: true,
  };
}
