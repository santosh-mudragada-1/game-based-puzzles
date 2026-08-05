"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/** Chess.com-ish celebratory palette. */
const COLORS = [
  "#81b64c",
  "#e6912c",
  "#ffffff",
  "#4a90d9",
  "#26c2a3",
  "#c4453f",
  "#f0c15c",
];

interface Piece {
  id: number;
  left: number; // start x, %
  xEnd: number; // horizontal drift
  delay: number;
  duration: number;
  rotate: number;
  color: string;
  size: number;
  round: boolean;
}

function makePieces(n: number, contained: boolean): Piece[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    xEnd: (Math.random() - 0.5) * 36,
    delay: Math.random() * 0.35,
    duration: contained ? 1.5 + Math.random() * 1.1 : 2.1 + Math.random() * 1.6,
    rotate: (Math.random() - 0.5) * 720,
    color: COLORS[i % COLORS.length],
    size: contained ? 4 + Math.random() * 5 : 6 + Math.random() * 8,
    round: Math.random() > 0.5,
  }));
}

/**
 * A dependency-free confetti burst: when `run` flips true it rains a batch of
 * coloured pieces once, then clears. Purely decorative and non-interactive.
 *
 * `contained` scopes the burst to the nearest positioned ancestor instead of the
 * viewport — used for the celebration inside a completion card. The travel is
 * driven by `top` there (a percentage of the card) rather than viewport units.
 */
export function Confetti({
  run,
  count,
  contained = false,
  className,
}: {
  run: boolean;
  count?: number;
  contained?: boolean;
  className?: string;
}) {
  const [pieces, setPieces] = React.useState<Piece[]>([]);
  const n = count ?? (contained ? 70 : 160);

  React.useEffect(() => {
    if (!run) {
      setPieces([]);
      return;
    }
    // Respect reduced-motion: skip the burst rather than rain a hundred pieces.
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    setPieces(reduce ? [] : makePieces(n, contained));
  }, [run, n, contained]);

  if (!run || pieces.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none overflow-hidden",
        contained ? "absolute inset-0" : "fixed inset-0 z-[60]",
        className,
      )}
    >
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className={cn("absolute block", !contained && "top-[-6%]")}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.62,
            backgroundColor: p.color,
            borderRadius: p.round ? "9999px" : "1px",
          }}
          initial={
            contained
              ? { top: "-12%", x: 0, rotate: 0, opacity: 1 }
              : { y: "-8vh", x: 0, rotate: 0, opacity: 1 }
          }
          animate={
            contained
              ? {
                  top: "112%",
                  x: p.xEnd * 2,
                  rotate: p.rotate,
                  opacity: [1, 1, 0.9, 0],
                }
              : {
                  y: "112vh",
                  x: `${p.xEnd}vw`,
                  rotate: p.rotate,
                  opacity: [1, 1, 0.9, 0],
                }
          }
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeIn",
            times: [0, 0.62, 0.86, 1],
          }}
        />
      ))}
    </div>
  );
}
