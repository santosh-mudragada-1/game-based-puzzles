import { cn } from "@/lib/utils";

interface EvalBarProps {
  evalPawns: number;
  orientation?: "white" | "black";
  className?: string;
}

/**
 * Vertical evaluation bar shown to the left of the board (Chess.com style).
 * Fills its parent height. White's share sits at the bottom, Black's at the top
 * when the board is oriented for White; the stacking flips for Black.
 */
export function EvalBar({ evalPawns, orientation = "white", className }: EvalBarProps) {
  const whitePct = Math.min(96, Math.max(4, 50 + (evalPawns / 8) * 50));
  const blackPct = 100 - whitePct;

  const magnitude = Math.abs(evalPawns);
  const digits = magnitude >= 10 ? 0 : 1;
  const label =
    magnitude < 0.05
      ? "0.0"
      : evalPawns > 0
        ? `+${evalPawns.toFixed(digits)}`
        : `−${magnitude.toFixed(digits)}`;
  // Blocks stack top -> bottom. For a White-oriented board White is on the
  // bottom; for a Black-oriented board the order flips.
  const whiteBlock = (
    <div className="w-full bg-board-light" style={{ height: `${whitePct}%` }} />
  );
  const blackBlock = (
    <div className="w-full bg-[#3b3936]" style={{ height: `${blackPct}%` }} />
  );

  return (
    <div
      role="img"
      aria-label={`Evaluation ${label}`}
      className={cn(
        "relative flex h-full w-6 flex-col overflow-hidden rounded-[3px] ring-1 ring-black/25",
        className,
      )}
    >
      {orientation === "white" ? (
        <>
          {blackBlock}
          {whiteBlock}
        </>
      ) : (
        <>
          {whiteBlock}
          {blackBlock}
        </>
      )}
      {/* The eval figure sits pinned at the bottom of the bar (Chess.com style),
          coloured to contrast with whichever side occupies the bottom block. */}
      <span
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-[3px] text-center text-[10px] font-bold leading-none tabular-nums",
          orientation === "white" ? "text-[#312e2b]" : "text-board-light",
        )}
      >
        {label}
      </span>
    </div>
  );
}
