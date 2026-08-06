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

  const connect = React.useCallback(async (username: string, silent = false) => {
    setRestored(silent);
    const name = username.trim();
    if (!name) return;

    const run = ++runId.current;
    setStatus("loading");
    setError(null);
    setGames([]);
    setProgress({ done: 0, total: 0, games: 0, label: "Finding the account…" });

    try {
      const res = await fetch(
        `/api/chesscom/archives?u=${encodeURIComponent(name)}`,
      );
      const data = await res.json();
      if (run !== runId.current) return;

      if (!res.ok) {
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
        setProgress({
          done: i,
          total: archives.length,
          games: collected.length,
          label: archiveLabel(slice[0]),
        });

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
        setGames(
          [...collected].sort((a, b) => b.endTime - a.endTime),
        );
      }

      if (run !== runId.current) return;
      collected.sort((a, b) => b.endTime - a.endTime);
      setGames(collected);
      setProgress({
        done: archives.length,
        total: archives.length,
        games: collected.length,
        label: "",
      });
      setStatus("ready");
    } catch {
      if (run !== runId.current) return;
      setStatus("error");
      setError("Could not reach Chess.com. Check your connection.");
    }
  }, []);

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

  // A remembered username reconnects itself on load.
  React.useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    setReady(true);
    if (saved) void connect(saved, true);
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
