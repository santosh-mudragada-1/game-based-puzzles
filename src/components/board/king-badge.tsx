import { cn } from "@/lib/utils";

/** Chess.com's result discs: green crown for the winner, red king for the loser. */
const TONE = {
  winner: "#81b64c",
  loser: "#ca3431",
} as const;

/**
 * The badge pinned to a king's square once the game is decided.
 *
 * Both glyphs are set from the "Chess" figurine font (see globals.css) inside an
 * SVG, so they scale with the square instead of needing a pixel size — the
 * winner gets the crown, the loser their own king knocked over.
 */
export function KingBadge({
  kind,
  className,
}: {
  kind: "winner" | "loser";
  className?: string;
}) {
  const winner = kind === "winner";
  return (
    <span
      aria-label={winner ? "Winner" : "Checkmated"}
      role="img"
      className={cn(
        "pointer-events-none absolute -right-[4%] -top-[4%] z-[5] grid size-[38%] animate-badge-pop place-items-center rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.45)]",
        className,
      )}
      style={{ backgroundColor: TONE[kind] }}
    >
      <svg viewBox="0 0 24 24" className="size-[72%] overflow-visible">
        <text
          x="12"
          y={winner ? 19 : 18}
          textAnchor="middle"
          fontSize="21"
          fill="white"
          className="font-chess"
          // The loser's king lies where it fell.
          transform={winner ? undefined : "rotate(-52 12 12)"}
        >
          {winner ? "w" : "l"}
        </text>
      </svg>
    </span>
  );
}
