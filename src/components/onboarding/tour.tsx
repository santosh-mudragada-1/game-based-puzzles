"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

import { MiniBoard } from "@/components/board/mini-board";
import { MoveBadge } from "@/components/shared/move-badge";
import { GAME_ICON } from "@/lib/assets";
import { cn } from "@/lib/utils";

/**
 * What the feature is, in three screens.
 *
 * Shown once, straight after connecting, while the review carries on behind it
 * — the explanation and the wait are the same thirty seconds rather than two
 * separate ones. Each screen animates the step it is describing, because the
 * whole idea is a board doing something, and a still picture of a board doing
 * something is just a board.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

/* ------------------------------------------------------------ 1 · You play */

/** A few moves of a real game, played out on a loop. */
const GAME = [
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
  "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2",
  "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
  "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",
];

function PlayStep() {
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % GAME.length), 1100);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative">
      <MiniBoard fen={GAME[i]} orientation="white" className="shadow-raised" />
      {/* A clock ticking down, so it reads as a game rather than a diagram. */}
      <motion.div
        className="absolute -bottom-3 -right-3 rounded-[8px] bg-surface-sunken px-3 py-1.5 shadow-pop"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, ease: EASE }}
      >
        <span className="font-display text-[15px] font-black tabular-nums text-white">
          14:5{9 - (i % 10)}
        </span>
      </motion.div>
    </div>
  );
}

/* -------------------------------------------------------- 2 · We review it */

const REVIEWED: { san: string; cls: "best" | "excellent" | "inaccuracy" | "blunder" }[] =
  [
    { san: "Nf3", cls: "best" },
    { san: "Bb5", cls: "excellent" },
    { san: "d3", cls: "inaccuracy" },
    { san: "Nxe5", cls: "blunder" },
  ];

function ReviewStep() {
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(
      () => setN((v) => (v >= REVIEWED.length ? 0 : v + 1)),
      780,
    );
    return () => clearInterval(t);
  }, []);

  // The bar collapses as the blunder lands — the advantage visibly leaving.
  const white = n >= REVIEWED.length ? 22 : 62 - n * 6;

  return (
    <div className="flex items-stretch gap-3">
      <div className="w-3 shrink-0 overflow-hidden rounded-[3px] bg-[#403d39]">
        <motion.div
          className="w-full bg-board-light"
          animate={{ height: `${white}%` }}
          transition={{ duration: 0.5, ease: EASE }}
        />
      </div>

      <div className="flex-1 space-y-1.5">
        {REVIEWED.map((m, i) => (
          <motion.div
            key={m.san}
            className={cn(
              "flex items-center justify-between rounded-[8px] px-3 py-2.5",
              i < n ? "bg-white/[0.06]" : "bg-white/[0.02]",
            )}
            animate={{ opacity: i < n ? 1 : 0.3, x: i < n ? 0 : -6 }}
            transition={{ duration: 0.28, ease: EASE }}
          >
            <span className="font-display text-[15px] font-bold text-white">
              {m.san}
            </span>
            {i < n && (
              <motion.span
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 24 }}
              >
                <MoveBadge classification={m.cls} size={18} />
              </motion.span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------- 3 · Mistakes → puzzles */

const BLUNDER_FEN =
  "r1bqk2r/pppp1ppp/2n2n2/1B2N3/4P3/8/PPPP1PPP/RNBQK2R b KQkq - 0 5";

function PuzzleStep() {
  const [beat, setBeat] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setBeat((b) => (b + 1) % 3), 1400);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative">
      <MiniBoard
        fen={BLUNDER_FEN}
        orientation="black"
        highlight={beat === 0 ? ["e5"] : undefined}
        hint={beat >= 1 ? ["c6", "e5"] : undefined}
        className="shadow-raised"
      />

      <AnimatePresence mode="wait">
        {beat === 0 ? (
          <motion.div
            key="mistake"
            className="absolute -right-3 -top-3 flex items-center gap-1.5 rounded-[8px] bg-[#ca3431] px-3 py-1.5 shadow-pop"
            initial={{ opacity: 0, scale: 0.8, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 460, damping: 26 }}
          >
            <Image src="/move-types/blunder.png" width={16} height={16} alt="" />
            <span className="text-[13px] font-bold text-white">Blunder</span>
          </motion.div>
        ) : (
          <motion.div
            key="puzzle"
            className="absolute -right-3 -top-3 flex items-center gap-1.5 rounded-[8px] bg-brand px-3 py-1.5 shadow-pop"
            initial={{ opacity: 0, scale: 0.8, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 460, damping: 26 }}
          >
            <Check className="size-4 text-white" strokeWidth={3} />
            <span className="text-[13px] font-bold text-white">Your puzzle</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* -------------------------------------------------------------- The screens */

const STEPS = [
  {
    key: "play",
    eyebrow: "Step one",
    title: "You play your games",
    body: "Nothing changes about how you play. Every game you finish on Chess.com comes straight here — rapid, blitz, bullet, all of it.",
    art: <PlayStep />,
  },
  {
    key: "review",
    eyebrow: "Step two",
    title: "Stockfish reads every move",
    body: "Each position is scored, and every move is marked for what it actually cost you — the good ones, the sloppy ones, and the ones that lost the game.",
    art: <ReviewStep />,
  },
  {
    key: "puzzles",
    eyebrow: "Step three",
    title: "Your mistakes become puzzles",
    body: "The board rewinds to the moment before each mistake and hands it back to you. Same position, same pieces — this time you find the move you missed.",
    art: <PuzzleStep />,
  },
] as const;

export function Tour({ onDone }: { onDone: () => void }) {
  const [i, setI] = React.useState(0);
  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  return (
    <div className="flex w-full max-w-[860px] flex-col items-center px-6">
      <div className="grid w-full items-center gap-10 md:grid-cols-[300px_minmax(0,1fr)]">
        {/* Art */}
        <div className="order-2 mx-auto w-full max-w-[300px] md:order-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.key}
              initial={{ opacity: 0, scale: 0.94, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              transition={{ duration: 0.34, ease: EASE }}
            >
              {step.art}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Copy */}
        <div className="order-1 min-w-0 md:order-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <div className="flex items-center gap-2.5">
                <Image
                  src={GAME_ICON.gameBasedPuzzles}
                  width={26}
                  height={26}
                  alt=""
                />
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand">
                  {step.eyebrow}
                </span>
              </div>
              <h2 className="mt-3 font-display text-[30px] font-black leading-[1.1] text-white sm:text-[34px]">
                {step.title}
              </h2>
              <p className="mt-3 max-w-[440px] text-[15px] leading-relaxed text-ink-muted">
                {step.body}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Pager */}
      <div className="mt-12 flex w-full max-w-[440px] items-center gap-4">
        <div className="flex flex-1 items-center gap-2" role="tablist">
          {STEPS.map((s, n) => (
            <button
              key={s.key}
              type="button"
              role="tab"
              aria-selected={n === i}
              aria-label={s.title}
              onClick={() => setI(n)}
              className="group h-2.5 flex-1 rounded-full bg-white/12"
            >
              <motion.span
                className="block h-full rounded-full bg-brand"
                animate={{ width: n <= i ? "100%" : "0%" }}
                transition={{ duration: 0.35, ease: EASE }}
              />
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => (last ? onDone() : setI(i + 1))}
          className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-[10px] bg-gradient-to-b from-brand to-[#5d9948] px-6 text-[15px] font-bold text-white shadow-[0_1px_2px_rgba(0,0,0,0.14),0_2px_4px_rgba(0,0,0,0.1),inset_0_-1px_0_0_#45753c] transition hover:brightness-[1.04] active:translate-y-px"
        >
          {last ? "Start solving" : "Next"}
          <ArrowRight className="size-[18px]" />
        </button>
      </div>

      {!last && (
        <button
          type="button"
          onClick={onDone}
          className="mt-4 text-[13px] font-semibold text-ink-soft transition-colors hover:text-ink"
        >
          Skip
        </button>
      )}
    </div>
  );
}
