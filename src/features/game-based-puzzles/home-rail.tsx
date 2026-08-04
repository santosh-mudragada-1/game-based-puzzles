import { Reveal } from "@/components/shared/reveal";
import { DailyPuzzleCard } from "@/components/home/daily-puzzle-card";
import { StreakLeagueCard } from "@/components/home/streak-league-card";
import { FriendsCard } from "@/components/home/friends-card";
import { YourThemeCard } from "@/components/home/your-theme-card";
import { StatsCard } from "@/components/home/stats-card";

/** Chess.com home right rail — same widgets and order as the reference design. */
export function HomeRail() {
  return (
    <div className="flex flex-col gap-4">
      <Reveal delay={0.05}>
        <DailyPuzzleCard />
      </Reveal>
      <Reveal delay={0.08}>
        <StreakLeagueCard />
      </Reveal>
      <Reveal delay={0.11}>
        <FriendsCard />
      </Reveal>
      <Reveal delay={0.14}>
        <YourThemeCard />
      </Reveal>
      <Reveal delay={0.17}>
        <StatsCard />
      </Reveal>
    </div>
  );
}
