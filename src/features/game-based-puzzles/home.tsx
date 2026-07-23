import { Reveal } from "@/components/shared/reveal";
import { HeroRow } from "@/components/home/hero-row";
import { RecentGames } from "@/components/dashboard/recent-games";
import { HomeRail } from "./home-rail";

/**
 * Screen 1 — the Chess.com home page.
 * The hero (quick-play + preview cards, one of which is Game Based Puzzles)
 * spans full width; Game History and the right rail sit below it, mirroring
 * the real chess.com/home layout.
 */
export function Home() {
  return (
    <>
      <h1 className="sr-only">Home</h1>

      <div className="flex flex-col gap-6">
        <Reveal>
          <HeroRow />
        </Reveal>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_336px]">
          {/* Game History sticks to the top; the rail scrolls past it. */}
          <div className="min-w-0 xl:sticky xl:top-6 xl:self-start">
            <Reveal>
              <RecentGames />
            </Reveal>
          </div>
          <aside className="min-w-0" aria-label="Highlights">
            <HomeRail />
          </aside>
        </div>
      </div>
    </>
  );
}
