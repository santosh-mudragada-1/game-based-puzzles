import type { MoveClassification } from "@/types";
import { cn } from "@/lib/utils";

interface EvalPoint {
  evalCp: number;
  classification: MoveClassification;
}

interface EvalGraphProps {
  points: EvalPoint[];
  currentIndex?: number;
  className?: string;
}

/** Move classifications that earn a coloured dot on the graph. */
const DOT_COLOR: Partial<Record<MoveClassification, string>> = {
  blunder: "#ca3431",
  missed: "#e0a03c",
  mistake: "#e58f2a",
  inaccuracy: "#f0c15c",
  brilliant: "#26c2a3",
  great: "#5c8bb0",
};

/** Map an evaluation (centipawns) to the graph y coordinate. +8 pawns → 0 (top). */
function evalToY(evalCp: number): number {
  const t = Math.max(-1, Math.min(1, evalCp / 800));
  return 20 - t * 20;
}

/**
 * Chess.com-style evaluation graph: a white area (White's advantage) growing up
 * from the bottom edge, a dashed zero baseline, coloured dots at notable moves
 * and a green marker at the current ply. Purely presentational.
 */
export function EvalGraph({ points, currentIndex, className }: EvalGraphProps) {
  const n = points.length;

  const coords = points.map((p, i) => ({
    x: n > 1 ? (i / (n - 1)) * 100 : 0,
    y: evalToY(p.evalCp),
    classification: p.classification,
  }));

  const line = coords.map((c) => `${c.x},${c.y}`).join(" ");

  // Closed area between the eval line and the bottom edge (y = 40).
  const area =
    coords.length > 0
      ? `M 0,40 ${coords.map((c) => `L ${c.x},${c.y}`).join(" ")} L 100,40 Z`
      : "";

  const markerX =
    currentIndex != null && n > 1
      ? (currentIndex / (n - 1)) * 100
      : currentIndex != null
        ? 0
        : null;

  const last = points[n - 1]?.evalCp ?? 0;
  const trend =
    last < -150
      ? "swinging decisively to Black"
      : last > 150
        ? "swinging decisively to White"
        : "staying roughly level";
  const label = `Evaluation across ${n} half-moves, ${trend}.`;

  return (
    <div
      role="img"
      aria-label={label}
      className={cn(
        "relative h-20 w-full overflow-hidden rounded-[8px] bg-surface-sunken ring-1 ring-black/25",
        className,
      )}
    >
      <svg
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="evalWhiteFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f4f1ea" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#f4f1ea" stopOpacity="0.98" />
          </linearGradient>
        </defs>

        {area && <path d={area} fill="url(#evalWhiteFill)" />}

        {coords.length > 1 && (
          <polyline
            points={line}
            fill="none"
            stroke="#ffffff"
            strokeWidth={1.3}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* Dashed zero baseline (equal position). */}
        <line
          x1={0}
          y1={20}
          x2={100}
          y2={20}
          stroke="rgba(255,255,255,0.22)"
          strokeWidth={0.5}
          strokeDasharray="2 2"
        />

        {markerX != null && (
          <line
            x1={markerX}
            y1={0}
            x2={markerX}
            y2={40}
            stroke="#81b64c"
            strokeWidth={0.8}
          />
        )}
      </svg>

      {/* Current-ply marker knob. */}
      {markerX != null && (
        <span
          aria-hidden="true"
          className="absolute top-[3px] size-2 -translate-x-1/2 rounded-full bg-brand ring-2 ring-surface-sunken"
          style={{ left: `${markerX}%` }}
        />
      )}

      {/* Dots overlaid as HTML so they stay circular despite the stretched SVG. */}
      {coords.map((c, i) => {
        const color = DOT_COLOR[c.classification];
        if (!color) return null;
        return (
          <span
            key={i}
            aria-hidden="true"
            className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-white/70"
            style={{
              left: `${c.x}%`,
              top: `${(c.y / 40) * 100}%`,
              backgroundColor: color,
            }}
          />
        );
      })}
    </div>
  );
}
