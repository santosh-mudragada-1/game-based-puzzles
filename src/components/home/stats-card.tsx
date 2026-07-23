import Image from "next/image";
import { ChevronDown } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shared/card";
import { formatNumber } from "@/lib/utils";
import { homeStats } from "@/data/home";
import type { StatKind } from "@/types";
import { GAME_ICON, NAV_ICON } from "@/lib/assets";

/** Official Chess.com glyph per stat kind. */
const STAT_ICON: Record<StatKind, string> = {
  games: GAME_ICON.games,
  puzzles: GAME_ICON.puzzleGrey,
  lessons: NAV_ICON.learn,
  rapid: GAME_ICON.rapid,
  blitz: GAME_ICON.blitz,
  bullet: GAME_ICON.bullet,
  tactics: GAME_ICON.puzzleGold,
};

export function StatsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <dl>
          {homeStats.map((row, i) => (
            <div
              key={`${row.kind}-${i}`}
              className="flex items-center justify-between border-t border-line/40 py-2.5 first:border-t-0"
            >
              <dt className="flex items-center gap-2.5">
                <Image src={STAT_ICON[row.kind]} width={22} height={22} alt="" />
                <span className="text-[13px] font-medium text-ink-muted">
                  {row.label}
                </span>
              </dt>
              <dd className="flex items-center gap-1">
                <span className="font-display text-sm font-bold tabular-nums text-ink">
                  {formatNumber(row.value)}
                </span>
                {row.rating ? (
                  <ChevronDown
                    className="size-4 text-ink-faint"
                    aria-hidden="true"
                  />
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
