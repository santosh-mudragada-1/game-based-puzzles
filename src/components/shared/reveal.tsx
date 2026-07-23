import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Subtle CSS fade-up entrance on mount (staggered via `delay`).
 * Pure CSS so it renders reliably without JS and respects reduced motion.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  /** Retained for API compatibility; the keyframe handles the offset. */
  y?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("animate-fade-up motion-reduce:animate-none", className)}
      style={delay ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  );
}
