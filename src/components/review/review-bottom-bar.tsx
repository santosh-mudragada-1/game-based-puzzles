import { Star, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

function BarButton({
  onClick,
  ariaLabel,
  ariaPressed,
  className,
  children,
}: {
  onClick?: () => void;
  ariaLabel?: string;
  ariaPressed?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={cn(
        "flex flex-1 items-center justify-center gap-1.5 rounded-[6px] px-2 py-1.5 text-[13px] font-semibold text-ink-muted transition-colors hover:bg-white/[0.05] hover:text-ink [&_svg]:size-4",
        className,
      )}
    >
      {children}
    </button>
  );
}

/**
 * The persistent action row beneath the Game Review panel: Skills · Share.
 *
 * "Add to puzzles" used to sit between them, from when puzzles were something
 * you opted a game into. They are mined automatically from every reviewed game
 * now, so the button had nothing left to do — the Solve column in the archive
 * is where you pick them up.
 */
export function ReviewBottomBar({
  onShare,
  className,
}: {
  onShare?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-center gap-1", className)}>
      <BarButton ariaLabel="Skills">
        <Star className="fill-current" />
        Skills
      </BarButton>

      <BarButton onClick={onShare} ariaLabel="Share game">
        <Share2 />
        Share
      </BarButton>
    </div>
  );
}
