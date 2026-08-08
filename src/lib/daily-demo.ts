import type { SolvePuzzle } from "@/types";

/**
 * The version-2 diary, made up.
 *
 * V2 is a shape being tried, not a pipeline: it asks what the feature feels
 * like when puzzles arrive a day at a time and the calendar becomes a record of
 * what you have cleared. Answering that does not require the days to be real,
 * and waiting for an engine to mine a month of them would make the question
 * impossible to look at. So the puzzles are the real ones — mined from actual
 * games, or the authored sample set before any of those exist — dealt out
 * across August: one to five on most days, nothing at all on some, because a
 * calendar with something on every square is not a calendar anyone recognises.
 *
 * Deterministic, from the date itself. The same day always holds the same
 * puzzles, so a reload doesn't reshuffle the month underneath somebody.
 */

/** Days with no games at all — roughly a quarter of them. */
const REST_DAY_CHANCE = 0.26;
const MAX_PER_DAY = 5;

/** Small, fast, and stable: the same string always gives the same stream. */
function seeded(str: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher–Yates, driven by the seeded stream so the order is reproducible. */
function shuffle<T>(items: T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const key = (y: number, m: number, d: number) =>
  `${y}-${`${m + 1}`.padStart(2, "0")}-${`${d}`.padStart(2, "0")}`;

/**
 * August, as days holding puzzles.
 *
 * Only up to and including today: a day you have not reached yet cannot have
 * games in it, and a calendar that offers tomorrow's puzzles gives the game
 * away. Each puzzle is re-keyed with its day so that solving one on the 3rd
 * doesn't quietly tick the same position off on the 12th.
 */
export function demoSchedule(
  source: SolvePuzzle[],
  today = new Date(),
): Map<string, SolvePuzzle[]> {
  const out = new Map<string, SolvePuzzle[]>();
  if (source.length === 0) return out;

  const year = today.getFullYear();
  const august = 7; // zero-based
  const last =
    today.getMonth() > august
      ? 31
      : today.getMonth() < august
        ? 0
        : today.getDate();

  /*
    Dealt, not sampled.

    The pool is shuffled once and handed out in order, so a puzzle appears on
    exactly one day and never twice in the month. When the deck runs out the
    remaining days simply have nothing in them — a short month of distinct
    puzzles is a better prototype than a full one that repeats itself, because
    the repeat is the thing a viewer notices and it is not part of the idea.
  */
  const deck = shuffle(source, seeded(`deck-${year}`));
  let cursor = 0;

  // Dealt backwards from today. The deck is finite, so somebody has to go
  // without — and it should be a fortnight ago, not this morning. Today is the
  // day the feature is about.
  for (let d = last; d >= 1 && cursor < deck.length; d--) {
    const day = key(year, august, d);
    const rand = seeded(day);
    if (rand() < REST_DAY_CHANCE) continue; // a day off

    const want = 1 + Math.floor(rand() * MAX_PER_DAY);
    const take = Math.min(want, deck.length - cursor);
    const picked = deck
      .slice(cursor, cursor + take)
      .map((p) => ({ ...p, id: `${p.id}@${day}`, playedOn: day }));
    cursor += take;
    out.set(day, picked);
  }
  return out;
}
