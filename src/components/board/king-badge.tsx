import { cn } from "@/lib/utils";

/** Gold crown for the winner, red toppled king for the loser. */
const TONE = {
  winner: "#e2a53a",
  loser: "#ca3431",
} as const;

/**
 * A crown, drawn rather than borrowed.
 *
 * The figurine font's queen was doing this job and read as a queen on the
 * board — five points, a coronet, no orb — so the winner gets a proper crown:
 * three peaks with balls and a solid band.
 */
function Crown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M4.3 9.4 7.4 12.6 12 6.1 16.6 12.6 19.7 9.4 18.6 17.2H5.4Z"
        fill="currentColor"
      />
      <rect x="5" y="18.4" width="14" height="2.9" rx="0.9" fill="currentColor" />
      <circle cx="4.3" cy="8.3" r="2.1" fill="currentColor" />
      <circle cx="12" cy="4.6" r="2.2" fill="currentColor" />
      <circle cx="19.7" cy="8.3" r="2.1" fill="currentColor" />
    </svg>
  );
}

/**
 * The badge pinned to a king's square once the game is decided: the winner is
 * crowned, the loser's own king lies where it fell (that one is the "Chess"
 * figurine glyph, rotated, so it matches the pieces beside it).
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
      {winner ? (
        <Crown className="size-[64%] text-white" />
      ) : (
        <svg viewBox="0 0 24 24" className="size-[72%] overflow-visible">
          <text
            x="12"
            y="18"
            textAnchor="middle"
            fontSize="21"
            fill="white"
            className="font-chess"
            transform="rotate(-52 12 12)"
          >
            l
          </text>
        </svg>
      )}
    </span>
  );
}
