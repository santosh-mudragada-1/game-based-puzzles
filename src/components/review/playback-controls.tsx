import {
  ChevronFirst,
  ChevronLeft,
  ChevronRight,
  ChevronLast,
  Play,
  Pause,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PlaybackControlsProps {
  playing?: boolean;
  onFirst?: () => void;
  onPrev?: () => void;
  onToggle?: () => void;
  onNext?: () => void;
  onLast?: () => void;
  /** The game is over — forward has nowhere left to go. */
  atEnd?: boolean;
  className?: string;
}

/**
 * Chess.com move-navigation bar: |◀  ◀  ▶/⏸  ▶  ▶|
 * Five equal-width buttons in the design-system's raised-gradient style
 * (Figma node 16:2090), wired to playback handlers.
 */
const CONTROL_BTN =
  "flex h-12 flex-1 items-center justify-center rounded-[10px] bg-gradient-to-b from-white/[0.1] to-white/[0.05] text-ink-soft shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_2px_rgba(0,0,0,0.14),0_2px_4px_rgba(0,0,0,0.1)] transition hover:from-white/[0.14] hover:to-white/[0.08] hover:text-ink active:translate-y-px [&_svg]:size-6 [&_svg]:drop-shadow-[0_1px_0_rgba(0,0,0,0.1)]";

export function PlaybackControls({
  playing = false,
  onFirst,
  onPrev,
  onToggle,
  onNext,
  onLast,
  atEnd = false,
  className,
}: PlaybackControlsProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        type="button"
        aria-label="First move"
        onClick={onFirst}
        className={CONTROL_BTN}
      >
        <ChevronFirst strokeWidth={2.5} />
      </button>
      <button
        type="button"
        aria-label="Previous move"
        onClick={onPrev}
        className={CONTROL_BTN}
      >
        <ChevronLeft strokeWidth={2.5} />
      </button>
      <button
        type="button"
        aria-label={playing ? "Pause" : "Play"}
        onClick={onToggle}
        disabled={atEnd}
        className={cn(CONTROL_BTN, atEnd && "pointer-events-none opacity-40")}
      >
        {playing ? (
          <Pause className="fill-current" strokeWidth={0} />
        ) : (
          <Play className="fill-current" strokeWidth={0} />
        )}
      </button>
      <button
        type="button"
        aria-label="Next move"
        onClick={onNext}
        disabled={atEnd}
        className={cn(CONTROL_BTN, atEnd && "pointer-events-none opacity-40")}
      >
        <ChevronRight strokeWidth={2.5} />
      </button>
      <button
        type="button"
        aria-label="Last move"
        onClick={onLast}
        disabled={atEnd}
        className={cn(CONTROL_BTN, atEnd && "pointer-events-none opacity-40")}
      >
        <ChevronLast strokeWidth={2.5} />
      </button>
    </div>
  );
}
