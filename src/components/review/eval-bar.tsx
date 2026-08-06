import { cn } from "@/lib/utils";

interface EvalBarProps {
  evalPawns: number;
  /** Forced-mate distance, white-positive; 0 once mate is on the board. */
  mate?: number | null;
  /** Set once the game is actually over, e.g. "0-1". Wins over `mate`. */
  result?: string | null;
  orientation?: "white" | "black";
  className?: string;
}

/**
 * Vertical evaluation bar shown to the left of the board (Chess.com style).
 * Fills its parent height. White's share sits at the bottom, Black's at the top
 * when the board is oriented for White; the stacking flips for Black.
 */
export function EvalBar({
  evalPawns,
  mate = null,
  result = null,
  orientation = "white",
  className,
}: EvalBarProps) {
  const whitePct = Math.min(96, Math.max(4, 50 + (evalPawns / 8) * 50));
  const blackPct = 100 - whitePct;

  const label = evalBarLabel(evalPawns, mate, result);
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

/**
 * What the bar says: the game's result once it is over, "M3" while a forced
 * mate is on the board (unsigned — the fill already says whose it is), and a
 * signed pawn count otherwise.
 */
export function evalBarLabel(
  evalPawns: number,
  mate: number | null,
  result: string | null,
): string {
  if (result) return result;
  if (mate != null && mate !== 0) return `M${Math.abs(mate)}`;
  const magnitude = Math.abs(evalPawns);
  if (magnitude < 0.05) return "0.0";
  const digits = magnitude >= 10 ? 0 : 1;
  return evalPawns > 0
    ? `+${evalPawns.toFixed(digits)}`
    : `−${magnitude.toFixed(digits)}`;
}
