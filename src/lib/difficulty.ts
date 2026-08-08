import type { ChessProfile } from "@/hooks/use-chess-account";
import type { PuzzleDifficulty, PuzzleTheme, SolvePuzzle } from "@/types";

/**
 * What a position has to clear to become a puzzle.
 *
 * Deliberately *not* about the solver's rating. A puzzle is never cut short
 * because someone is 1100 — a mate in three is a mate in three, and stopping it
 * after one move teaches half a lesson. What the rating does affect is which
 * puzzles get chosen when there are more candidates than places, and that
 * happens in the ranking, not here.
 */
export interface Standard {
  /** Centipawns the answer must win over what was actually played. */
  minSwing: number;
  /** The first move must be a capture, a check or mate. */
  requireForcing: boolean;
  /**
   * Centipawns the best move must beat the second-best by, or null for "don't
   * care". This is what stops a puzzle having two right answers.
   */
  onlyMargin: number | null;
  /** Within this of the best, a line counts as a real alternative to weigh. */
  alternativeBand: number;
}

/**
 * Tried in order. The first is what a curated set should be made of; the
 * others exist only so that a day with thin games still fills, and each one
 * gives up less than leaving the set short would.
 */
export const STANDARDS: Standard[] = [
  { minSwing: 300, requireForcing: true, onlyMargin: 100, alternativeBand: 80 },
  { minSwing: 250, requireForcing: false, onlyMargin: 60, alternativeBand: 80 },
  { minSwing: 200, requireForcing: false, onlyMargin: null, alternativeBand: 80 },
];

/**
 * How hard this position is to solve — judged from the position.
 *
 * Length is one input among several and not the deciding one: a mate in three
 * where every move is a check is easier than a single quiet move that holds a
 * lost position, and this says so.
 */
export function estimateDifficulty(f: {
  /** Moves the solver has to find. */
  userMoves: number;
  /** Moves within a whisker of the best — real choices to weigh up. */
  alternatives: number;
  /** The key move is a capture or a check, so the eye lands on it. */
  forcing: boolean;
  /** Centipawns won. A big swing usually means an obvious target. */
  swing: number;
  mate: boolean;
}): PuzzleDifficulty {
  let score = 0;

  // Calculation depth, but gently — and a forced mate carries its own signposts.
  score += (f.userMoves - 1) * (f.mate ? 1.2 : 1.8);
  // Choosing between three plausible moves is most of what makes a puzzle hard.
  score += (f.alternatives - 1) * 1.6;
  // A quiet move is the hard kind: nothing about it asks to be looked at.
  if (!f.forcing) score += 2;
  // Winning a queen announces itself; winning a pawn does not.
  if (f.swing < 300) score += 1.2;
  else if (f.swing >= 700) score -= 0.8;

  if (score <= 2.2) return "easy";
  if (score <= 5) return "medium";
  return "hard";
}

/**
 * The badge each lesson wears.
 *
 * Chess.com's art has fixed meanings — "??" is a blunder, the crossed circle is
 * a miss — so the badge has to agree with the words next to it. A lesson about
 * failing to punish something is a *miss*; one about handing material over is a
 * blunder; letting a won position drift is a mistake.
 */
export const THEME_ICON: Record<PuzzleTheme, string> = {
  "mate-attack": "/move-types/missed.png",
  "winning-combination": "/move-types/missed.png",
  "missed-tactic": "/move-types/missed.png",
  "punish-mistake": "/move-types/missed.png",
  "defensive-resource": "/move-types/blunder.png",
  "blunder-prevention": "/move-types/blunder.png",
  "endgame-conversion": "/move-types/mistake.png",
};

/** Human label for a theme, as a coach would name it. */
export const THEME_LABEL: Record<PuzzleTheme, string> = {
  "mate-attack": "Mating attack",
  "winning-combination": "Winning combination",
  "missed-tactic": "Missed tactic",
  "defensive-resource": "Defensive resource",
  "blunder-prevention": "Blunder prevention",
  "endgame-conversion": "Endgame conversion",
  "punish-mistake": "Punishing a mistake",
};

/**
 * What each lesson is worth in a set of fifteen.
 *
 * A missed mate is the most instructive thing that can come out of a game, and
 * a defensive resource is the rarest and least practised — both are worth more
 * than another "you dropped a piece", however large its evaluation swing.
 */
const THEME_VALUE: Record<PuzzleTheme, number> = {
  "mate-attack": 1,
  "defensive-resource": 0.95,
  "winning-combination": 0.9,
  "endgame-conversion": 0.85,
  "punish-mistake": 0.8,
  "missed-tactic": 0.75,
  "blunder-prevention": 0.7,
};

const DIFFICULTY_ORDER: Record<PuzzleDifficulty, number> = {
  easy: 0,
  medium: 1,
  hard: 2,
};

/** Swing in centipawns, from the played move to the end of the solution. */
function swingOf(p: SolvePuzzle): number {
  const last = p.line[p.line.length - 1];
  if (!last) return 0;
  return Math.max(0, last.cp - p.start.cp);
}

/**
 * How much a puzzle earns its place, from 0 to 1.
 *
 * Evaluation swing first, because it is the closest thing to "how much did this
 * moment cost"; then what the lesson is worth, then how clearly it reads. The
 * rating is a light touch on the last term only — for a player who is still
 * learning to see tactics, a clear one is worth more than a subtle one.
 */
function value(p: SolvePuzzle, rating: number | null): number {
  const swing = Math.min(1, swingOf(p) / 900);
  const theme = THEME_VALUE[p.theme ?? "missed-tactic"];
  const clarity = 1 - DIFFICULTY_ORDER[p.difficulty ?? "medium"] * 0.35;
  const clarityWeight = rating != null && rating < 1400 ? 0.3 : 0.18;
  const swingWeight = 0.45;
  const themeWeight = 1 - swingWeight - clarityWeight;
  return swing * swingWeight + theme * themeWeight + clarity * clarityWeight;
}

/**
 * Choose the day's set out of everything that was mined.
 *
 * Ranked by value, then filled with a cap on how many of one lesson may be
 * taken — a set of fifteen hanging queens is a worse day than a set that also
 * asks the solver to defend once and mate once, even if every hanging queen
 * outranked them. The cap lifts once the good candidates run out, so a thin
 * archive still fills the day rather than being held to a quota it cannot meet.
 */
export function selectSet(
  pool: SolvePuzzle[],
  size: number,
  rating: number | null,
): SolvePuzzle[] {
  const ranked = [...pool].sort((a, b) => value(b, rating) - value(a, rating));
  const perTheme = Math.max(2, Math.ceil(size / 4));
  const taken: SolvePuzzle[] = [];
  const counts = new Map<string, number>();
  const seen = new Set<string>();

  for (const p of ranked) {
    if (taken.length >= size) break;
    const theme = p.theme ?? "missed-tactic";
    if ((counts.get(theme) ?? 0) >= perTheme) continue;
    counts.set(theme, (counts.get(theme) ?? 0) + 1);
    seen.add(p.id);
    taken.push(p);
  }

  // Quota lifted: whatever is left, best first, until the day is full.
  for (const p of ranked) {
    if (taken.length >= size) break;
    if (seen.has(p.id)) continue;
    taken.push(p);
  }

  return taken;
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
