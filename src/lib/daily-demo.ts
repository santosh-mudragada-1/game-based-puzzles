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

  let cursor = 0;
  for (let d = 1; d <= last; d++) {
    const day = key(year, august, d);
    const rand = seeded(day);
    if (rand() < REST_DAY_CHANCE) continue; // a day off

    const count = 1 + Math.floor(rand() * MAX_PER_DAY);
    const picked: SolvePuzzle[] = [];
    for (let i = 0; i < count; i++) {
      const p = source[cursor % source.length];
      cursor++;
      picked.push({ ...p, id: `${p.id}@${day}`, playedOn: day });
    }
    out.set(day, picked);
  }
  return out;
}
