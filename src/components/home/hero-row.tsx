import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type { PieceColor } from "@/types";
import { MiniBoard } from "@/components/board/mini-board";
import { Avatar } from "@/components/shared/avatar";
import { Button, type ButtonProps } from "@/components/shared/button";
import { ProgressBar } from "@/components/shared/progress";
import { QuickPlayCard } from "./quick-play-card";
import {
  puzzlePreview,
  lessonPreview,
  gamePreview,
  gamePuzzlesProgress,
} from "@/data/home";
import { todaysBlindSpot } from "@/data/training";
import { formatNumber } from "@/lib/utils";
import { NAV_ICON, GAME_ICON } from "@/lib/assets";

/**
 * Shared shell for the hero preview cards, matching chess.com exactly:
 * a board flush to the top edge, a compact footer, and a full-width
 * action button (centered, no trailing icon) pinned to the bottom.
 * Cards are a fixed 248px wide so the row scrolls horizontally like the design.
 */
function PreviewCard({
  fen,
  orientation,
  action,
  actionHref,
  actionVariant = "secondary",
  children,
}: {
  fen: string;
  orientation: PieceColor;
  action: string;
  actionHref?: string;
  actionVariant?: ButtonProps["variant"];
  children: ReactNode;
}) {
  return (
    <div className="flex w-[248px] shrink-0 flex-col overflow-clip rounded-[5px] bg-gradient-to-b from-white/[0.1] to-white/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_2px_rgba(0,0,0,0.14),0_2px_4px_rgba(0,0,0,0.1)] transition-colors hover:from-white/[0.13] hover:to-white/[0.07]">
      <div className="w-full">
        <MiniBoard
          fen={fen}
          orientation={orientation}
          rounded={false}
          showCoordinates={false}
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-3 min-w-0">{children}</div>
        <Button
          variant={actionVariant}
          size="md"
          className="mt-auto h-12 w-full text-[17px]"
          asChild={!!actionHref}
        >
          {actionHref ? <Link href={actionHref}>{action}</Link> : action}
        </Button>
      </div>
    </div>
  );
}

/**
 * The Chess.com home hero: the quick-play column followed by a horizontally
 * scrolling row of preview cards (Puzzles, Review Game, Game Puzzles, Lessons).
 * The row overflows the container and fades out on the right, as in the design.
 */
export function HeroRow() {
  return (
    <div className="rounded-[5px] bg-black/20 p-6">
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
          <div className="w-[248px] shrink-0">
            <QuickPlayCard />
          </div>

          {/* Puzzles — gold badge (with level) on the left; count over a bar */}
          <PreviewCard
            fen={puzzlePreview.fen}
            orientation={puzzlePreview.orientation}
            action="Solve Puzzles"
          >
            <div className="flex items-center gap-3">
              <div className="relative size-12 shrink-0">
                <Image src={GAME_ICON.puzzleGold} width={48} height={48} alt="" />
                <span className="absolute inset-0 grid place-items-center pt-[3px] text-lg font-black leading-none text-white">
                  {puzzlePreview.level}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-xl font-bold leading-none tabular-nums text-ink">
                  {formatNumber(puzzlePreview.count)}
                </div>
                <ProgressBar
                  value={puzzlePreview.progress * 100}
                  color="brand"
                  trackClassName="h-2.5"
                  className="mt-2"
                  label="Puzzle rating progress"
                />
              </div>
            </div>
          </PreviewCard>

          {/* Review Game — most recent opponent */}
          <PreviewCard
            fen={gamePreview.fen}
            orientation={gamePreview.orientation}
            action="Review Game"
            actionHref="/review"
          >
            <div className="flex items-center gap-2.5">
              <Avatar
                size={36}
                rounded="sm"
                alt={`${gamePreview.opponent} avatar`}
              />
              <span className="min-w-0 truncate text-[15px] font-semibold text-ink">
                vs {gamePreview.opponent}
              </span>
            </div>
          </PreviewCard>

          {/* Game Puzzles — this week's game-based-puzzle progress */}
          <PreviewCard
            fen={todaysBlindSpot.fen}
            orientation={todaysBlindSpot.orientation}
            action="Play Game Puzzles"
            actionHref="/puzzles/game-based"
          >
            <div className="flex items-center gap-3">
              <Image
                src={GAME_ICON.gameBasedPuzzles}
                width={40}
                height={40}
                alt=""
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] text-ink">
                  <span className="font-display font-bold tabular-nums text-ink">
                    {gamePuzzlesProgress.solved}/{gamePuzzlesProgress.total}
                  </span>{" "}
                  <span className="text-ink-muted">solved this week</span>
                </p>
                <ProgressBar
                  value={
                    (gamePuzzlesProgress.solved / gamePuzzlesProgress.total) * 100
                  }
                  color="brand"
                  trackClassName="h-2.5"
                  className="mt-2"
                  label="Game puzzles solved this week"
                />
              </div>
            </div>
          </PreviewCard>

          {/* Lessons */}
          <PreviewCard
            fen={lessonPreview.fen}
            orientation={lessonPreview.orientation}
            action="Next Lesson"
          >
            <div className="flex items-center gap-2.5">
              <Image src={NAV_ICON.learn} width={40} height={40} alt="" />
              <span className="truncate text-[15px] font-semibold text-ink">
                {lessonPreview.title}
              </span>
            </div>
          </PreviewCard>
        </div>

        {/* Right-edge fade, mirroring the design's carousel mask */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#262421] to-transparent"
        />
      </div>
    </div>
  );
}
