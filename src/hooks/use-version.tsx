"use client";

import * as React from "react";

/**
 * Which shape of the feature is on screen.
 *
 * Two ways of answering "which games become puzzles", kept side by side so they
 * can be compared on the same account rather than argued about in the abstract:
 *
 *  · **v1** — a rolling window. Your last ten reviewed games, however many
 *    puzzles that turns out to be. One set, always there.
 *  · **v2** — a diary. The games you played on a given day become that day's
 *    puzzles, and the calendar remembers which days you have cleared.
 *
 * Prototype state, switched from the flask in the sidebar, and persisted for the
 * same reason the plan is: a reviewer who reloads should still be looking at the
 * version they chose.
 */
export type PuzzleVersion = "v1" | "v2";

const STORAGE_KEY = "gbp:version";

/** Games a version-1 set is drawn from. */
export const V1_WINDOW = 10;

interface VersionValue {
  version: PuzzleVersion;
  setVersion: (v: PuzzleVersion) => void;
  /** v2 only: the day being looked at, as YYYY-MM-DD in local time. */
  day: string | null;
  setDay: (d: string | null) => void;
}

const Ctx = React.createContext<VersionValue | null>(null);

/** A Date as YYYY-MM-DD in the viewer's own timezone. */
export function dayKey(d: Date | number): string {
  const date = typeof d === "number" ? new Date(d * 1000) : d;
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${date.getFullYear()}-${m}-${day}`;
}

/** "2026-08-05" → "Aug 5, 2026". */
export function dayLabel(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  // Pinned to en-US so the date reads the way the design does ("Aug 5, 2026")
  // rather than however the viewer's locale happens to order it.
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function VersionProvider({ children }: { children: React.ReactNode }) {
  const [version, setVersionState] = React.useState<PuzzleVersion>("v1");
  const [day, setDay] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "v1" || saved === "v2") setVersionState(saved);
    } catch {
      // Storage denied — the default stands.
    }
  }, []);

  const setVersion = React.useCallback((v: PuzzleVersion) => {
    setVersionState(v);
    // Switching versions drops the day: v1 has no notion of one, and coming
    // back to v2 should land on the most recent day with games rather than
    // whatever was being browsed twenty minutes ago.
    setDay(null);
    try {
      window.localStorage.setItem(STORAGE_KEY, v);
    } catch {
      /* nothing to do */
    }
  }, []);

  const value = React.useMemo(
    () => ({ version, setVersion, day, setDay }),
    [version, setVersion, day],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useVersion(): VersionValue {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useVersion must be used inside VersionProvider");
  return ctx;
}
