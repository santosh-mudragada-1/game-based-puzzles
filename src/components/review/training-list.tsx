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

export const TRAINING_ROWS: {
  key: string;
  label: string;
  icon: string;
  locked?: boolean;
  href?: string;
  /** What the coach says while this row is the one being offered. */
  coach: string;
}[] = [
  {
    key: "openings",
    label: "Openings",
    icon: NAV_ICON.learn,
    coach:
      "You're usually quite good at the beginning stages of a game. Something went wrong in this one.",
  },
  {
    key: "puzzles",
    label: "Solve game puzzles",
    icon: GAME_ICON.gameBasedPuzzles,
    href: "/puzzles/game-based",
    coach:
      "The moments you got wrong in this game are waiting as puzzles. Same positions, same choices — this time with the answer still to find.",
  },
  {
    key: "tactics",
    label: "Tactics",
    icon: NAV_ICON.puzzles,
    locked: true,
    coach:
      "Go Diamond and get Advanced Stats to see the tactics you're best at.",
  },
  {
    key: "strategy",
    label: "Strategy",
    icon: NAV_ICON.train,
    locked: true,
    coach:
      "Want more tips? Diamond members get Advanced Stats for a personalized look at how to improve their strategy.",
  },
  {
    key: "endgames",
    label: "Endgames",
    icon: pieceImage("K"),
    locked: true,
    coach:
      "Become a Diamond member to get Advanced Stats and see where your endgame technique shines.",
  },
];

export function TrainingList({
  gameId,
  highlight,
  className,
}: {
  /** Deep-links "Solve game puzzles" straight into this game's own set. */
  gameId?: string;
  /**
   * Index of the row Next has walked to, or −1 before it has started.
   *
   * Pressing Next at the end of the game steps down this list rather than doing
   * nothing: the review has run out of moves to talk about, so it starts
   * offering what to do next, one at a time.
   */
  highlight?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-0.5", className)}>
      {TRAINING_ROWS.map((r, i) => {
        const lit = highlight === i;
        const inner = (
          <>
            <Image src={r.icon} width={24} height={24} alt="" className="shrink-0" />
            <span
              className={cn(
                "flex-1 text-[15px] font-semibold",
                lit ? "text-white" : "text-ink",
              )}
            >
              {r.label}
            </span>
            {r.locked && <Lock className="size-[18px] shrink-0 text-ink-faint" />}
          </>
        );
        const shell = cn(
          "flex w-full items-center gap-3 rounded-[8px] px-4 py-3 text-left transition-colors",
          // Lit is a lift, not an outline: the row the coach is talking about
          // comes forward out of the list rather than being ringed like a
          // form field.
          lit ? "bg-white/[0.13]" : "bg-white/[0.04]",
        );

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
