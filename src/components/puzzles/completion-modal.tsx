"use client";

import * as React from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { RotateCcw, Target, X } from "lucide-react";

import { Confetti } from "@/components/shared/confetti";
import { GAME_ICON } from "@/lib/assets";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ stars */

/**
 * The four sparkles from the design (node 157:473 "Sparking animation"),
 * positioned as a fraction of the 382 x 275 artwork block so they keep their
 * arrangement around the puzzle piece at any card width. `spin` is the base
 * rotation Figma gives each one; the animation rotates on top of it.
 */
const SPARKS = [
  { leftPct: 26.6, topPct: 61.3, size: 34, spin: 0, delay: 0 },
  { leftPct: 44.9, topPct: 40.0, size: 35, spin: -19, delay: 1.1 },
  { leftPct: 66.4, topPct: 50.0, size: 37, spin: 27, delay: 0.55 },
  { leftPct: 55.6, topPct: 10.4, size: 37, spin: 27, delay: 1.7 },
] as const;

/**
 * The sparkles twinkle rather than sit still: each fades in, drifts upward while
 * turning, then fades out and restarts. Offset delays keep the four from pulsing
 * together, and the eased opacity against linear travel stops it looking mechanical.
 */
function Sparkles({ reduced }: { reduced: boolean }) {
  if (reduced) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {SPARKS.map((s, i) => (
        <motion.span
          key={i}
          className="absolute block"
          style={{ left: `${s.leftPct}%`, top: `${s.topPct}%`, width: s.size, height: s.size }}
          initial={{ opacity: 0, scale: 0.35, y: 6, rotate: s.spin }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0.35, 1, 0.95, 0.5],
            y: [6, -14, -34, -52],
            rotate: [s.spin, s.spin + 80, s.spin + 165],
          }}
          transition={{
            duration: 3.4,
            delay: s.delay,
            repeat: Infinity,
            repeatDelay: 0.5,
            ease: "easeInOut",
            times: [0, 0.22, 0.68, 1],
          }}
        >
          <Image src="/misc/sparkle.svg" alt="" width={s.size} height={s.size} className="size-full" />
        </motion.span>
      ))}
    </div>
  );
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

/* ---------------------------------------------------------------- pieces */

/** Card chrome from the design: gradient over #312e2b plus a 1px inset white ring. */
const CARD_BG =
  "linear-gradient(180deg, rgb(49,46,43) 0%, rgba(0,0,0,0.08) 100%), linear-gradient(90deg, rgb(48,46,43) 0%, rgb(48,46,43) 100%)";

/** "Go Premium" — the design's blue, with its darker bottom edge. */
const BLUE_BTN =
  "relative flex min-h-[56px] w-full items-center justify-center rounded-[10px] bg-gradient-to-b from-[#009fd9] via-[#008cd1] via-[65%] to-[#0069ab] px-4 text-[22px] font-black leading-[25px] text-white shadow-[0_1px_2px_rgba(0,0,0,0.14),0_2px_4px_rgba(0,0,0,0.1),inset_0_-1px_0_0_#0b548c] [text-shadow:0_1px_0_rgba(0,0,0,0.2)] transition hover:brightness-[1.06] active:translate-y-px";
/** Same shape in the product's brand green, for the premium actions. */
const GREEN_BTN =
  "relative flex min-h-[56px] w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-b from-brand to-[#5d9948] px-4 text-[22px] font-black leading-[25px] text-white shadow-[0_1px_2px_rgba(0,0,0,0.14),0_2px_4px_rgba(0,0,0,0.1),inset_0_-1px_0_0_#45753c] [text-shadow:0_1px_0_rgba(0,0,0,0.2)] transition hover:brightness-[1.04] active:translate-y-px [&_svg]:size-5";
const QUIET_BTN =
  "flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[10px] bg-white/[0.07] text-[15px] font-bold text-white/85 transition hover:bg-white/[0.12] active:translate-y-px [&_svg]:size-4";

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-2 rounded-[10px] bg-[#1c1c19] p-3">
      <p className="text-[28px] font-black leading-[32px] tabular-nums text-white">
        {value}
      </p>
      <p className="text-[12px] uppercase leading-4 tracking-[0.5px] text-[#dedede]">
        {label}
      </p>
    </div>
  );
}

export type CompletionKind = "daily-limit" | "caught-up";

interface CompletionModalProps {
  kind: CompletionKind;
  /** Puzzles solved without a hint or reveal. */
  solvedClean: number;
  /** Puzzles finished at all. */
  solvedTotal: number;
  /** Puzzles finished at least once, across every session. */
  attempted: number;
  /** Puzzles that weren't solved cleanly — the retry target. */
  unsolved: number;
  /** The full queue, which free members can see but not finish. */
  queueTotal: number;
  /** Label of the next theme still holding unsolved puzzles, if any. */
  nextCategoryLabel?: string | null;
  /** That theme's badge — the same art the start-screen theme list uses. */
  nextCategoryIcon?: string | null;
  onRetryUnsolved: () => void;
  onSolveNextCategory: () => void;
  onReplay: () => void;
  onExit: () => void;
  onUpgrade: () => void;
}

/**
 * End-of-session card (Figma node 157:394).
 *
 * Free members hit it at their daily allowance — the "Solved" stat deliberately
 * reads against the *whole* queue (3/8) so the eight puzzles they can see but
 * can't reach are the pitch. Premium members hit it once the queue is clear and
 * are pointed at whatever they didn't solve cleanly.
 */
export function CompletionModal({
  kind,
  solvedClean,
  solvedTotal,
  attempted,
  unsolved,
  queueTotal,
  nextCategoryLabel,
  nextCategoryIcon,
  onRetryUnsolved,
  onSolveNextCategory,
  onReplay,
  onExit,
  onUpgrade,
}: CompletionModalProps) {
  const reduced = usePrefersReducedMotion();
  const primaryRef = React.useRef<HTMLButtonElement>(null);
  const isFree = kind === "daily-limit";
  const accuracy = attempted ? Math.round((solvedClean / attempted) * 100) : 0;

  React.useEffect(() => {
    primaryRef.current?.focus();
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onExit();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onExit]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.22 }}
        onClick={onExit}
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="completion-title"
        className="relative flex w-full max-w-[406px] flex-col items-center overflow-hidden rounded-[10px] px-3 py-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),0_18px_50px_-12px_rgba(0,0,0,0.65)]"
        style={{ backgroundImage: CARD_BG }}
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* One burst as the card lands; the sparkles carry on afterwards. */}
        <Confetti run contained />

        <button
          type="button"
          onClick={onExit}
          aria-label="Close"
          className="absolute right-0 top-0 z-20 grid size-12 place-items-center text-white/60 transition-colors hover:text-white"
        >
          <X className="size-4" strokeWidth={2.5} />
        </button>

        <div className="relative z-10 flex w-full flex-col items-center gap-6 py-6">
          {/* Artwork — the puzzle piece with the sparkles drifting around it. */}
          <div className="relative h-[275px] w-full shrink-0 overflow-hidden">
            <Image
              src={GAME_ICON.gameBasedPuzzles}
              alt=""
              width={221}
              height={221}
              priority
              className="absolute left-1/2 top-[47px] size-[221px] -translate-x-1/2"
            />
            <Sparkles reduced={reduced} />
          </div>

          <div className="flex w-full flex-col items-center gap-4">
            <div className="flex w-full flex-col items-center gap-2">
              <span
                className={cn(
                  "flex min-h-5 items-center rounded-[3px] px-1 py-0.5 text-[12px] uppercase leading-4 tracking-[0.5px]",
                  isFree
                    ? "bg-[rgba(255,164,89,0.1)] text-[#ffa459]"
                    : "bg-brand/10 text-brand",
                )}
              >
                {isFree ? "Daily limit reached" : "Queue cleared"}
              </span>

              <h2
                id="completion-title"
                className="text-center text-[28px] font-black leading-8 text-white"
              >
                {isFree ? "Get Unlimited Puzzles!" : "You're all caught up!"}
              </h2>

              <div className="flex w-full gap-2 text-center">
                <Stat value={`${solvedTotal}/${queueTotal}`} label="Solved" />
                <Stat value={`${solvedClean}/${attempted}`} label="Clean" />
                <Stat value={`${accuracy}%`} label="Accuracy" />
              </div>
            </div>

            <p className="w-[304px] text-center text-[16px] font-semibold leading-6 tracking-[-0.32px] text-white/85">
              {isFree ? (
                <>Improve faster with puzzles generated from your own games.</>
              ) : unsolved > 0 ? (
                <>
                  {unsolved === 1 ? "One puzzle" : `${unsolved} puzzles`} needed a
                  hint or a reveal — those are the ones worth another look.
                </>
              ) : (
                <>You solved every puzzle clean. New ones appear as you review more games.</>
              )}
            </p>
          </div>
        </div>

        <div className="relative z-10 flex w-full flex-col gap-2">
          {isFree ? (
            <button ref={primaryRef} type="button" onClick={onUpgrade} className={BLUE_BTN}>
              Go Premium
            </button>
          ) : (
            <>
              {/* Most useful first: clean up what went badly, then move on to
                  the next theme, then replay what was just finished. */}
              {unsolved > 0 && (
                <button
                  ref={primaryRef}
                  type="button"
                  onClick={onRetryUnsolved}
                  className={GREEN_BTN}
                >
                  <Target />
                  Retry {unsolved}
                </button>
              )}
              {nextCategoryLabel && (
                <button
                  ref={unsolved > 0 ? undefined : primaryRef}
                  type="button"
                  onClick={onSolveNextCategory}
                  className={unsolved > 0 ? QUIET_BTN : GREEN_BTN}
                >
                  {nextCategoryIcon ? (
                    <Image
                      src={nextCategoryIcon}
                      width={22}
                      height={22}
                      alt=""
                      className="shrink-0"
                    />
                  ) : null}
                  Solve {nextCategoryLabel}
                </button>
              )}
              <button
                ref={unsolved > 0 || nextCategoryLabel ? undefined : primaryRef}
                type="button"
                onClick={onReplay}
                className={
                  unsolved > 0 || nextCategoryLabel ? QUIET_BTN : GREEN_BTN
                }
              >
                <RotateCcw />
                Solve again
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
