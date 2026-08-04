"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowRight, RefreshCw } from "lucide-react";
import type { GeneratedPuzzle } from "@/types";
import { Card } from "@/components/shared/card";
import { Button } from "@/components/shared/button";
import { Reveal } from "@/components/shared/reveal";
import { PuzzlePreviewItem } from "./puzzle-preview-item";
import { TrainingCTA } from "./training-cta";
import { GAME_ICON } from "@/lib/assets";
import { cn } from "@/lib/utils";

/** Animate a number from 0 -> target once on mount (respects reduced motion). */
function useCountUp(target: number, durationMs = 850) {
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setN(target);
      return;
    }
    let raf = 0;
    let start = 0;
    const tick = (t: number) => {
      if (!start) start = t;
      const p = Math.min((t - start) / durationMs, 1);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return n;
}

/** Entrance-stagger timing — single source of truth (also used by the page footer). */
export const PUZZLE_LIST_START = 0.4;
export const PUZZLE_STAGGER = 0.07;
export const puzzleFooterDelay = (count: number) =>
  PUZZLE_LIST_START + count * PUZZLE_STAGGER + 0.3;

interface GameBasedPuzzleCardProps {
  puzzles: GeneratedPuzzle[];
  plan: "free" | "platinum";
  className?: string;
}

/**
 * The hero of the Game Review page: the personalized puzzles mined from the
 * review. Plays an orchestrated entrance — count animates, list slides up,
 * CTAs appear — via CSS reveals so it renders reliably.
 */
export function GameBasedPuzzleCard({
  puzzles,
  plan,
  className,
}: GameBasedPuzzleCardProps) {
  const shown = useCountUp(puzzles.length);
  const isFree = plan === "free";
  const listStart = PUZZLE_LIST_START;
  const listDone = listStart + puzzles.length * PUZZLE_STAGGER;

  return (
    <Card
      className={cn(
        "overflow-hidden border-brand/30 bg-surface-raised",
        className,
      )}
    >
      <div aria-hidden className="h-1 w-full bg-brand/70" />
      <div className="p-4">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-[8px] bg-brand/15">
            <Image src={GAME_ICON.puzzleGrey} width={22} height={22} alt="" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display text-[15px] font-bold leading-tight tracking-tight text-ink">
              Game Based Puzzles
            </h2>
            <p className="mt-0.5 text-2xs font-medium text-ink-soft">
              {isFree
                ? "Generated from this reviewed game"
                : "Generated from your recent reviewed games"}
            </p>
          </div>
          <span className="ml-auto shrink-0 rounded-full bg-brand/15 px-2 py-0.5 text-2xs font-bold uppercase tracking-wide text-brand">
            New
          </span>
        </div>

        <div
          className="mt-3.5 flex items-baseline gap-2"
          role="img"
          aria-label={`${puzzles.length} ${
            isFree
              ? "personalized puzzles available"
              : "new puzzles generated"
          }`}
        >
          <span
            aria-hidden="true"
            className="font-display text-4xl font-bold leading-none tabular-nums text-brand"
          >
            {shown}
          </span>
          <span aria-hidden="true" className="text-[13px] font-medium text-ink-muted">
            {isFree
              ? "personalized puzzles available"
              : "new puzzles generated"}
          </span>
        </div>

        <div className="mt-3.5 flex flex-col gap-0.5">
          {puzzles.map((p, i) => (
            <Reveal key={p.id} delay={listStart + i * PUZZLE_STAGGER}>
              <PuzzlePreviewItem puzzle={p} />
            </Reveal>
          ))}
        </div>

        <Reveal delay={listDone + 0.06}>
          <div className="mt-4 flex flex-col gap-2">
            <TrainingCTA label="Start Training" />
            <Button variant="secondary" size="lg" className="w-full">
              {isFree ? (
                <>
                  View Queue
                  <ArrowRight />
                </>
              ) : (
                <>
                  <RefreshCw />
                  Generate More
                </>
              )}
            </Button>
          </div>
        </Reveal>
      </div>
    </Card>
  );
}
