"use client";

import * as React from "react";
import { useChessAccount } from "@/hooks/use-chess-account";

export interface OpponentProfile {
  username: string;
  name?: string | null;
  avatar: string | null;
  country: string | null;
  title?: string | null;
  lastOnline?: number | null;
  url?: string | null;
  /** Games played against them in the loaded archive. */
  games: number;
}

/** Online, by Chess.com's own reckoning on the profile endpoint. */
const ONLINE_WITHIN = 15 * 60;

/**
 * One fetch per set of names, however many components ask for it — the home
 * page wants the same eight profiles for the rail and the review card.
 */
const cache = new Map<string, Promise<Omit<OpponentProfile, "games">[]>>();

function load(key: string) {
  const held = cache.get(key);
  if (held) return held;
  const req = fetch(`/api/chesscom/players?u=${encodeURIComponent(key)}`)
    .then((r) => r.json())
    .then((d: { players?: Omit<OpponentProfile, "games">[] }) => d.players ?? [])
    .catch(() => {
      cache.delete(key);
      return [] as Omit<OpponentProfile, "games">[];
    });
  cache.set(key, req);
  return req;
}

/**
 * The people this member actually plays, most recent first, with their real
 * Chess.com photos.
 *
 * The public API has no friends list, so the honest stand-in for one is the
 * opponent list: the same faces, drawn from the archive that is already loaded.
 */
export function useOpponents(limit = 8): {
  opponents: OpponentProfile[];
  loading: boolean;
} {
  const { games, profile } = useChessAccount();
  const [profiles, setProfiles] = React.useState<
    Record<string, Omit<OpponentProfile, "games">>
  >({});
  const [loading, setLoading] = React.useState(false);

  /** Most recently played opponents, deduplicated, with a game count each. */
  const recent = React.useMemo(() => {
    const me = (profile?.username ?? "").toLowerCase();
    if (!me) return [];
    const seen = new Map<string, { username: string; games: number }>();
    for (const g of games) {
      const other =
        g.white.username.toLowerCase() === me ? g.black : g.white;
      const key = other.username.toLowerCase();
      const held = seen.get(key);
      if (held) held.games++;
      else seen.set(key, { username: other.username, games: 1 });
    }
    return [...seen.values()].slice(0, limit);
  }, [games, profile, limit]);

  const key = recent.map((r) => r.username).join(",");

  React.useEffect(() => {
    if (!key) {
      setProfiles({});
      return;
    }
    let live = true;
    setLoading(true);
    load(key)
      .then((players) => {
        if (!live) return;
        const next: Record<string, Omit<OpponentProfile, "games">> = {};
        for (const p of players) next[p.username.toLowerCase()] = p;
        setProfiles(next);
      })
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [key]);

  const opponents = recent.map((r) => {
    const p = profiles[r.username.toLowerCase()];
    return {
      // The archive keeps the display casing ("LeDuc23"); the profile endpoint
      // lowercases it, so the name comes from the archive and the rest from the
      // profile.
      username: r.username,
      name: p?.name ?? null,
      avatar: p?.avatar ?? null,
      country: p?.country ?? null,
      title: p?.title ?? null,
      lastOnline: p?.lastOnline ?? null,
      url: p?.url ?? null,
      games: r.games,
    };
  });

  return { opponents, loading };
}

/** True when the member was seen within Chess.com's "online now" window. */
export function isOnline(lastOnline?: number | null): boolean {
  return lastOnline != null && Date.now() / 1000 - lastOnline < ONLINE_WITHIN;
}
