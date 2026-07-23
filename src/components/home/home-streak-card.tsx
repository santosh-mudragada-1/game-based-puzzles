import Image from "next/image";
import { Check, Pause } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shared/card";
import { homeStreakDays } from "@/data/home";
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

const WEEKDAY_NAME = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function HomeStreakCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Image src={ICON.streak} width={20} height={20} alt="" />
          {homeStreakDays} Day Streak
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          {weeklyProgress.days.map((day, i) => (
            <div
              key={i}
              role="img"
              aria-label={`${WEEKDAY_NAME[i] ?? day.label}: ${DAY_STATUS_LABEL[day.status]}`}
              className="flex flex-col items-center gap-1.5"
            >
              <div
                aria-hidden="true"
                className={cn(
                  "grid size-7 place-items-center rounded-full",
                  day.status === "done" && "bg-brand text-white",
                  day.status === "today" &&
                    "border-2 border-brand bg-brand/10 text-brand",
                  day.status === "miss" && "bg-white/[0.05] text-ink-faint",
                  day.status === "rest" && "border border-line/70",
                )}
              >
                {day.status === "done" && (
                  <Check className="size-4" strokeWidth={3} />
                )}
                {day.status === "today" && (
                  <span className="size-1.5 rounded-full bg-brand" />
                )}
                {day.status === "miss" && <Pause className="size-3" />}
              </div>
              <span
                aria-hidden="true"
                className={cn(
                  "text-2xs font-bold",
                  day.status === "today" ? "text-brand" : "text-ink-faint",
                )}
              >
                {day.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
