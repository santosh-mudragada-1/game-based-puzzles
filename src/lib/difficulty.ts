import type { ChessProfile } from "@/hooks/use-chess-account";

/**
 * How hard the puzzles from someone's own games are allowed to be.
 *
 * The mistakes in a 1100-rated game are not 1100-rated *puzzles*. The engine's
 * answer to one is often a quiet move that only pays off three moves later, or
 * one of two equally winning ideas where the other one is marked wrong — which
 * is unsolvable in the way that matters: you cannot see why you were wrong.
 *
 * So the bar for what becomes a puzzle moves with the player. Lower down, a
 * puzzle has to be a single findable move — a capture, a check, or a mate — that
 * is clearly the best one and visibly wins something. Higher up, the longer
 * quiet lines are the interesting part and come back.
 */
export interface Difficulty {
  band: "casual" | "club" | "strong";
  /** Half-moves of solution the engine is asked to work out. */
  maxLine: number;
  /**
   * The answer must be a single move — anything needing follow-up is only kept
   * when it is a forced mate, which explains itself.
   */
  oneMove: boolean;
  /** The first move must be a capture, a check, or mate. */
  forcing: boolean;
  /**
   * Centipawns the best move must beat the second-best by, or null for "don't
   * care". This is what stops a puzzle having two right answers and only
   * accepting one of them.
   */
  onlyMargin: number | null;
  /** Centipawns the answer must win over what was actually played. */
  minGain: number;
  /** ...and how good the position it reaches must be. */
  minFinal: number;
  /**
   * Mistakes examined per game, and puzzles kept from it. Strict rules reject
   * most of what they are shown, so the easier bands have to look at more of
   * each game to come back with a full day.
   */
  tryPerGame: number;
  keepPerGame: number;
}

const CASUAL: Difficulty = {
  band: "casual",
  // Three half-moves so a mate in two still fits; anything else is cut to one.
  maxLine: 3,
  oneMove: true,
  forcing: true,
  onlyMargin: 100,
  minGain: 300,
  minFinal: 200,
  tryPerGame: 10,
  keepPerGame: 3,
};

const CLUB: Difficulty = {
  band: "club",
  maxLine: 3,
  oneMove: false,
  forcing: false,
  onlyMargin: 60,
  minGain: 250,
  minFinal: 150,
  tryPerGame: 7,
  keepPerGame: 2,
};

const STRONG: Difficulty = {
  band: "strong",
  maxLine: 5,
  oneMove: false,
  forcing: false,
  onlyMargin: null,
  minGain: 200,
  minFinal: 150,
  tryPerGame: 5,
  keepPerGame: 2,
};

/** Unrated, or nobody connected: assume the player who needs the help. */
export const DEFAULT_DIFFICULTY = CASUAL;

/** Loosest first — the order the miner walks when a day comes up short. */
const LADDER = [CASUAL, CLUB, STRONG];

/**
 * The next rung up, for a second pass over the same games.
 *
 * Twenty games do not always contain fifteen one-move tactics, and a day that
 * stops at eight is a worse answer than a day whose last few are a little
 * harder. So the strict rules run first and get the easy moments; only what is
 * left of the day is filled from further up the ladder.
 */
export function relaxFrom(d: Difficulty, step: number): Difficulty {
  const i = Math.max(0, LADDER.indexOf(d));
  return LADDER[Math.min(LADDER.length - 1, i + step)];
}

/** Rungs above `d` — how many relaxed passes are worth trying at all. */
export function rungsAbove(d: Difficulty): number {
  return LADDER.length - 1 - Math.max(0, LADDER.indexOf(d));
}

export function difficultyFor(rating: number | null): Difficulty {
  if (rating == null) return DEFAULT_DIFFICULTY;
  if (rating < 1400) return CASUAL;
  if (rating < 1900) return CLUB;
  return STRONG;
}

/**
 * The rating to judge someone by: rapid first, since that is the one most
 * players think of as theirs, then whatever else they actually play.
 */
export function ratingOf(profile: ChessProfile | null): number | null {
  const s = profile?.stats;
  return (
    s?.rapid?.rating ??
    s?.blitz?.rating ??
    s?.bullet?.rating ??
    s?.daily?.rating ??
    null
  );
}
