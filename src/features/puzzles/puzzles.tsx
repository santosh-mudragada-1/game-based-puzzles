"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Settings, List, X } from "lucide-react";
import { MiniBoard } from "@/components/board/mini-board";
import { CoachBubble } from "@/components/review/coach-bubble";
import { GAME_ICON } from "@/lib/assets";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const RATING = "24,839";
const NEXT_LEVEL = 10;
const PROGRESS = 88; // % toward the next puzzle level
const COACH_TEXT = "Time to build your tactical muscles with some Puzzles?";

/** Puzzle modes shown in the expandable menu (same icons as the nav flyout). */
const MENU_ITEMS: { icon: string; label: string; href?: string }[] = [
  { icon: GAME_ICON.dailyPuzzle, label: "Daily Puzzle" },
  { icon: GAME_ICON.gameBasedPuzzles, label: "Game Based Puzzles", href: "/puzzles/game-based" },
  { icon: GAME_ICON.puzzleRush, label: "Puzzle Rush" },
  { icon: GAME_ICON.puzzleBattle, label: "Puzzle Battle" },
  { icon: GAME_ICON.customPuzzles, label: "Custom" },
];

/**
 * Player profile pictures placed on the level they've reached. Positions are
 * the Figma percentages within the 500×932 map so each sits on its node.
 */
const PLAYER_MARKERS = [
  { key: "jerry-305", src: "/puzzles/player-jerry305.png", leftPct: 46.6, topPct: 29.08 },
  { key: "santoshmudragada", src: "/puzzles/player-me.png", leftPct: 68.2, topPct: 53.86 },
  { key: "hackertowork", src: "/puzzles/player-hackertowork.png", leftPct: 35.8, topPct: 83.37 },
];

/** Gold puzzle badge with a level number layered on top. */
function PuzzleBadge({
  level,
  size,
  fontClass,
}: {
  level: number;
  size: number;
  fontClass: string;
}) {
  return (
    <span
      className="relative block shrink-0"
      style={{ width: size, height: size }}
    >
      <Image src={GAME_ICON.puzzleGold} width={size} height={size} alt="" />
      <span
        className={`absolute inset-0 grid place-items-center pt-px font-black leading-none tabular-nums text-white ${fontClass}`}
      >
        {level}
      </span>
    </span>
  );
}

/** A player's profile picture pinned to a level, with a downward pointer. */
function PlayerMarker({
  leftPct,
  topPct,
  src,
  alt,
}: {
  leftPct: number;
  topPct: number;
  src: string;
  alt: string;
}) {
  return (
    <div
      className="absolute z-[2] flex flex-col items-center"
      style={{ left: `${leftPct}%`, top: `${topPct}%` }}
    >
      <span className="block rounded-[5px] bg-white p-px shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
        <Image
          src={src}
          width={32}
          height={32}
          unoptimized
          alt={alt}
          className="block size-8 rounded-[4px] object-cover"
        />
      </span>
      <span className="-mt-px size-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-white" />
    </div>
  );
}

const GREEN_BUTTON =
  "relative flex h-16 w-full items-center justify-center rounded-[10px] bg-gradient-to-b from-[#81b64c] to-[#5d9948] text-[22px] font-extrabold text-white shadow-[0_1px_2px_rgba(0,0,0,0.14),0_2px_4px_rgba(0,0,0,0.1),inset_0_-1px_0_0_#45753c] transition hover:brightness-[1.04] active:translate-y-px active:brightness-95";

const RAISED_BUTTON =
  "flex h-16 w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-b from-white/[0.1] to-white/[0.05] text-[22px] font-extrabold text-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_2px_rgba(0,0,0,0.14),0_2px_4px_rgba(0,0,0,0.1)] transition hover:from-white/[0.14] hover:to-white/[0.08] active:translate-y-px";

/** Frosted-glass header over the map: centered puzzle badge + large "Puzzles". */
function PuzzlesHeader() {
  return (
    <div className="relative z-10 flex h-[72px] items-center justify-center gap-3 bg-white/10 backdrop-blur-[18px]">
      <PuzzleBadge level={9} size={40} fontClass="text-[15px]" />
      <p className="font-display text-[31px] font-black leading-9 text-white/90">
        Puzzles
      </p>
    </div>
  );
}

/** Rating + level progress + next-level badge, then the action buttons. */
function PuzzlesFooter({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <div className="relative z-10 px-6 pb-6 pt-4">
      <p className="text-[17px] font-extrabold leading-none text-white">
        {RATING}
      </p>

      <div className="mt-2 flex items-center gap-2">
        <div className="h-4 flex-1 overflow-hidden rounded-[10px] bg-white/10">
          <div
            className="h-full rounded-[10px] bg-brand"
            style={{ width: `${PROGRESS}%` }}
          />
        </div>
        <PuzzleBadge level={NEXT_LEVEL} size={32} fontClass="text-[11px]" />
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open puzzles menu"
          className="grid h-16 w-[58px] shrink-0 place-items-center rounded-[10px] bg-gradient-to-b from-white/[0.1] to-white/[0.05] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_2px_rgba(0,0,0,0.14),0_2px_4px_rgba(0,0,0,0.1)] transition hover:from-white/[0.14] hover:to-white/[0.08] active:translate-y-px"
        >
          <List className="size-7" strokeWidth={2.25} />
        </button>
        <Link href="/puzzles/game-based" className={GREEN_BUTTON}>
          Solve Puzzles
        </Link>
      </div>
    </div>
  );
}

/** Expanded puzzle-mode menu: a solid overlay panel (Figma node 37:13011). */
function PuzzlesMenu({ onClose }: { onClose: () => void }) {
  return (
    <>
      {/* 50% black overlay; click-outside closes the menu */}
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 z-20 cursor-default bg-black/50"
      />

      {/* Menu panel — solid #2e281f, exactly as Figma */}
      <div className="absolute inset-x-0 bottom-0 z-30 rounded-t-[5px] bg-[#2e281f] px-6 pb-6 pt-16 shadow-[0_-6px_20px_rgba(0,0,0,0.3)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="absolute right-4 top-1 grid size-9 place-items-center rounded-[6px] text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="size-5" />
        </button>

        <div className="flex flex-col gap-2">
        <Link href="/puzzles/game-based" className={GREEN_BUTTON}>
          Solve Puzzles
        </Link>

        {MENU_ITEMS.map((item) => {
          const inner = (
            <>
              <Image
                src={item.icon}
                width={32}
                height={32}
                alt=""
                className="drop-shadow-[0_1px_0_rgba(0,0,0,0.3)]"
              />
              {item.label}
            </>
          );
          return item.href ? (
            <Link key={item.label} href={item.href} className={RAISED_BUTTON}>
              {inner}
            </Link>
          ) : (
            <button key={item.label} type="button" className={RAISED_BUTTON}>
              {inner}
            </button>
          );
        })}
        </div>
      </div>
    </>
  );
}

/**
 * The Chess.com "Puzzles" trophy-path screen: a board (with a settings rail) on
 * the left and, on the right, the gamified level map with player markers, a
 * frosted header, a coach bubble, and a footer whose menu button expands into
 * the full puzzle-mode menu.
 */
export function PuzzlesScreen() {
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <div className="flex flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
      <h1 className="sr-only">Puzzles</h1>

      {/* LEFT — board with a settings rail down its right side */}
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-3 py-4 sm:px-5 lg:h-screen lg:py-5">
        <div className="flex w-full max-w-[min(100%,calc(100vh-6rem))] items-start gap-2">
          <div className="aspect-square min-w-0 flex-1">
            <MiniBoard
              fen={START_FEN}
              orientation="white"
              showCoordinates
              className="h-full w-full shadow-raised"
            />
          </div>
          <button
            type="button"
            aria-label="Board settings"
            className="grid size-8 shrink-0 place-items-center rounded-[6px] text-ink-soft transition-colors hover:bg-white/[0.06] hover:text-ink"
          >
            <Settings className="size-5" />
          </button>
        </div>
      </div>

      {/* RIGHT — puzzles trophy-path panel */}
      <aside className="relative flex min-h-[640px] w-full shrink-0 flex-col overflow-hidden border-t border-line/60 bg-[#4c3a28] lg:h-screen lg:min-h-0 lg:w-[500px] lg:border-l lg:border-t-0">
        {/* Map illustration + player markers, anchored to the top at natural size */}
        <div className="absolute inset-x-0 top-0 z-0">
          <div className="relative w-full">
            <Image
              src="/puzzles/trophy-path.png"
              alt="Puzzles level map"
              width={900}
              height={1678}
              priority
              sizes="(min-width: 1024px) 500px, 100vw"
              className="h-auto w-full select-none"
            />

            {/* Your position — the green pawn */}
            <div
              className="absolute z-[1]"
              style={{ left: "56.6%", top: "51.07%", width: "30%" }}
            >
              <Image
                src="/puzzles/pawn-green.png"
                width={269}
                height={269}
                alt="Your position"
                className="h-auto w-full select-none"
              />
            </div>

            {/* Players' profile pictures on their levels */}
            {PLAYER_MARKERS.map((m) => (
              <PlayerMarker
                key={m.key}
                leftPct={m.leftPct}
                topPct={m.topPct}
                src={m.src}
                alt={m.key}
              />
            ))}
          </div>
        </div>

        {/* Brown gradient over the bottom so the footer stays legible */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[260px] bg-[linear-gradient(to_bottom,rgba(122,68,20,0)_0%,#7a4414_55%)]"
        />

        <PuzzlesHeader />
        <div className="relative z-10 px-4 pt-3">
          <CoachBubble text={COACH_TEXT} />
        </div>

        <div className="flex-1" />

        <PuzzlesFooter onOpenMenu={() => setMenuOpen(true)} />
        {menuOpen && <PuzzlesMenu onClose={() => setMenuOpen(false)} />}
      </aside>
    </div>
  );
}
