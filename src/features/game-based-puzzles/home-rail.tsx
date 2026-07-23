import { Reveal } from "@/components/shared/reveal";
import { DailyPuzzleCard } from "@/components/home/daily-puzzle-card";
import { HomeStreakCard } from "@/components/home/home-streak-card";
import { CrystalLeagueCard } from "@/components/home/crystal-league-card";
import { YourThemeCard } from "@/components/home/your-theme-card";
import { FriendsCard } from "@/components/home/friends-card";
import { StatsCard } from "@/components/home/stats-card";

/** Chess.com home right rail — same widgets and order as the reference. */
export function HomeRail() {
  return (
    <div className="flex flex-col gap-4">
      <Reveal delay={0.05}>
        <DailyPuzzleCard />
      </Reveal>
      <Reveal delay={0.08}>
        <HomeStreakCard />
      </Reveal>
      <Reveal delay={0.11}>
        <CrystalLeagueCard />
      </Reveal>
      <Reveal delay={0.14}>
        <YourThemeCard />
      </Reveal>
      <Reveal delay={0.17}>
        <FriendsCard />
      </Reveal>
      <Reveal delay={0.2}>
        <StatsCard />
      </Reveal>
    </div>
  );
}
