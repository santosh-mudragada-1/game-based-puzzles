import Image from "next/image";
import { ProgressBar } from "@/components/shared/progress";
import { PreviewCard } from "./preview-card";
import { QuickPlayCard } from "./quick-play-card";
import { ReviewGameCard } from "./review-game-card";
import { GamePuzzlesProgress } from "./game-puzzles-progress";
import { puzzlePreview, lessonPreview } from "@/data/home";
import { todaysBlindSpot } from "@/data/training";
import { formatNumber } from "@/lib/utils";
import { NAV_ICON, GAME_ICON } from "@/lib/assets";

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

          {/* Review Game — the most recent game that hasn't been reviewed yet */}
          <ReviewGameCard />

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
              <GamePuzzlesProgress />
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
