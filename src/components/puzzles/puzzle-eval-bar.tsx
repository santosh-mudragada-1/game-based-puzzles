"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const LIGHT = "#f1f0e8"; // the solver's share (fills from the bottom)
const DARK = "#403d39"; // the opponent's share (top)
/** The territory the played move gave away — light red over the vacated area. */
const LOSS = "#e3a0a0";
const LOSS_HOT = "#d24b4b";
/** The territory a correct move wins back. */
const GAIN = "#a9d183";
const GAIN_HOT = "#81b64c";

const INK_DARK = "#22201d";
const INK_LIGHT = "#ece9e1";

/** The solver's (user-positive) share of the bar, 0–100. 50 = dead equal. */
function pct(cp: number) {
  if (cp >= 3000) return 100;
  if (cp <= -3000) return 0;
  return Math.min(100, Math.max(0, 50 + (cp / 100 / 8) * 50));
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/**
 * A band covering the slice of the bar between two levels, with a highlight
 * travelling through it. `direction` is the way the highlight sweeps:
 * "down" for a loss (the advantage draining away from the top toward centre),
 * "up" for a gain (winning it back).
 */
function SweepBand({
  lo,
  hi,
  tone,
  hot,
  direction,
  loop,
  reduced,
}: {
  lo: number;
  hi: number;
  tone: string;
  hot: string;
  direction: "up" | "down";
  loop: boolean;
  reduced: boolean;
}) {
  const height = hi - lo;
  if (height <= 0.4) return null;

  // The highlight is 60% of the band tall, so it travels from just clear of one
  // edge to just clear of the other.
  const travel =
    direction === "down" ? ["-100%", "200%"] : ["200%", "-100%"];

  return (
    <div
      className="absolute inset-x-0 overflow-hidden"
      style={{ bottom: `${lo}%`, height: `${height}%` }}
    >
      <div className="absolute inset-0" style={{ backgroundColor: tone }} />
      {!reduced && (
        <motion.div
          className="absolute inset-x-0 top-0"
          style={{
            height: "60%",
            background: `linear-gradient(to bottom, transparent, ${hot}, transparent)`,
          }}
          initial={{ y: travel[0] }}
          animate={{ y: travel }}
          transition={{
            duration: 1.5,
            ease: "easeInOut",
            repeat: loop ? Infinity : 0,
            repeatDelay: loop ? 0.2 : 0,
          }}
        />
      )}
    </div>
  );
}

interface PuzzleEvalBarProps {
  /** Current evaluation, user-positive centipawns. */
  cp: number;
  /** Label for the current evaluation, e.g. "0.0" / "+2.5" / "M1". */
  label: string;
  /** The evaluation that *was* available before the played move. */
  peakCp?: number;
  /** Label for that best-case evaluation — shown pinned at the bottom. */
  peakLabel?: string;
  /** Keep the loss band sweeping (i.e. the puzzle is still unsolved). */
  loop?: boolean;
  /**
   * Identity of the position being shown. The green "won it back" sweep fires
   * only when this changes — otherwise Stockfish refining its score as the
   * search deepens (+1.09 → +1.1) would celebrate a move nobody played.
   */
  step?: string | number;
  /**
   * Whether this position was reached by the *solver's* own move. Only then can
   * evaluation climbing back be an achievement — the opponent's replies auto-play
   * as the engine's best, so a "gain" there is just search wobble.
   */
  isUserMove?: boolean;
  className?: string;
}

/** Centipawn swing worth celebrating — below this it's engine noise. */
const GAIN_THRESHOLD = 40;

/**
 * The Game Based Puzzles evaluation bar.
 *
 * The bar reads as "what you gave up": it is anchored at the evaluation that was
 * available (`peakCp`, labelled at the bottom) and filled to where the move
 * actually played left things (`cp`, labelled at the fill boundary). The gap
 * between the two is painted red with a highlight sweeping *downward* — from the
 * winning end toward the centre — and it keeps looping while the puzzle is
 * unsolved. When the solver finds the right move the evaluation climbs back and
 * the same band replays in green, sweeping *upward*.
 *
 * A hairline at the vertical centre marks 0.0 (dead equal), so the fill boundary
 * landing on it is literally "you threw away the win".
 */
export function PuzzleEvalBar({
  cp,
  label,
  peakCp,
  peakLabel,
  loop = false,
  step,
  isUserMove = false,
  className,
}: PuzzleEvalBarProps) {
  const reduced = usePrefersReducedMotion();
  const fill = pct(cp);
  const peak = pct(peakCp ?? cp);

  // A move that wins evaluation back replays the band in green, once.
  const stepRef = React.useRef(step);
  const lastCpRef = React.useRef(cp);
  const baselineRef = React.useRef(cp);
  const firedRef = React.useRef(false);
  const [gain, setGain] = React.useState<{ lo: number; hi: number } | null>(
    null,
  );

  React.useEffect(() => {
    if (stepRef.current !== step) {
      // Where the bar sat just before this move is what we measure against.
      baselineRef.current = lastCpRef.current;
      stepRef.current = step;
      firedRef.current = false;
    }
    lastCpRef.current = cp;

    if (
      firedRef.current ||
      !isUserMove ||
      cp - baselineRef.current < GAIN_THRESHOLD
    )
      return;
    firedRef.current = true;
    setGain({ lo: pct(baselineRef.current), hi: pct(cp) });
  }, [cp, step, isUserMove]);

  // Expiry owns its own effect: tying the timer to the one above would let each
  // deepening engine score cancel it through cleanup, and the band would stick.
  React.useEffect(() => {
    if (!gain) return;
    const t = setTimeout(() => setGain(null), 1800);
    return () => clearTimeout(t);
  }, [gain]);

  // Keep the boundary label clear of the bar's ends and of the bottom label.
  const labelAt = Math.min(93, Math.max(11, fill));
  // The label rides just above the fill boundary, so it lands on the red or green
  // band whenever there is one (both light — needs dark ink) and on the bare dark
  // background otherwise. Clamped to the top, it sits on the light fill instead.
  const onLight = fill > 93 || peak > fill + 0.4 || gain != null;

  return (
    <div
      role="img"
      aria-label={
        peakLabel && peakLabel !== label
          ? `Evaluation ${label}, ${peakLabel} was available`
          : `Evaluation ${label}`
      }
      className={cn(
        "relative h-full w-6 overflow-hidden rounded-[3px] ring-1 ring-black/30",
        className,
      )}
      style={{ backgroundColor: DARK }}
    >
      {/* The solver's share, filling from the bottom. */}
      <motion.div
        className="absolute inset-x-0 bottom-0"
        style={{ backgroundColor: LIGHT }}
        initial={{ height: `${peak}%` }}
        animate={{ height: `${fill}%` }}
        transition={{ type: "spring", stiffness: 280, damping: 26, mass: 0.7 }}
      />

      {/* What the played move gave away — sweeps down, loops while unsolved. */}
      <SweepBand
        lo={fill}
        hi={peak}
        tone={LOSS}
        hot={LOSS_HOT}
        direction="down"
        loop={loop}
        reduced={reduced}
      />

      {/* What a correct move won back — sweeps up, plays once. */}
      {gain && (
        <SweepBand
          lo={gain.lo}
          hi={gain.hi}
          tone={GAIN}
          hot={GAIN_HOT}
          direction="up"
          loop={false}
          reduced={reduced}
        />
      )}

      {/* 0.0 — dead equal. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-black/25"
      />

      {/* Current evaluation, riding the fill boundary. */}
      <span
        className="pointer-events-none absolute inset-x-0 text-center text-[10px] font-bold leading-none tabular-nums transition-[bottom] duration-500"
        style={{
          bottom: `calc(${labelAt}% + 2px)`,
          color: onLight ? INK_DARK : INK_LIGHT,
        }}
      >
        {label}
      </span>

      {/* What was on the table, pinned at the bottom. */}
      {peakLabel && (
        <span
          className="pointer-events-none absolute inset-x-0 bottom-[3px] text-center text-[10px] font-bold leading-none tabular-nums"
          style={{ color: fill >= 6 ? INK_DARK : INK_LIGHT }}
        >
          {peakLabel}
        </span>
      )}
    </div>
  );
}
