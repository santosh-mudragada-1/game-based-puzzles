"use client";

import * as React from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { motion } from "framer-motion";

import {
  UpgradeBadge,
  UPGRADE_DURATION,
  UPGRADE_FPS,
} from "@/remotion/upgrade-badge";

/**
 * Full-screen celebration played once, right after the user upgrades.
 *
 * The animation itself is a Remotion composition driven off `useCurrentFrame`,
 * embedded with `<Player>`. Keeping it as a composition means the same artwork
 * can be rendered out to video later without being rebuilt.
 *
 * `onDone` fires when the composition ends (or immediately under
 * reduced-motion), and the caller resumes the queue from there.
 */
export function UpgradeTransition({ onDone }: { onDone: () => void }) {
  const playerRef = React.useRef<PlayerRef>(null);
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
    // Belt and braces: end the overlay even if the `ended` event is missed.
    const id = setTimeout(finish, ((UPGRADE_DURATION + 6) / UPGRADE_FPS) * 1000);
    return () => clearTimeout(id);
  }, [finish]);

  React.useEffect(() => {
    const p = playerRef.current;
    if (!p) return;
    p.addEventListener("ended", finish);
    return () => p.removeEventListener("ended", finish);
  }, [finish]);

  return (
    <motion.div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#25231f]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      role="status"
      aria-label="Premium unlocked"
    >
      <Player
        ref={playerRef}
        component={UpgradeBadge}
        durationInFrames={UPGRADE_DURATION}
        fps={UPGRADE_FPS}
        compositionWidth={720}
        compositionHeight={480}
        autoPlay
        controls={false}
        clickToPlay={false}
        doubleClickToFullscreen={false}
        // The Player needs a definite box — "height: auto" collapses it to zero
        // and the composition renders into nothing.
        style={{ width: 720, height: 480, maxWidth: "92vw" }}
      />

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
