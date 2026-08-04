import Image from "next/image";
import { Check, Pause, ChevronRight } from "lucide-react";
import { homeStreakDays, crystalLeague } from "@/data/home";
import { weeklyProgress } from "@/data/training";
import type { DayStatus } from "@/types";
import { ICON } from "@/lib/assets";
import { cn } from "@/lib/utils";

const DAY_STATUS_LABEL: Record<DayStatus, string> = {
  done: "solved",
  today: "today",
  miss: "missed",
  rest: "rest day",
};

const WEEKDAY_NAME = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Ordinal suffix for a place: 1st, 2nd, 3rd, 11th, 21st ... */
function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

/**
 * Combined Streak + Crystal League card (one panel split by a divider), matching
 * the home design where the weekly streak sits above the league standing.
 */
export function StreakLeagueCard() {
  return (
    <div className="overflow-hidden rounded-card border border-line/70 bg-surface shadow-card">
      {/* Streak — day markers with the weekday letter above each */}
      <div className="flex items-start gap-3 p-3">
        <Image
          src={ICON.streak}
          width={38}
          height={38}
          alt=""
          className="shrink-0"
        />
        <div className="min-w-0">
          <p className="font-display text-[15px] font-bold text-ink">
            {homeStreakDays} Day Streak
          </p>
          <div className="mt-2 flex items-center gap-1">
            {weeklyProgress.days.map((day, i) => (
              <div
                key={i}
                role="img"
                aria-label={`${WEEKDAY_NAME[i] ?? day.label}: ${DAY_STATUS_LABEL[day.status]}`}
                className="flex flex-col items-center gap-1"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "text-[10px] font-semibold uppercase leading-none",
                    day.status === "today" ? "text-brand" : "text-ink-faint",
                  )}
                >
                  {day.label}
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-6 place-items-center rounded-[4px]",
                    day.status === "done" && "bg-brand text-white",
                    day.status === "today" &&
                      "border-2 border-brand bg-brand/10 text-brand",
                    day.status === "miss" && "bg-white/[0.05] text-ink-faint",
                    day.status === "rest" && "border border-line/70",
                  )}
                >
                  {day.status === "done" && (
                    <Check className="size-3.5" strokeWidth={3} />
                  )}
                  {day.status === "today" && (
                    <span className="size-1.5 rounded-full bg-brand" />
                  )}
                  {day.status === "miss" && <Pause className="size-3" />}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-3 h-px bg-line/60" />

      {/* Crystal League */}
      <button
        type="button"
        className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-surface-hover"
      >
        <Image
          src={ICON.crystalLeague}
          width={40}
          height={25}
          alt=""
          className="shrink-0"
        />
        <span className="flex min-w-0 flex-col">
          <span className="font-display text-sm font-bold text-ink">
            {crystalLeague.name}
          </span>
          <span className="text-xs text-ink-soft">
            You are in {ordinal(crystalLeague.place)} place
          </span>
        </span>
        <ChevronRight className="ml-auto size-4 shrink-0 text-ink-faint" />
      </button>
    </div>
  );
}
