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
  /**
   * A forced mate — or a finished game — isn't an advantage to be measured, so
   * the bar hands the whole thing to the winner instead of stopping at the 4%
   * sliver an ordinary evaluation is clamped to.
   */
  const decidedForWhite = result
    ? result.startsWith("1")
    : mate != null
      ? mate === 0
        ? evalPawns > 0
        : mate > 0
      : null;

  const whitePct =
    decidedForWhite == null
      ? Math.min(96, Math.max(4, 50 + (evalPawns / 8) * 50))
      : decidedForWhite
        ? 100
        : 0;
  const blackPct = 100 - whitePct;

  const label = evalBarLabel(evalPawns, mate, result);
  /*
    Which end the figure belongs at.

    Unsigned, so its position is what says whose advantage it is: it sits with
    whoever is ahead. On a white-oriented board White is the bottom block, so a
    positive evaluation writes at the bottom and a negative one at the top.
  */
  const whiteAhead = evalPawns >= 0;
  const atBottom =
    orientation === "white" ? whiteAhead : !whiteAhead;
  // The figure has to contrast with whatever block it lands on.
  const onLight = orientation === "white" ? whiteAhead : whiteAhead;
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
          "pointer-events-none absolute inset-x-0 text-center text-[10px] font-bold leading-none tabular-nums",
          atBottom ? "bottom-[3px]" : "top-[3px]",
          onLight ? "text-[#312e2b]" : "text-board-light",
        )}
      >
        {label}
      </span>
    </div>
  );
}

/**
 * What the bar says: the game's result once it is over, "M3" while a forced
 * mate is on the board, and a pawn count otherwise.
 *
 * Never signed. The bar has two ends and the figure is written at the end that
 * is winning, so a "+" or "−" in front of it is the same fact told twice.
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
  return magnitude.toFixed(magnitude >= 10 ? 0 : 1);
}
