"use client";

import * as React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

import { ICON } from "@/lib/assets";

/** Total run time before the queue resumes. */
const RUN_MS = 3000;

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/**
 * Full-screen celebration played once, right after the user upgrades.
 *
 * The same choreography exists as a Remotion composition (`src/remotion/
 * upgrade-badge.tsx`) for rendering to video, but the in-app overlay is driven
 * by framer-motion: Remotion's `<Player>` reports `isPlaying()` yet never
 * advances past frame 0 here, which left the screen blank.
 *
 * `onDone` fires when the run finishes, when Skip is pressed, or immediately
 * under reduced-motion, and the caller resumes the queue from there.
 */
export function UpgradeTransition({ onDone }: { onDone: () => void }) {
  const doneRef = React.useRef(false);

  const finish = React.useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  }, [onDone]);

  React.useEffect(() => {
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) {
      finish();
      return;
    }
    const id = window.setTimeout(finish, RUN_MS);
    return () => window.clearTimeout(id);
  }, [finish]);

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-7 bg-[#25231f]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      role="status"
      aria-label="Premium unlocked"
    >
      {/* Halo */}
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute size-[300px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(74,144,217,0.5) 0%, rgba(74,144,217,0) 68%)",
          top: "calc(50% - 220px)",
        }}
        initial={{ opacity: 0, scale: 0.4 }}
        animate={{ opacity: [0, 0.9, 0.75, 0], scale: 1.25 }}
        transition={{ duration: 2.6, times: [0, 0.2, 0.7, 1], ease: EASE_OUT }}
      />

      {/* The diamond drops in and settles, with a shine crossing its facets. */}
      <motion.div
        className="relative size-[168px] overflow-hidden"
        initial={{ opacity: 0, y: -46, rotate: -24, scale: 0.35 }}
        animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 190, damping: 13, mass: 0.7 }}
      >
        <Image src={ICON.upgrade} alt="" width={168} height={168} priority />

        {/* The mask sits on this static wrapper, not on the moving highlight —
            masking the highlight itself would drag the diamond-shaped cutout
            along with it and paint a bar across the whole container. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
          style={{
            maskImage: `url(${ICON.upgrade})`,
            maskSize: "100% 100%",
            maskRepeat: "no-repeat",
            maskPosition: "center",
            WebkitMaskImage: `url(${ICON.upgrade})`,
            WebkitMaskSize: "100% 100%",
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
          }}
        >
          <motion.span
            className="absolute -inset-y-10 w-[70px] rotate-[18deg]"
            style={{
              background:
                "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.85) 50%, rgba(255,255,255,0) 100%)",
            }}
            initial={{ x: -100 }}
            animate={{ x: 210 }}
            transition={{ duration: 1.05, delay: 0.55, ease: [0.4, 0, 0.2, 1] }}
          />
        </span>
      </motion.div>

      <motion.div
        className="flex flex-col items-center gap-2.5"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.5, ease: EASE_OUT }}
      >
        <p className="text-[15px] font-bold uppercase tracking-[1.6px] text-[#5aa0e6]">
          Premium unlocked
        </p>
        <p className="text-center font-display text-[34px] font-black leading-tight text-white">
          All 8 puzzles are yours
        </p>
        <motion.p
          className="text-[16px] font-semibold text-white/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 1.5 }}
        >
          Picking up where you left off…
        </motion.p>
      </motion.div>

      <button
        type="button"
        onClick={finish}
        className="absolute bottom-10 text-[13px] font-semibold text-white/45 transition-colors hover:text-white/80"
      >
        Skip
      </button>
    </motion.div>
  );
}
