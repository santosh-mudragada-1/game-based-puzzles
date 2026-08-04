"use client";

import * as React from "react";
import { motion } from "framer-motion";

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
  xEnd: number; // horizontal drift, vw
  delay: number;
  duration: number;
  rotate: number;
  color: string;
  size: number;
  round: boolean;
}

function makePieces(n: number): Piece[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    xEnd: (Math.random() - 0.5) * 36,
    delay: Math.random() * 0.35,
    duration: 2.1 + Math.random() * 1.6,
    rotate: (Math.random() - 0.5) * 720,
    color: COLORS[i % COLORS.length],
    size: 6 + Math.random() * 8,
    round: Math.random() > 0.5,
  }));
}

/**
 * A dependency-free confetti burst: when `run` flips true it rains a batch of
 * coloured pieces down the viewport once, then clears. Purely decorative and
 * non-interactive. Rendered client-side only, so no hydration concerns.
 */
export function Confetti({ run, count = 160 }: { run: boolean; count?: number }) {
  const [pieces, setPieces] = React.useState<Piece[]>([]);

  React.useEffect(() => {
    if (!run) {
      setPieces([]);
      return;
    }
    // Respect reduced-motion: skip the burst rather than rain 160 pieces.
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    setPieces(reduce ? [] : makePieces(count));
  }, [run, count]);

  if (!run || pieces.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden"
    >
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute top-[-6%] block"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.62,
            backgroundColor: p.color,
            borderRadius: p.round ? "9999px" : "1px",
          }}
          initial={{ y: "-8vh", x: 0, rotate: 0, opacity: 1 }}
          animate={{
            y: "112vh",
            x: `${p.xEnd}vw`,
            rotate: p.rotate,
            opacity: [1, 1, 0.9, 0],
          }}
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
