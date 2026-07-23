"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn, clamp } from "@/lib/utils";

const BAR_COLOR = {
  brand: "bg-brand",
  gold: "bg-gold",
  info: "bg-info",
  win: "bg-win",
} as const;

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: keyof typeof BAR_COLOR;
  className?: string;
  trackClassName?: string;
  /** Accessible label; falls back to a percentage. */
  label?: string;
  rounded?: boolean;
}

/** Animated linear progress bar. */
export function ProgressBar({
  value,
  max = 100,
  color = "brand",
  className,
  trackClassName,
  label,
  rounded = true,
}: ProgressBarProps) {
  const pct = clamp((value / max) * 100, 0, 100);
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label ?? `${Math.round(pct)}% complete`}
      className={cn(
        "h-2 w-full overflow-hidden bg-black/30",
        rounded && "rounded-full",
        trackClassName,
        className,
      )}
    >
      <motion.div
        className={cn("h-full", rounded && "rounded-full", BAR_COLOR[color])}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
  className?: string;
}

/** Animated circular progress indicator with a center slot. */
export function ProgressRing({
  value,
  max = 100,
  size = 56,
  stroke = 6,
  color = "#81b64c",
  trackColor = "rgba(255,255,255,0.09)",
  children,
  className,
}: ProgressRingProps) {
  const pct = clamp((value / max) * 100, 0, 100);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      {children != null && (
        <span className="absolute inset-0 grid place-items-center">
          {children}
        </span>
      )}
    </div>
  );
}
