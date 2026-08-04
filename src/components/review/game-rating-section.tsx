import { Check, ThumbsUp } from "lucide-react";

import { cn } from "@/lib/utils";

type PhaseRating = "great" | "good" | "ok";

interface PhaseRow {
  phase: string;
  white: PhaseRating;
  black: PhaseRating;
}

interface GameRatingSectionProps {
  gameRating: { white: number; black: number };
  phases: PhaseRow[];
  className?: string;
}

/** Green thumbs-up / check icon for a single phase rating. */
function PhaseIcon({ rating }: { rating: PhaseRating }) {
  if (rating === "ok") {
    return <Check className="size-4 text-brand" aria-hidden="true" />;
  }
  return (
    <ThumbsUp
      className={cn("size-4 text-brand", rating === "great" && "fill-brand/20")}
      aria-hidden="true"
    />
  );
}

/**
 * Post-review "Game Rating" header plus per-phase ratings
 * (Opening / Middlegame / Endgame) for both players.
 */
export function GameRatingSection({
  gameRating,
  phases,
  className,
}: GameRatingSectionProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="grid grid-cols-[auto_1fr_auto] items-center">
        <span className="rounded-md bg-white px-2 py-0.5 text-sm font-bold tabular-nums text-[#2b2926]">
          {gameRating.white}
        </span>
        <span className="text-center text-[13px] font-semibold text-ink-muted">
          Game Rating
        </span>
        <span className="rounded-md bg-white px-2 py-0.5 text-sm font-bold tabular-nums text-[#2b2926]">
          {gameRating.black}
        </span>
      </div>

      {phases.map((row) => (
        <div
          key={row.phase}
          className="grid grid-cols-[2rem_1fr_2rem] items-center py-1"
        >
          <span className="flex justify-end">
            <PhaseIcon rating={row.white} />
          </span>
          <span className="text-center text-[13px] font-medium text-ink-muted">
            {row.phase}
          </span>
          <span className="flex justify-start">
            <PhaseIcon rating={row.black} />
          </span>
        </div>
      ))}
    </div>
  );
}
