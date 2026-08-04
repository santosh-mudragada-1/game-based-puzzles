import Image from "next/image";
import { Star, Share2, Check } from "lucide-react";
import { GAME_ICON } from "@/lib/assets";
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
 * The persistent action row beneath the Game Review panel: Skills · Add to
 * puzzles · Share. "Add to puzzles" is the Game Based Puzzles hook — it blends
 * in with the native actions until pressed, then flips to a confirmed "Added"
 * state (the parent also raises a toast and queues the puzzles).
 */
export function ReviewBottomBar({
  added,
  onAdd,
  puzzleCount,
  onShare,
  className,
}: {
  added: boolean;
  onAdd: () => void;
  puzzleCount: number;
  onShare?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-center gap-1", className)}>
      <BarButton ariaLabel="Skills">
        <Star className="fill-current" />
        Skills
      </BarButton>

      <BarButton
        onClick={added ? undefined : onAdd}
        ariaPressed={added}
        ariaLabel={
          added
            ? `Added ${puzzleCount} puzzles to your queue`
            : `Add ${puzzleCount} puzzles from this game to your queue`
        }
        className={added ? "cursor-default text-brand hover:text-brand" : undefined}
      >
        {added ? (
          <>
            <Check strokeWidth={3} className="text-brand" />
            Added
          </>
        ) : (
          <>
            <Image src={GAME_ICON.puzzleGrey} width={16} height={16} alt="" />
            Add to puzzles
          </>
        )}
      </BarButton>

      <BarButton onClick={onShare} ariaLabel="Share game">
        <Share2 />
        Share
      </BarButton>
    </div>
  );
}
