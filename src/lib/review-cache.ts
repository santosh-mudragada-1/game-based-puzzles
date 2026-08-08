import type { Classified } from "@/lib/classify";
import type { SolvePuzzle } from "@/types";

/**
 * What the engine worked out last time, kept between visits.
 *
 * Reviewing twenty games is half a minute of every core the machine has, and
 * the answer never changes — the same position at the same settings scores the
 * same. Redoing it on every reload is the loading screen appearing for work
 * that has already been done, and worse, the puzzles come out different each
 * time, so the set someone was halfway through is gone.
 *
 * Local storage rather than a server: the whole app talks to Chess.com's public
 * read-only API and keeps nothing of its own, so there is no account to file
 * this against. It survives reloads and closing the tab, which is what it is
 * for; it does not follow the member to another browser.
 */
/**
 * The version is part of the key on purpose: what counts as a puzzle depends on
 * the difficulty rules, so changing those has to invalidate everything mined
 * under the old ones rather than serving them back for another visit.
 */
const KEY = "gbp:reviews:v5";

/** Games kept, newest write last — a bound on how large this can grow. */
const MAX_GAMES = 60;

export interface CachedReview {
  accuracy: { white: number; black: number } | null;
  /** One row per ply. Empty when the rows had to be dropped to fit. */
  rows: Classified[];
  total: number;
  mistakes: number;
}

export interface ReviewCache {
  username: string;
  savedAt: number;
  reviews: Record<string, CachedReview>;
  /** The day's set, so a reload hands back the same fifteen puzzles. */
  puzzles: SolvePuzzle[];
  gamePuzzles: Record<string, SolvePuzzle[]>;
  /** Games taken apart in full, so "Solve" doesn't redo them. */
  mined: string[];
}

/**
 * Whatever was stored for this account, or null.
 *
 * Keyed by username inside the record rather than in the key itself: only one
 * account is connected at a time, and a stale one should be replaced outright
 * rather than left behind taking up the quota.
 */
export function loadReviewCache(username: string): ReviewCache | null {
  if (!username) return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as ReviewCache;
    if (data?.username !== username || !data.reviews) return null;
    return {
      username,
      savedAt: data.savedAt ?? 0,
      reviews: data.reviews,
      puzzles: data.puzzles ?? [],
      gamePuzzles: data.gamePuzzles ?? {},
      mined: data.mined ?? [],
    };
  } catch {
    // Corrupt or unreadable — treat it as a first visit.
    return null;
  }
}

/**
 * Write the cache, shedding weight rather than failing.
 *
 * The rows are most of the bytes and the least of the value: without them a
 * game still shows its accuracy and still has its puzzles, it just has to be
 * re-read to be opened move by move. So a full store that won't fit is retried
 * without them before giving up.
 */
export function saveReviewCache(cache: ReviewCache) {
  const entries = Object.entries(cache.reviews).slice(-MAX_GAMES);
  const write = (reviews: Record<string, CachedReview>) =>
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ ...cache, savedAt: Date.now(), reviews }),
    );

  try {
    write(Object.fromEntries(entries));
  } catch {
    try {
      write(
        Object.fromEntries(entries.map(([id, r]) => [id, { ...r, rows: [] }])),
      );
    } catch {
      // Storage full or denied outright — the next visit reviews again.
      try {
        window.localStorage.removeItem(KEY);
      } catch {
        /* nothing further to try */
      }
    }
  }
}
