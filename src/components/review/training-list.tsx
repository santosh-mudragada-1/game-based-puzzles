"use client";

import Image from "next/image";
import Link from "next/link";
import { Lock } from "lucide-react";

import { GAME_ICON, NAV_ICON } from "@/lib/assets";
import { pieceImage } from "@/lib/chess";
import { cn } from "@/lib/utils";

/**
 * What to do next, once the review has played out.
 *
 * Chess.com puts this at the end of a game review: the drills the game itself
 * has earned you. Everything but the openings recap is premium — except
 * "Solve game puzzles", which is this feature, and is the reason the list is
 * here at all. It appears only on the last move, where the review is over and
 * the question stops being "what happened" and becomes "what now".
 */

const ROWS: {
  key: string;
  label: string;
  icon: string;
  locked?: boolean;
  href?: string;
}[] = [
  { key: "openings", label: "Openings", icon: NAV_ICON.learn },
  {
    key: "puzzles",
    label: "Solve game puzzles",
    icon: GAME_ICON.gameBasedPuzzles,
    href: "/puzzles/game-based",
  },
  { key: "tactics", label: "Tactics", icon: NAV_ICON.puzzles, locked: true },
  { key: "strategy", label: "Strategy", icon: NAV_ICON.train, locked: true },
  { key: "endgames", label: "Endgames", icon: pieceImage("K"), locked: true },
];

export function TrainingList({
  gameId,
  className,
}: {
  /** Deep-links "Solve game puzzles" straight into this game's own set. */
  gameId?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-0.5", className)}>
      {ROWS.map((r) => {
        const inner = (
          <>
            <Image src={r.icon} width={24} height={24} alt="" className="shrink-0" />
            <span className="flex-1 text-[15px] font-semibold text-ink">
              {r.label}
            </span>
            {r.locked && <Lock className="size-[18px] shrink-0 text-ink-faint" />}
          </>
        );
        const shell =
          "flex w-full items-center gap-3 rounded-[8px] bg-white/[0.04] px-4 py-3 text-left transition-colors";

        if (r.href && !r.locked) {
          return (
            <Link
              key={r.key}
              href={gameId ? `${r.href}?game=${gameId}` : r.href}
              className={cn(shell, "hover:bg-white/[0.08]")}
            >
              {inner}
            </Link>
          );
        }
        return (
          <button
            key={r.key}
            type="button"
            disabled={r.locked}
            className={cn(
              shell,
              r.locked ? "opacity-60" : "hover:bg-white/[0.08]",
            )}
          >
            {inner}
          </button>
        );
      })}
    </div>
  );
}
