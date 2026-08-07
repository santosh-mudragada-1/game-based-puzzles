"use client";

import * as React from "react";
import type { ArchivedGame } from "@/lib/chesscom";

/**
 * Months fetched at a time. Chess.com is fine with a handful of parallel
 * reads and it turns a 27-month archive from a minute into a few seconds;
 * going wider starts drawing rate limits.
 */
const BATCH = 4;
const STORAGE_KEY = "gbp:chesscom";

/**
 * The archive itself, kept between visits.
 *
 * Twenty-seven months of games is a few seconds of fetching every single time
 * the tab is reloaded, and it is the same games — an archive only ever gains a
 * game at the end. Holding it means a reload has the app on screen immediately
 * and goes looking for what is new behind it, instead of putting a progress bar
 * in front of somebody who was already here a minute ago.
 */
const ARCHIVE_KEY = "gbp:archive:v1";

/**
 * Games kept, newest first.
 *
 * The whole archive is thousands of PGNs and would crowd the origin's quota —
 * taking the review cache down with it, which is the one that costs half a
 * minute of engine time to rebuild. Two hundred games is the top of the history
 * table, every opponent on the rail and far more than the sweep looks at; the
 * rest arrive seconds later from the refresh, by which time nobody has scrolled
 * that far.
 */
const CACHED_GAMES = 200;

/** A hard ceiling even so, for an account whose games are unusually long. */
const MAX_ARCHIVE_CHARS = 1_500_000;

interface CachedArchive {
  username: string;
  savedAt: number;
  profile: ChessProfile;
  games: ArchivedGame[];
}

function loadArchive(username: string): CachedArchive | null {
  try {
    const raw = window.localStorage.getItem(ARCHIVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as CachedArchive;
    if (data?.username !== username || !Array.isArray(data.games)) return null;
    if (!data.games.length || !data.profile) return null;
    return data;
  } catch {
    return null;
  }
}

function saveArchive(a: CachedArchive) {
  try {
    const json = JSON.stringify({ ...a, games: a.games.slice(0, CACHED_GAMES) });
    if (json.length > MAX_ARCHIVE_CHARS) {
      window.localStorage.removeItem(ARCHIVE_KEY);
      return;
    }
    window.localStorage.setItem(ARCHIVE_KEY, json);
  } catch {
    // Quota or private browsing — the next visit fetches as it always did.
    try {
      window.localStorage.removeItem(ARCHIVE_KEY);
    } catch {
      /* nothing further to try */
    }
  }
}

export interface RatingBucket {
  rating: number | null;
  best: number | null;
  win: number;
  loss: number;
  draw: number;
}

export interface ChessProfile {
  username: string;
  name: string | null;
  avatar: string | null;
  country: string | null;
  title: string | null;
  followers: number | null;
  joined: number | null;
  lastOnline: number | null;
  url: string | null;
  stats: {
    rapid: RatingBucket | null;
    blitz: RatingBucket | null;
    bullet: RatingBucket | null;
    daily: RatingBucket | null;
    puzzles: number | null;
  };
}

export interface LoadProgress {
  /** Months already pulled. */
  done: number;
  /** Months we intend to pull. */
  total: number;
  /** Games found so far. */
  games: number;
  /** The month being fetched, e.g. "August 2026". */
  label: string;
}

type Status = "idle" | "loading" | "ready" | "error";

interface ChessAccountValue {
  profile: ChessProfile | null;
  games: ArchivedGame[];
  status: Status;
  error: string | null;
  progress: LoadProgress;
  /** True until the stored username has been read — avoids a popup flash. */
  ready: boolean;
  /** This load came from a remembered username, not from the dialog. */
  restored: boolean;
  /** Bumped on disconnect, to put the username prompt back on screen. */
  promptNonce: number;
  connect: (username: string, silent?: boolean) => Promise<void>;
  disconnect: () => void;
}

const Ctx = React.createContext<ChessAccountValue | null>(null);

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "…/games/2026/08" → "August 2026". */
function archiveLabel(url: string): string {
  const m = /\/(\d{4})\/(\d{2})$/.exec(url);
  if (!m) return "";
  return `${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

/**
 * The connected Chess.com account and the games pulled from it.
 *
 * Only the username is persisted — the same rule the plan switcher follows.
 * Games are re-fetched on load so a stale archive never sits in storage, and
 * because a few hundred PGNs would blow past the localStorage quota anyway.
 */
export function ChessAccountProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, setProfile] = React.useState<ChessProfile | null>(null);
  const [games, setGames] = React.useState<ArchivedGame[]>([]);
  const [status, setStatus] = React.useState<Status>("idle");
  const [error, setError] = React.useState<string | null>(null);
  const [ready, setReady] = React.useState(false);
  const [restored, setRestored] = React.useState(false);
  const [promptNonce, setPromptNonce] = React.useState(0);
  const [progress, setProgress] = React.useState<LoadProgress>({
    done: 0,
    total: 0,
    games: 0,
    label: "",
  });

  /** Guards against two loads racing (e.g. a re-connect mid-fetch). */
  const runId = React.useRef(0);

  /**
   * Load an account.
   *
   * `background` is the refresh behind a restored archive: same fetch, but the
   * app is already up and showing the stored games, so it must not be dropped
   * into a loading state or emptied out while the new copy is on its way.
   */
  const connect = React.useCallback(
    async (username: string, silent = false, background = false) => {
    setRestored(silent);
    const name = username.trim();
    if (!name) return;

    const run = ++runId.current;
    if (!background) {
      setStatus("loading");
      setError(null);
      setGames([]);
      setProgress({ done: 0, total: 0, games: 0, label: "Finding the account…" });
    }

    try {
      const res = await fetch(
        `/api/chesscom/archives?u=${encodeURIComponent(name)}`,
      );
      const data = await res.json();
      if (run !== runId.current) return;

      if (!res.ok) {
        // A refresh that fails leaves the stored archive standing — it was
        // good a moment ago, and it is better than an error over a working app.
        if (background) return;
        setStatus("error");
        setError(data.error ?? "Could not load that account.");
        return;
      }

      const found: ChessProfile = {
        username: data.username,
        name: data.name,
        avatar: data.avatar,
        country: data.country,
        title: data.title ?? null,
        followers: data.followers ?? null,
        joined: data.joined ?? null,
        lastOnline: data.lastOnline ?? null,
        url: data.url ?? null,
        stats: data.stats ?? {
          rapid: null,
          blitz: null,
          bullet: null,
          daily: null,
          puzzles: null,
        },
      };
      setProfile(found);
      window.localStorage.setItem(STORAGE_KEY, found.username);

      // Every month the account has — "all my games" means all of them.
      const archives: string[] = data.archives ?? [];
      if (archives.length === 0) {
        setStatus("ready");
        setProgress({ done: 0, total: 0, games: 0, label: "" });
        return;
      }

      const collected: ArchivedGame[] = [];
      for (let i = 0; i < archives.length; i += BATCH) {
        const slice = archives.slice(i, i + BATCH);
        if (!background) {
          setProgress({
            done: i,
            total: archives.length,
            games: collected.length,
            label: archiveLabel(slice[0]),
          });
        }

        const months = await Promise.all(
          slice.map((a) =>
            fetch(
              `/api/chesscom/month?u=${encodeURIComponent(found.username)}&archive=${encodeURIComponent(a)}`,
            ).then((r) => r.json()),
          ),
        );
        if (run !== runId.current) return;
        for (const m of months)
          collected.push(...((m.games ?? []) as ArchivedGame[]));

        // Show them as they arrive — the list fills in rather than blinking on.
        // A refresh publishes once at the end instead: the app is already
        // showing a complete archive and must not flicker down to a partial one.
        if (!background) {
          setGames([...collected].sort((a, b) => b.endTime - a.endTime));
        }
      }

      if (run !== runId.current) return;
      collected.sort((a, b) => b.endTime - a.endTime);
      setGames(collected);
      saveArchive({
        username: found.username,
        savedAt: Date.now(),
        profile: found,
        games: collected,
      });
      setProgress({
        done: archives.length,
        total: archives.length,
        games: collected.length,
        label: "",
      });
      setStatus("ready");
    } catch {
      if (run !== runId.current || background) return;
      setStatus("error");
      setError("Could not reach Chess.com. Check your connection.");
    }
    },
    [],
  );

  const disconnect = React.useCallback(() => {
    runId.current++;
    window.localStorage.removeItem(STORAGE_KEY);
    setProfile(null);
    setGames([]);
    setStatus("idle");
    setError(null);
    setRestored(false);
    setPromptNonce((n) => n + 1);
  }, []);

  /**
   * A remembered username reconnects itself on load.
   *
   * With the archive already stored, that is instant: the games go up as they
   * were and Chess.com is asked what has changed behind them. Only a first
   * visit — or an account whose archive was too large to keep — waits.
   */
  React.useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    setReady(true);
    if (!saved) return;

    const cached = loadArchive(saved);
    if (!cached) {
      void connect(saved, true);
      return;
    }
    setProfile(cached.profile);
    setGames(cached.games);
    setRestored(true);
    setStatus("ready");
    void connect(saved, true, true);
  }, [connect]);

  const value = React.useMemo(
    () => ({
      profile,
      games,
      status,
      error,
      progress,
      ready,
      restored,
      promptNonce,
      connect,
      disconnect,
    }),
    [
      profile,
      games,
      status,
      error,
      progress,
      ready,
      restored,
      promptNonce,
      connect,
      disconnect,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useChessAccount(): ChessAccountValue {
  const ctx = React.useContext(Ctx);
  if (!ctx) {
    throw new Error("useChessAccount must be used inside ChessAccountProvider");
  }
  return ctx;
}
