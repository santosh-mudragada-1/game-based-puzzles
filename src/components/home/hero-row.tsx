import type { ReactNode } from "react";
import Image from "next/image";
import type { PieceColor } from "@/types";
import { MiniBoard } from "@/components/board/mini-board";
import { Card } from "@/components/shared/card";
import { Button, type ButtonProps } from "@/components/shared/button";
import { ProgressBar } from "@/components/shared/progress";
import { QuickPlayCard } from "./quick-play-card";
import { puzzlePreview, lessonPreview } from "@/data/home";
import { todaysBlindSpot } from "@/data/training";
import { formatNumber } from "@/lib/utils";
import { NAV_ICON, GAME_ICON } from "@/lib/assets";

/**
 * Shared shell for the hero preview cards, matching chess.com exactly:
 * a board flush to the top edge, a compact footer, and a full-width
 * action button (centered, no trailing icon) pinned to the bottom.
 */
function PreviewCard({
  fen,
  orientation,
  action,
  actionVariant = "secondary",
  children,
}: {
  fen: string;
  orientation: PieceColor;
  action: string;
  actionVariant?: ButtonProps["variant"];
  children: ReactNode;
}) {
  return (
    <Card className="flex flex-col overflow-hidden border-transparent bg-surface-raised transition-colors hover:bg-surface-hover">
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
          className="mt-auto h-12 w-full text-[15px]"
        >
          {action}
        </Button>
      </div>
    </Card>
  );
}

/** The Chess.com home hero: quick-play + three preview cards, four across. */
export function HeroRow() {
  return (
    <div className="rounded-xl border border-line/70 bg-surface p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickPlayCard />

      {/* Puzzles — gold badge (with level) on the left; count over a thick bar */}
      <PreviewCard
        fen={puzzlePreview.fen}
        orientation={puzzlePreview.orientation}
        action="Solve Puzzles"
      >
        <div className="flex items-center gap-3">
          <div className="relative size-12 shrink-0">
            <Image
              src={GAME_ICON.puzzleGold}
              width={48}
              height={48}
              alt=""
            />
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

      {/* Game Based Puzzles — replaces the "Review Game" card, same structure */}
      <PreviewCard
        fen={todaysBlindSpot.fen}
        orientation={todaysBlindSpot.orientation}
        action="Start Solving"
        actionVariant="secondary"
      >
        <div className="flex items-center gap-2.5">
          <Image src={GAME_ICON.puzzleGrey} width={36} height={36} alt="" />
          <span className="truncate text-[15px] font-semibold text-ink">
            Game Puzzles
          </span>
        </div>
      </PreviewCard>
      </div>
    </div>
  );
}
