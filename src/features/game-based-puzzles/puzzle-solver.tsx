"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Lightbulb,
  HelpCircle,
  RotateCcw,
  Search,
  ExternalLink,
  Check,
} from "lucide-react";

import { MiniBoard } from "@/components/board/mini-board";
import { Avatar } from "@/components/shared/avatar";
import { CoachBubble } from "@/components/review/coach-bubble";
import { Confetti } from "@/components/shared/confetti";
import { PuzzleBoard, type BoardArrow } from "@/components/puzzles/puzzle-board";
import { PuzzleEvalBar } from "@/components/puzzles/puzzle-eval-bar";
import { SanText } from "@/components/puzzles/san-text";
import { GAME_ICON, ICON } from "@/lib/assets";
import { currentUser } from "@/data";
import {
  CATEGORY_LABEL,
  CATEGORY_ICON,
  FREE_DAILY_LIMIT,
  coachIntro,
} from "@/data/solve-puzzles";
import { useActivePuzzles } from "@/hooks/use-active-puzzles";
import { useChessAccount } from "@/hooks/use-chess-account";
import { useOpponents } from "@/hooks/use-opponents";
import { useReviews } from "@/hooks/use-reviews";
import { flagOf } from "@/lib/chesscom";
import { usePlan } from "@/hooks/use-plan";
import { usePuzzleProgress } from "@/hooks/use-puzzle-progress";
import {
  CompletionModal,
  type CompletionKind,
} from "@/components/puzzles/completion-modal";
// Remotion is only needed for the one-off upgrade celebration, so it stays out
// of the main bundle until someone actually upgrades.
const UpgradeTransition = dynamic(
  () =>
    import("@/components/puzzles/upgrade-transition").then(
      (m) => m.UpgradeTransition,
    ),
  { ssr: false },
);
import {
  checkedKingSquare,
  evalLabel,
  fenAfterMove,
  pieceAt,
} from "@/lib/puzzle";
import { useEngineEval } from "@/hooks/use-engine-eval";
import { MATE_CP } from "@/lib/engine";
import type {
  PieceColor,
  PlayerRef,
  PuzzleCategory,
  PuzzleOutcome,
  SolvePuzzle,
} from "@/types";
import { cn } from "@/lib/utils";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const DARK_BTN =
  "flex h-12 items-center justify-center gap-2 rounded-[10px] bg-gradient-to-b from-white/[0.1] to-white/[0.05] text-[15px] font-semibold text-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_2px_rgba(0,0,0,0.14),0_2px_4px_rgba(0,0,0,0.1)] transition hover:from-white/[0.14] hover:to-white/[0.08] active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-[18px]";
const GREEN_BTN =
  "flex h-12 items-center justify-center gap-2 rounded-[10px] bg-gradient-to-b from-brand to-[#5d9948] text-[15px] font-bold text-white shadow-[0_1px_2px_rgba(0,0,0,0.14),0_2px_4px_rgba(0,0,0,0.1),inset_0_-1px_0_0_#45753c] transition hover:brightness-[1.04] active:translate-y-px active:brightness-95 [&_svg]:size-[18px]";
const ICON_BTN =
  "grid size-9 place-items-center rounded-[6px] text-ink-soft transition-colors hover:bg-white/[0.06] hover:text-ink";

type Outcome = PuzzleOutcome;

/** The trainee, playing whichever side the puzzle is to move. */
function mePlayer(side: PieceColor): PlayerRef {
  return {
    username: currentUser.username,
    rating: currentUser.ratings.rapid,
    color: side,
    countryFlag: currentUser.countryFlag,
  };
}

function PlayerRow({
  player,
  isUser,
  thinking,
  avatar,
}: {
  player: PlayerRef;
  isUser?: boolean;
  thinking?: boolean;
  /** The member's real Chess.com photo, when an account is connected. */
  avatar?: string | null;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Avatar
        size={34}
        rounded="md"
        src={avatar}
        alt={`${player.username} avatar`}
      />
      <span className="truncate text-[14px] font-bold text-ink">
        {player.username}
      </span>
      <span className="text-xs text-ink-faint">({player.rating})</span>
      {player.countryFlag && (
        <span className="text-[18px] leading-none" aria-hidden>
          {player.countryFlag}
        </span>
      )}
      {thinking && (
        <span className="ml-auto flex items-center gap-1" aria-label="Opponent is moving">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="block size-1.5 rounded-full bg-ink-soft"
              animate={{ opacity: [0.25, 1, 0.25] }}
              transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </span>
      )}
      {isUser && (
        <span className="ml-auto rounded-[4px] bg-brand/15 px-2 py-0.5 text-[11px] font-bold text-brand">
          You
        </span>
      )}
    </div>
  );
}

function PanelHeader({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex h-[64px] shrink-0 items-center gap-2 border-b border-line/50 bg-black/[0.14] px-3">
      <button type="button" aria-label="Back" onClick={onBack} className={ICON_BTN}>
        <ArrowLeft className="size-5" />
      </button>
      <Image src={GAME_ICON.gameBasedPuzzles} width={26} height={26} alt="" />
      <h2 className="truncate font-display text-[22px] font-black text-white/90">
        Game Based Puzzles
      </h2>
    </div>
  );
}

function ProgressRow({ completed, total }: { completed: number; total: number }) {
  const pct = Math.min(100, Math.round((completed / total) * 100));
  return (
    <div className="flex items-center gap-3">
      <Image src={GAME_ICON.gameBasedPuzzles} width={28} height={28} alt="" />
      <div className="min-w-0 flex-1">
        <p className="text-[14px] leading-none text-white/85">
          <span className="font-bold text-white tabular-nums">
            {completed}/{total}
          </span>{" "}
          completed
        </p>
        <div className="mt-2 h-3 overflow-hidden rounded-[10px] bg-white/10">
          <div
            className="h-full rounded-[10px] bg-brand transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------- Solving panel cards */

/** Figma: cards in the panel sit on a flat white 5% wash, no coloured tints. */
const CARD = "rounded-[10px] bg-white/[0.05]";
/** Figma greys — deliberately literal, they aren't in the token set. */
const MUTED = "#a3a19e";
const LABEL = "#9e9c99";
const WRONG = "#e0625c";

/** A 56px row: badge on the left, text after it. The panel's basic unit. */
function PanelRow({
  badge,
  children,
  className,
}: {
  badge: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex h-14 items-center gap-2 px-4", CARD, className)}>
      <span className="grid size-6 shrink-0 place-items-center">{badge}</span>
      {children}
    </div>
  );
}

/** The side-to-move swatch — a white or black square, as on a scoresheet. */
function SideToMove({ side }: { side: PieceColor }) {
  return (
    <PanelRow
      badge={
        <span
          className={cn(
            "size-6 rounded-[3px] border-[1.8px] border-[#8b8987]",
            side === "white" ? "bg-white" : "bg-[#312e2b]",
          )}
        />
      }
    >
      <p className="text-[17px] font-bold tracking-[-0.43px] text-white">
        {side === "white" ? "White" : "Black"} to move
      </p>
    </PanelRow>
  );
}

/** Chess.com's tick — a thick check, drawn rather than pulled from lucide. */
function Tick({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <path
        d="M14.13 5.31 6.58 12.86c-.49.49-.85.47-1.34 0L1.85 9.44c-.75-.75-.75-1.06 0-1.82l.06-.06c.76-.76 1.07-.76 1.82 0l2.2 2.2 6.31-6.33c.75-.75 1.07-.75 1.82 0l.07.06c.75.76.75 1.07 0 1.82Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** "♜g7+ is correct!" — one row per move of the line the solver has found. */
function CorrectMove({ san, color }: { san: string; color: PieceColor }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 480, damping: 30 }}
    >
      <PanelRow
        badge={
          <span className="grid size-6 place-items-center rounded-full bg-brand">
            <Tick className="size-4 text-white" />
          </span>
        }
      >
        <p className="flex items-center gap-1.5 text-[17px] font-bold tracking-[-0.43px] text-brand">
          <SanText san={san} color={color} glyphClassName="text-[23px]" />
          <span>is correct!</span>
        </p>
      </PanelRow>
    </motion.div>
  );
}

/** Sparks drifting up out of the Solved bar — the "clean solve" flourish. */
function Sparks() {
  const seeds = [10, 26, 43, 59, 74, 90];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {seeds.map((left, i) => (
        <motion.span
          key={left}
          className="absolute bottom-1 block size-1 rounded-[1px] bg-white/70"
          style={{ left: `${left}%` }}
          initial={{ opacity: 0 }}
          animate={{ y: [0, -40], opacity: [0, 0.9, 0], rotate: [0, 180] }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            delay: i * 0.34,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

/**
 * The green bar that closes the puzzle out, with the evaluation it recovered.
 *
 * Figma calls this simply "Solved"; the wording widens only when the solve
 * wasn't clean, so "found it cold" and "needed the answer" still read
 * differently without inventing a colour the design doesn't have.
 */
function SolvedBar({
  kind,
  fromLabel,
  toLabel,
}: {
  kind: Outcome;
  fromLabel: string;
  toLabel: string;
}) {
  const clean = kind === "solved-clean";
  const text =
    kind === "failed"
      ? "Solution revealed"
      : clean
        ? "Solved"
        : "Solved with a hint";

  return (
    <motion.div
      className="relative flex h-14 items-center justify-between overflow-hidden rounded-[10px] bg-brand px-4"
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 26 }}
    >
      {clean && <Sparks />}
      {/* A single shine sweeping across on arrival. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: "-140%" }}
        animate={{ x: "420%" }}
        transition={{ duration: 1.1, delay: 0.2, ease: "easeInOut" }}
      />
      <p className="relative flex items-center gap-1 text-[17px] font-bold tracking-[-0.43px] text-white">
        <Tick className="size-6 shrink-0 text-white" />
        {text}
      </p>
      <p className="relative flex items-center gap-[7px] text-[13px] font-bold leading-[13px] tabular-nums">
        <span className="text-white/60">{fromLabel}</span>
        <span className="text-[#ede9e3]">&rarr;</span>
        <span className="text-white">{toLabel}</span>
      </p>
    </motion.div>
  );
}

/**
 * The middle of the panel while a puzzle is open.
 *
 * Reads top to bottom as a story: what already happened (past tense, the move
 * struck through, with the evaluation it cost), whose turn it is now, then a
 * row per move of the line as it is found — so a multi-move puzzle shows
 * progress instead of staying silent until the end.
 */
function PuzzleBrief({
  puzzle,
  userSide,
  solved,
  outcome,
  replaying,
  found,
  wasLabel,
  nowLabel,
  toLabel,
}: {
  puzzle: SolvePuzzle;
  userSide: PieceColor;
  solved: boolean;
  outcome: Outcome;
  /** The mistake is replaying itself on the board right now. */
  replaying: boolean;
  /** The solver's own moves found so far, in order. */
  found: string[];
  /** Evaluation that was available, what the mistake left, where it ends up. */
  wasLabel: string;
  nowLabel: string;
  toLabel: string;
}) {
  return (
    <div className="flex flex-col gap-2 px-6 pb-6">
      {/* Once the puzzle is answered the mistake stops being the headline. */}
      {!solved && (
        <>
          <p
            className="pb-1 text-[11px] font-bold uppercase leading-[16.5px] tracking-[0.275px]"
            style={{ color: LABEL }}
          >
            What happened in your game
          </p>
          <div className={cn(CARD, "p-4")}>
            <div className="flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[12px] leading-[12px]" style={{ color: MUTED }}>
                  You played
                </p>
                <p
                  className="relative mt-1.5 inline-flex items-center font-display text-[19px] font-black leading-[19px]"
                  style={{ color: WRONG }}
                >
                  <SanText san={puzzle.played.san} color={userSide} glyphClassName="text-[25px]" />
                  {/* Struck through as one unit — a text-decoration would skip
                      the glyph and stop short of it. */}
                  <span
                    aria-hidden
                    className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2"
                    style={{ backgroundColor: WRONG }}
                  />
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p
                  className="text-[10px] uppercase leading-[10px] tracking-[0.25px]"
                  style={{ color: LABEL }}
                >
                  Evaluation
                </p>
                <p className="mt-1.5 text-[14px] font-bold leading-[14px] tabular-nums">
                  <span style={{ color: MUTED }}>{wasLabel}</span>
                  <span className="mx-1.5" style={{ color: LABEL }}>
                    &rarr;
                  </span>
                  <span style={{ color: WRONG }}>{nowLabel}</span>
                </p>
              </div>
            </div>
            {/* Only while the mistake is playing itself out — once it has, the
                crossed-out piece on the board says it without a caption. */}
            {replaying && (
              <p
                className="mt-3 text-[12px] leading-[16.5px]"
                style={{ color: MUTED }}
              >
                Replaying it on the board…
              </p>
            )}
          </div>
        </>
      )}

      <SideToMove side={userSide} />

      {found.map((san, i) => (
        <CorrectMove key={`${san}-${i}`} san={san} color={userSide} />
      ))}

      {solved && (
        <SolvedBar kind={outcome} fromLabel={nowLabel} toLabel={toLabel} />
      )}
    </div>
  );
}


/* ---------------------------------------------------------------- Start view */

/** A single figure in the "where you got to" strip on the start screen. */
function SessionStat({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: string;
}) {
  return (
    <div className="flex-1 rounded-[8px] bg-black/25 px-2 py-2 text-center">
      <p className={cn("text-[18px] font-black leading-none tabular-nums", tone)}>
        {value}
      </p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
        {label}
      </p>
    </div>
  );
}

function StartView({
  onStart,
  progress,
  categories,
  intro,
  total,
}: {
  onStart: (category: PuzzleCategory | null) => void;
  /**
   * Where the member got to before backing out. Present once they've played, so
   * returning to this screen recaps the run instead of pretending it never
   * happened; `locked` means Solve will hit the paywall rather than deal a puzzle.
   */
  progress?: {
    done: number;
    left: number;
    replay: number;
    total: number;
    locked: boolean;
  };
  /** Themes in the live queue, counted from the queue itself. */
  categories: { category: PuzzleCategory; label: string; count: number }[];
  intro: string;
  total: number;
}) {
  return (
    <>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4 scrollbar-thin">
        <CoachBubble
          text={
            progress
              ? progress.locked
                ? `You've used today's ${progress.done} free puzzles. ${progress.left} still waiting.`
                : `${progress.done} done, ${progress.left} to go.`
              : intro
          }
        />

        {progress && (
          <div className="flex gap-2">
            <SessionStat value={progress.done} label="Done" tone="text-brand" />
            <SessionStat value={progress.left} label="Left" tone="text-ink" />
            <SessionStat
              value={progress.replay}
              label="To replay"
              tone={progress.replay > 0 ? "text-move-inaccuracy" : "text-ink"}
            />
          </div>
        )}

        <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
          Pick a theme to drill — or Solve all
        </p>
        <div className="space-y-0.5">
          {categories.map((c) => (
            <button
              key={c.category}
              type="button"
              onClick={() => onStart(c.category)}
              className="group flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 text-left transition-colors hover:bg-white/[0.06]"
            >
              <Image
                src={CATEGORY_ICON[c.category]}
                width={22}
                height={22}
                alt=""
                className="shrink-0"
              />
              <span className="flex-1 text-[15px] font-semibold text-ink">
                {c.label}
              </span>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[12px] font-bold tabular-nums text-ink-soft">
                {c.count}
              </span>
              <ChevronRight className="size-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      </div>
      <div className="shrink-0 space-y-3 border-t border-line/40 bg-black/[0.14] px-6 pb-6 pt-4">
        <ProgressRow
          completed={progress ? progress.done : 0}
          total={progress ? progress.total : total}
        />
        <button
          type="button"
          onClick={() => onStart(null)}
          className={cn(GREEN_BTN, "h-14 w-full text-[19px] font-extrabold")}
        >
          Solve
        </button>
      </div>
    </>
  );
}

/* --------------------------------------------------------------- Solve view */

function ClassificationTag({ puzzle }: { puzzle: SolvePuzzle }) {
  return (
    <div className="flex items-center gap-2 rounded-[8px] bg-black/20 p-3">
      <Image
        src={CATEGORY_ICON[puzzle.category]}
        width={22}
        height={22}
        alt=""
        className="shrink-0"
      />
      <span className="min-w-0 truncate text-[14px]">
        <span className="font-semibold text-white">
          {CATEGORY_LABEL[puzzle.category]}
        </span>{" "}
        <span className="text-white/70">vs {puzzle.opponent}</span>
      </span>
      <Link
        href={
          puzzle.archived
            ? `/review?game=${puzzle.gameId}&ply=${puzzle.reviewPly}`
            : `/review?ply=${puzzle.reviewPly}`
        }
        target="_blank"
        rel="noreferrer"
        className="ml-auto flex shrink-0 items-center gap-1 text-[14px] text-white/70 transition-colors hover:text-white"
      >
        View game
        <ExternalLink className="size-3.5" />
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------- Screen */

type View = "start" | "run";

export function PuzzleSolver() {
  const router = useRouter();
  const { plan, setPlan } = usePlan();
  /**
   * The live queue: puzzles mined from this member's own reviewed games once
   * there are any, the authored sample set until then.
   */
  const {
    puzzles: queue,
    categories,
    live,
    mining,
    target: queueTotal,
  } = useActivePuzzles();
  /** "Solve" on a row of the archive opens straight into that game's puzzles. */
  const gameFilter = useSearchParams().get("game");
  const { gamePuzzles, requestPuzzles } = useReviews();
  const { profile } = useChessAccount();
  const { opponents } = useOpponents(8);

  /** The trainee — the connected Chess.com member when there is one. */
  const me = React.useCallback(
    (side: PieceColor): PlayerRef =>
      profile
        ? {
            username: profile.username,
            rating: profile.stats.rapid?.rating ?? currentUser.ratings.rapid,
            color: side,
            countryFlag: flagOf(profile.country ?? undefined) || undefined,
          }
        : mePlayer(side),
    [profile],
  );
  const [view, setView] = React.useState<View>("start");
  /** The end-of-session celebration, shown over the finished puzzle. */
  const [completeOpen, setCompleteOpen] = React.useState(false);
  /** Plays once after upgrading, before the queue resumes. */
  const [upgrading, setUpgrading] = React.useState(false);
  /** True once a run has happened, so the start screen can recap it. */
  const [played, setPlayed] = React.useState(false);
  const [session, setSession] = React.useState<SolvePuzzle[]>(queue);
  const [index, setIndex] = React.useState(0);
  const [outcomes, setOutcomes] = React.useState<Record<string, Outcome>>({});
  /**
   * Lifetime standing, shared with the rest of the app.
   *
   * `outcomes` is deliberately wiped whenever a session starts, so on its own it
   * would report "3/8" after retrying three puzzles even though all eight had
   * been solved. The meters, the end card and the home page all read this
   * instead, so drilling one theme then another adds up.
   */
  const {
    record,
    recordOutcome,
    solved: solvedTotal,
    clean: solvedClean,
    attempted: attemptedTotal,
    unsolved: unsolvedCount,
  } = usePuzzleProgress();
  /** Furthest ply reached per puzzle (progress) — advances on each played move. */
  const [reached, setReached] = React.useState<Record<string, number>>({});
  /** The ply currently being viewed (≤ reached) — scrubbed with ←/→ to analyse. */
  const [viewPly, setViewPly] = React.useState(0);
  const [hintLevel, setHintLevel] = React.useState(0);
  const [assisted, setAssisted] = React.useState(false);
  const [revealing, setRevealing] = React.useState(false);
  const [shakeSignal, setShakeSignal] = React.useState(0);
  const [wrong, setWrong] = React.useState(false);
  /** Puzzles where a wrong move was tried (they no longer count as a clean solve). */
  const [erred, setErred] = React.useState<Record<string, boolean>>({});
  /** The theme the current session was started from (for "Solve again"). */
  const [sessionCat, setSessionCat] = React.useState<PuzzleCategory | null>(null);
  const wrongTimer = React.useRef<ReturnType<typeof setTimeout>>(undefined);

  const puzzle = session[index] ?? null;
  const line = React.useMemo(() => puzzle?.line ?? [], [puzzle]);
  const userSide: PieceColor = puzzle?.sideToMove ?? "white";
  // `reachedPly` = how far the line has been played; `vp` = the ply on screen
  // (you can scrub back to review, then come forward to keep solving).
  const reachedPly = puzzle ? Math.min(reached[puzzle.id] ?? 0, line.length) : 0;
  const vp = Math.max(0, Math.min(viewPly, reachedPly));
  const solved = puzzle != null && outcomes[puzzle.id] != null;
  const atLive = vp >= reachedPly; // viewing the current (live) position
  const userTurn =
    puzzle != null &&
    !solved &&
    !revealing &&
    atLive &&
    line[reachedPly]?.side === userSide;

  const currentFen = vp === 0 ? (puzzle?.fen ?? START_FEN) : line[vp - 1].fen;
  const lastSolvedFen = line.length ? line[line.length - 1].fen : (puzzle?.fen ?? START_FEN);

  /* ---- Evaluation (Stockfish) -------------------------------------------
   * Two positions drive the bar. `puzzle.fen` — the moment before the mistake —
   * is what was *available*, and anchors the bar at the bottom. The bar itself
   * fills to whatever the move actually played led to, so the gap between them
   * is the advantage that was thrown away. Authored evals seed both and stand in
   * if the engine can't load.
   */
  const playedFen = React.useMemo(
    () =>
      puzzle
        ? fenAfterMove(puzzle.fen, puzzle.played.from, puzzle.played.to)
        : null,
    [puzzle],
  );

  const authoredPeak = React.useMemo(() => {
    if (!line.length) return { cp: 0, mate: null as number | null };
    // A mating line's plies are scored *after* each move, so the last one reads
    // "mate 0" — delivered. From the position the solver is looking at the mate
    // is still N of their own moves away, and labelling it "1-0" before they've
    // played it claims the game is already over.
    const mateIdx = line.findIndex((p) => p.isMate);
    if (mateIdx >= 0)
      return { cp: MATE_CP, mate: Math.ceil((mateIdx + 1) / 2) as number | null };
    let best = line[0];
    for (const p of line) if (p.cp > best.cp) best = p;
    return { cp: best.cp, mate: best.mate };
  }, [line]);

  const peakEval = useEngineEval(puzzle?.fen ?? null, userSide, {
    enabled: view === "run" && puzzle != null,
    fallback: authoredPeak,
    resetKey: puzzle?.id,
  });

  // At the start the bar reads the position the played move led to (the board
  // still shows the moment before it, with the orange arrow); after that it
  // follows the line as it's solved.
  //
  // Once the puzzle is solved the mistake is no longer part of the line, so
  // stepping back to the start shows the position as it stood — not the wreck
  // the played move made of it. Otherwise scrubbing back would re-open the gap
  // and replay the red "you threw it away" band on a puzzle already put right.
  const barFen = vp === 0 ? (solved ? puzzle?.fen ?? null : playedFen) : line[vp - 1].fen;
  const authoredCurrent =
    vp === 0
      ? solved
        ? authoredPeak
        : { cp: puzzle?.start.cp ?? 0, mate: puzzle?.start.mate ?? null }
      : { cp: line[vp - 1].cp, mate: line[vp - 1].mate };
  const barEval = useEngineEval(barFen, userSide, {
    enabled: view === "run" && puzzle != null,
    fallback: authoredCurrent,
    resetKey: puzzle?.id,
  });

  // The hook holds the *previous* ply's score while the next one is searched,
  // which past the first move means the bar briefly shows the pre-move number
  // against the new peak — a red gap flashing open on the very move that closed
  // it. The authored (engine-verified) score for the ply stands in until the
  // live search lands.
  const barSettled = barEval.settled || barEval.failed;
  const shownCp = vp === 0 || barSettled ? barEval.cp : authoredCurrent.cp;
  const shownMate = vp === 0 || barSettled ? barEval.mate : authoredCurrent.mate;

  // The opening drop only plays once both numbers are real. Past the first move
  // the bar just tracks the line, so it never holds again mid-puzzle.
  const barReady =
    vp > 0 || ((peakEval.settled || peakEval.failed) && barSettled);

  /**
   * How far into the queue this member may go. The counters still read against
   * the full queue ("Puzzle 3 / 8"), so a free member can see what's behind the
   * paywall rather than being shown a queue that looks three long.
   */
  const dailyLimit =
    plan === "free"
      ? Math.min(FREE_DAILY_LIMIT, session.length)
      : session.length;
  /** Spent in *this* sitting — what a daily allowance is measured against. */
  const finishedThisSession = Object.keys(outcomes).length;
  /**
   * Free members are stopped by their daily allowance; premium members only see
   * this screen once the whole queue is clear.
   */
  const completionKind: CompletionKind =
    plan === "free" ? "daily-limit" : "caught-up";
  /** Free member who has already worked through today's allowance. */
  const outOfPuzzles =
    plan === "free" && played && finishedThisSession >= FREE_DAILY_LIMIT;
  /**
   * The next theme still holding puzzles this member hasn't solved cleanly —
   * the natural thing to offer once a theme is cleared.
   */
  const nextCategory = React.useMemo(() => {
    const order = categories.map((c) => c.category);
    const from = sessionCat ? order.indexOf(sessionCat) + 1 : 0;
    const rotated = [...order.slice(from), ...order.slice(0, Math.max(0, from))];
    return (
      rotated.find((cat) =>
        queue.some(
          (p) => p.category === cat && record[p.id] !== "solved-clean",
        ),
      ) ?? null
    );
  }, [sessionCat, record, categories, queue]);
  /** Recap shown when returning to the start screen mid-queue. */
  const startProgress = played
    ? {
        done: solvedTotal,
        left: Math.max(0, queueTotal - attemptedTotal),
        replay: unsolvedCount,
        total: queueTotal,
        locked: outOfPuzzles,
      }
    : undefined;

  React.useEffect(
    () => () => {
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
    },
    [],
  );

  /**
   * The mistake plays itself out once when a puzzle opens: the losing move
   * slides onto the board, holds for a beat, then rewinds to the moment before
   * it. Testers shown only a red arrow read it as an instruction and replayed
   * the blunder — watching the move happen *and be taken back* makes it
   * unmistakably history, and leaves the board on "your turn".
   */
  const [replay, setReplay] = React.useState<"before" | "forward" | "back" | "done">(
    "done",
  );
  React.useEffect(() => {
    // Only the untouched start of an unsolved puzzle has a mistake to replay.
    if (view !== "run" || !puzzle || solved || reachedPly !== 0) {
      setReplay("done");
      return;
    }
    setReplay("before");
    const t = [
      setTimeout(() => setReplay("forward"), 450),
      setTimeout(() => setReplay("back"), 1550),
      setTimeout(() => setReplay("done"), 2050),
    ];
    return () => t.forEach(clearTimeout);
    // Deliberately not keyed on `wrong` — a failed attempt shouldn't rewind the
    // board and make the solver watch the whole intro again.
  }, [view, puzzle, solved, reachedPly]);

  // Advancing the live position clears the transient hint/wrong state.
  React.useEffect(() => {
    setHintLevel(0);
    setWrong(false);
  }, [reachedPly, index]);

  // Opponent replies auto-play as the engine's best; "Show solution" plays all.
  // (Snaps the view to the live edge so the reply is seen.)
  React.useEffect(() => {
    if (view !== "run" || !puzzle) return;
    if (outcomes[puzzle.id]) return; // solved — allow manual move scrubbing
    const rp = Math.min(reached[puzzle.id] ?? 0, puzzle.line.length);
    const nextPly = puzzle.line[rp];
    if (!nextPly) return; // reached the end of the line
    if (nextPly.side === userSide && !revealing) return; // wait for the user
    const t = setTimeout(() => {
      setReached((prev) => ({
        ...prev,
        [puzzle.id]: Math.min((prev[puzzle.id] ?? 0) + 1, puzzle.line.length),
      }));
      setViewPly(rp + 1);
    }, revealing ? 430 : 520);
    return () => clearTimeout(t);
  }, [view, puzzle, reached, revealing, userSide, outcomes]);

  // Record the outcome once the whole line has been reached.
  React.useEffect(() => {
    if (!puzzle || puzzle.line.length === 0) return;
    if ((reached[puzzle.id] ?? 0) < puzzle.line.length) return;
    const outcome: Outcome = revealing
      ? "failed"
      : assisted || erred[puzzle.id]
        ? "solved-hint"
        : "solved-clean";

    setOutcomes((prev) =>
      prev[puzzle.id] ? prev : { ...prev, [puzzle.id]: outcome },
    );
    // The shared record keeps the *best* attempt, so replaying a puzzle you
    // needed a hint for and getting it clean is an upgrade, never a downgrade.
    recordOutcome(puzzle.id, outcome);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reached, puzzle]);

  /** Load a set of puzzles and reset every per-session flag. */
  const beginSession = (
    puzzles: SolvePuzzle[],
    category: PuzzleCategory | null,
  ) => {
    setSession(puzzles);
    setSessionCat(category);
    setIndex(0);
    setOutcomes({});
    setReached({});
    setErred({});
    setViewPly(0);
    setRevealing(false);
    setHintLevel(0);
    setAssisted(false);
    setShakeSignal(0);
    setWrong(false);
    if (wrongTimer.current) clearTimeout(wrongTimer.current);
    setCompleteOpen(false);
    setPlayed(true);
    setView("run");
  };

  const start = (category: PuzzleCategory | null) => {
    // Out of puzzles for today — Solve shows the paywall rather than a position.
    if (outOfPuzzles) {
      setCompleteOpen(true);
      return;
    }
    const q = category ? queue.filter((p) => p.category === category) : queue;
    const pool = q.length ? q : queue;
    // The queue is never trimmed for free members: they should see all of it —
    // and how far in the wall sits. `dailyLimit` is what actually stops them.
    beginSession(pool, q.length ? category : null);
  };

  /**
   * "Solve" from a row of the archive deals that game's puzzles straight away,
   * rather than dropping the member on the start screen to find them again.
   * They may not exist yet — asking for them puts that game to the front of the
   * engine's queue, and the session opens the moment the first one lands.
   */
  const autoStarted = React.useRef(false);
  React.useEffect(() => {
    if (gameFilter) requestPuzzles(gameFilter);
  }, [gameFilter, requestPuzzles]);

  React.useEffect(() => {
    if (!gameFilter || autoStarted.current) return;
    const forGame = gamePuzzles[gameFilter] ?? [];
    if (forGame.length === 0) return;
    autoStarted.current = true;
    beginSession(forGame, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameFilter, gamePuzzles]);

  /**
   * The engine has been through that game and found nothing worth replaying.
   * An empty entry means "looked, nothing there" — a missing one means it is
   * still looking.
   */
  const gameHadNothing = !!gameFilter && gamePuzzles[gameFilter]?.length === 0;

  /** The X, the backdrop and "Back to Puzzles" all land back on the start screen. */
  const closeToStart = () => {
    setCompleteOpen(false);
    setView("start");
  };

  /**
   * Upgrading happens in place: the session, the outcomes and the position in
   * the queue all survive, so after the celebration the member carries on at the
   * puzzle the paywall stopped them at rather than starting over.
   */
  const goPremium = () => {
    setPlan("premium");
    setCompleteOpen(false);
    setUpgrading(true);
  };

  const afterUpgrade = () => {
    setUpgrading(false);
    if (index < session.length - 1) gotoPuzzle(index + 1);
    setView("run");
  };

  /** Re-run only the puzzles that needed a hint, a reveal, or a wrong guess. */
  const retryUnsolved = () => {
    const again = queue.filter(
      (p) => record[p.id] && record[p.id] !== "solved-clean",
    );
    beginSession(again.length ? again : session, sessionCat);
  };

  /** Move on to the next theme that still has puzzles to clean up. */
  const solveNextCategory = () => {
    if (nextCategory) start(nextCategory);
  };

  const onMove = (from: string, to: string) => {
    if (!puzzle || !userTurn) return;
    const expected = line[reachedPly];
    if (expected && expected.from === from && expected.to === to) {
      setWrong(false);
      setReached((prev) => ({
        ...prev,
        [puzzle.id]: Math.min((prev[puzzle.id] ?? 0) + 1, line.length),
      }));
      setViewPly(reachedPly + 1); // the effect then auto-plays the reply
    } else {
      setErred((prev) => ({ ...prev, [puzzle.id]: true }));
      setShakeSignal((s) => s + 1);
      setWrong(true);
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
      wrongTimer.current = setTimeout(() => setWrong(false), 2200);
    }
  };

  const hint = () => {
    if (!userTurn) return;
    setHintLevel((l) => Math.min(2, l + 1));
    setAssisted(true);
  };
  const reveal = () => {
    if (!puzzle || solved) return;
    setAssisted(true);
    setRevealing(true); // auto-plays the remaining line; records as "failed"
  };
  // ←/→ scrub the moves played so far (works while solving AND after).
  const stepBack = () => setViewPly(Math.max(0, vp - 1));
  const stepFwd = () => setViewPly(Math.min(reachedPly, vp + 1));

  const retry = () => {
    if (!puzzle) return;
    setOutcomes((prev) => {
      const next = { ...prev };
      delete next[puzzle.id];
      return next;
    });
    setReached((prev) => ({ ...prev, [puzzle.id]: 0 }));
    setErred((prev) => ({ ...prev, [puzzle.id]: false }));
    setViewPly(0);
    setRevealing(false);
    setHintLevel(0);
    setAssisted(false);
    setWrong(false);
  };
  // Switch puzzles (the footer arrows), restoring that puzzle's own progress.
  const gotoPuzzle = (i: number) => {
    const p = session[i];
    const rp = p
      ? Math.min(reached[p.id] ?? (outcomes[p.id] ? p.line.length : 0), p.line.length)
      : 0;
    setIndex(i);
    setViewPly(rp);
    setRevealing(false);
    setHintLevel(0);
    setAssisted(false);
    setWrong(false);
    // A fresh puzzle starts with a clean slate — no carried-over shake.
    setShakeSignal(0);
    if (wrongTimer.current) clearTimeout(wrongTimer.current);
  };
  const next = () => {
    if (index < dailyLimit - 1) gotoPuzzle(index + 1);
    else setCompleteOpen(true);
  };

  // Keyboard: ←/→ step through the moves (any time); Enter → next puzzle when
  // solved; H → hint while solving.
  React.useEffect(() => {
    if (view !== "run") return;
    // While the completion card or the upgrade celebration is up, the board is
    // behind a modal: arrows must not scrub a position the user can't see.
    // Escape stays with the modal, which owns its own handler.
    if (completeOpen || upgrading) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        stepBack();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        stepFwd();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (solved) next();
      } else if (e.key.toLowerCase() === "h") {
        e.preventDefault();
        hint();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, index, solved, reachedPly, viewPly, userTurn, completeOpen, upgrading]);

  /** The opponent's real profile, when they are someone this member plays often. */
  const opponentProfile = puzzle
    ? opponents.find(
        (o) => o.username.toLowerCase() === puzzle.opponent.toLowerCase(),
      )
    : undefined;
  const opponent: PlayerRef | null = puzzle
    ? {
        username: puzzle.opponent,
        rating: puzzle.opponentRating,
        color: userSide === "white" ? "black" : "white",
        // The sample set is authored with a flag; a real opponent only gets one
        // if Chess.com actually publishes their country.
        countryFlag: live
          ? flagOf(opponentProfile?.country ?? undefined) || undefined
          : "🇮🇳",
      }
    : null;
  // The opponent's reply is auto-playing (between your move and theirs).
  const opponentThinking =
    puzzle != null &&
    !solved &&
    !revealing &&
    atLive &&
    reachedPly < line.length &&
    line[reachedPly]?.side !== userSide;

  // ---- Board decoration (arrows / highlights) for the solving board.
  const arrows: BoardArrow[] = [];
  const hintSquares: string[] = [];
  let highlight: string[] = [];
  let ghost: { square: string; piece: string } | null = null;
  const replaying = replay !== "done";
  if (puzzle) {
    if (vp === 0) {
      highlight = [puzzle.played.from, puzzle.played.to];
      if (!solved) {
        // The move actually played, marked as rejected: a red arrow to a faded,
        // crossed-out piece on the square it reached. Both land only after the
        // replay has finished, so nothing competes with the move itself.
        if (!replaying) {
          arrows.push({
            from: puzzle.played.from,
            to: puzzle.played.to,
            tone: "orange",
          });
          const moved = pieceAt(puzzle.fen, puzzle.played.from);
          if (moved) ghost = { square: puzzle.played.to, piece: moved };
        }
      }
    } else if (vp > 0) {
      const last = line[vp - 1];
      highlight = [last.from, last.to];
      // Show the move that reached this position (teal) when solved or reviewing.
      if (solved || vp < reachedPly)
        arrows.push({ from: last.from, to: last.to, tone: "teal" });
    }
    // Per-move hint for the move the user is currently looking for (live only).
    if (userTurn && line[reachedPly]) {
      if (hintLevel >= 1) hintSquares.push(line[reachedPly].from);
      if (hintLevel >= 2)
        arrows.push({
          from: line[reachedPly].from,
          to: line[reachedPly].to,
          tone: "teal",
        });
    }
  }
  /** A mating line ends the game on the board, not just the puzzle. */
  const shownPly = vp > 0 ? line[vp - 1] : null;
  const gameEnd =
    shownPly?.isMate && replay === "done" ? { winner: shownPly.side } : null;

  // What the board is actually showing — the intro replay borrows it briefly.
  const boardFen =
    replay === "forward" && playedFen ? playedFen : currentFen;
  const dangerSquare = checkedKingSquare(boardFen);

  /**
   * The "what you gave up" anchor belongs to the moment before the first move.
   * Once the line is under way the bar just tracks it: a dip on move three is
   * the line breathing (the opponent's reply, a quiet in-between move), not
   * advantage being thrown away — and painting that red read as a fresh mistake.
   */
  const anchorPeak = vp === 0 && !solved;

  const barLabel = evalLabel(shownCp, shownMate, shownMate === 0, userSide);
  const peakLabel = evalLabel(
    peakEval.cp,
    peakEval.mate,
    peakEval.mate === 0,
    userSide,
  );
  // The brief describes the drop as it stood before the first move; the bar has
  // moved on by the time the solver is into the line, so the number is pinned.
  const dropLabel = React.useRef(barLabel);
  if (vp === 0 && reachedPly === 0) dropLabel.current = barLabel;

  /** Where the whole line lands — the payoff shown on the solved card. */
  const lastPly = line[line.length - 1];
  const finalLabel = lastPly
    ? evalLabel(lastPly.cp, lastPly.mate, lastPly.mate === 0, userSide)
    : barLabel;

  /** The solver's own moves found so far — one "is correct!" row each. */
  const foundSans = line
    .slice(0, reachedPly)
    .filter((p) => p.side === userSide)
    .map((p) => p.san);

  /** The coach's opening line, describing the queue that is actually loaded. */
  const intro =
    gameFilter && gameHadNothing
      ? "Nothing worth replaying in that game — you kept it clean. Here's today's set instead."
      : gameFilter && !autoStarted.current
        ? "Looking through that game for the moments worth replaying…"
        : !live
          ? coachIntro
          : mining
            ? `${queue.length} ready so far — still reviewing your games for more.`
            : `${queue.length} puzzles from the mistakes in your recent games.`;

  const coachText = !puzzle
    ? intro
    : solved
      ? puzzle.solvedLine
      : !atLive
        ? "Reviewing the line — press → to return to your move."
        : wrong
          ? "Not quite — that isn't the move. Take another look."
          : reachedPly === 0
            ? puzzle.prompt
            : "Good move! Now find the next one in the line.";

  const backTo = (): void => {
    if (view === "run") setView("start");
    else router.push("/puzzles");
  };

  return (
    <div className="flex flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
      <h1 className="sr-only">Game Based Puzzles</h1>

      {/* LEFT — board */}
      <div className="flex min-h-0 flex-1 flex-col justify-center px-3 py-4 sm:px-5 lg:h-screen lg:py-5">
        {view === "start" ? (
          <div className="mx-auto aspect-square w-full max-w-[min(100%,calc(100vh-6rem))]">
            <MiniBoard
              fen={START_FEN}
              orientation="white"
              showCoordinates
              className="h-full w-full shadow-raised"
            />
          </div>
        ) : view === "run" && puzzle && opponent ? (
          <div className="mx-auto flex w-full max-w-[min(100%,calc(100vh-9rem))] flex-col justify-center gap-2 sm:gap-3">
            <PlayerRow
              player={opponent}
              thinking={opponentThinking}
              avatar={opponentProfile?.avatar}
            />
            <div className="flex min-h-0 items-stretch justify-center gap-1.5 sm:gap-2">
              <PuzzleEvalBar
                key={puzzle.id}
                cp={shownCp}
                label={evalLabel(shownCp, shownMate, shownMate === 0, userSide)}
                peakCp={anchorPeak ? peakEval.cp : undefined}
                peakLabel={anchorPeak ? peakLabel : undefined}
                loop={anchorPeak}
                step={`${puzzle.id}:${vp}`}
                isUserMove={vp > 0 && line[vp - 1]?.side === userSide}
                ready={barReady}
                className="w-5 shrink-0 sm:w-6"
              />
              <div className="aspect-square min-h-0 flex-1">
                <PuzzleBoard
                  key={puzzle.id}
                  fen={boardFen}
                  orientation={userSide}
                  playerSide={userSide}
                  interactive={userTurn && !replaying}
                  onMove={onMove}
                  highlight={highlight}
                  dangerSquare={dangerSquare}
                  gameEnd={gameEnd}
                  hint={hintSquares}
                  arrows={arrows}
                  ghost={ghost}
                  shakeSignal={shakeSignal}
                  lastMove={
                    // During the intro the mistake slides on, then slides back.
                    replay === "forward"
                      ? { from: puzzle.played.from, to: puzzle.played.to }
                      : replay === "back"
                        ? { from: puzzle.played.to, to: puzzle.played.from }
                        : atLive && !solved && vp > 0
                          ? { from: line[vp - 1].from, to: line[vp - 1].to }
                          : null
                  }
                  className="h-full w-full shadow-raised"
                />
              </div>
            </div>
            <PlayerRow player={me(userSide)} isUser avatar={profile?.avatar} />
          </div>
        ) : (
          // completion — show the last solved position behind
          <div className="mx-auto w-full max-w-[min(100%,calc(100vh-9rem))]">
            <MiniBoard
              fen={lastSolvedFen}
              orientation={userSide}
              showCoordinates
              className="w-full shadow-raised"
            />
          </div>
        )}
      </div>

      {/* RIGHT — panel */}
      <aside className="flex w-full shrink-0 flex-col border-t border-line/60 bg-surface lg:h-screen lg:w-[500px] lg:border-l lg:border-t-0">
        <PanelHeader onBack={backTo} />

        {view === "start" && (
          <StartView
            onStart={start}
            progress={startProgress}
            categories={categories}
            intro={intro}
            total={queueTotal}
          />
        )}

        {view === "run" && puzzle && (
          <>
            {/* Which game this came from, then the coach — Figma's order. */}
            <div className="shrink-0 space-y-6 px-6 pb-6 pt-6">
              <ClassificationTag puzzle={puzzle} />
              <CoachBubble text={coachText} />
            </div>

            {/* Fills the panel while a puzzle is open, then gets out of the way
                so the footer sits where it always does. */}
            <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
              <PuzzleBrief
                puzzle={puzzle}
                userSide={userSide}
                solved={solved}
                outcome={outcomes[puzzle.id] ?? "solved-clean"}
                replaying={replaying}
                found={foundSans}
                wasLabel={peakLabel}
                nowLabel={dropLabel.current}
                toLabel={finalLabel}
              />
            </div>

            {/* Footer — progress, action buttons, nav */}
            <div className="shrink-0 space-y-3 border-t border-line/40 bg-black/[0.14] px-5 pb-4 pt-4">
              <ProgressRow completed={index + 1} total={session.length} />

              {/* Move stepper — review the line's moves any time (← / →) */}
              {reachedPly >= 1 && (
                <div className="flex items-center justify-center gap-2 text-xs font-semibold text-ink-soft">
                  <button
                    type="button"
                    aria-label="Previous move"
                    onClick={stepBack}
                    disabled={vp === 0}
                    className="grid size-7 place-items-center rounded-[5px] transition-colors hover:bg-white/[0.06] hover:text-ink disabled:pointer-events-none disabled:opacity-40"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <span className="min-w-[64px] text-center tabular-nums">
                    {vp === 0 ? "Start" : `Move ${vp} / ${line.length}`}
                  </span>
                  <button
                    type="button"
                    aria-label="Next move"
                    onClick={stepFwd}
                    disabled={vp >= reachedPly}
                    className="grid size-7 place-items-center rounded-[5px] transition-colors hover:bg-white/[0.06] hover:text-ink disabled:pointer-events-none disabled:opacity-40"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              )}

              {solved ? (
                <div className="flex items-stretch gap-2">
                  <button
                    type="button"
                    aria-label="Retry puzzle"
                    onClick={retry}
                    className={cn(DARK_BTN, "w-14 shrink-0")}
                  >
                    <RotateCcw />
                  </button>
                  {/* Analysis is out of scope for the prototype, but a greyed
                      button reads as broken in a walkthrough — so it keeps its
                      normal weight and simply doesn't respond. */}
                  <div
                    role="button"
                    aria-disabled="true"
                    tabIndex={-1}
                    aria-label="Analyse with the engine (coming soon)"
                    title="Engine analysis — coming soon"
                    className={cn(DARK_BTN, "w-14 shrink-0 cursor-default")}
                  >
                    {/* Chess.com's game-analysis glyph, not a search magnifier. */}
                    <Image src={ICON.analysis} width={22} height={22} alt="" />
                  </div>
                  <button
                    type="button"
                    onClick={next}
                    className={cn(GREEN_BTN, "flex-1")}
                  >
                    {/* Reads against the whole queue, not the daily allowance:
                        a free member on 3/8 still has puzzles ahead, so the
                        button says "Next" and it's the paywall card that
                        explains why it stops there. Only a genuinely empty
                        queue says "Finish". */}
                    {index < session.length - 1 ? (
                      <>
                        Next <ArrowRight />
                      </>
                    ) : (
                      <>
                        Finish <Check />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="flex items-stretch gap-2">
                  {hintLevel === 0 && (
                    <button
                      type="button"
                      onClick={hint}
                      disabled={!userTurn}
                      className={cn(DARK_BTN, "flex-1")}
                    >
                      <Lightbulb /> Hint
                    </button>
                  )}
                  {hintLevel === 1 && (
                    <button
                      type="button"
                      onClick={hint}
                      disabled={!userTurn}
                      className={cn(DARK_BTN, "flex-1")}
                    >
                      <HelpCircle /> Show move
                    </button>
                  )}
                  {hintLevel === 2 && (
                    <button
                      type="button"
                      onClick={reveal}
                      disabled={!userTurn}
                      className={cn(DARK_BTN, "flex-1")}
                    >
                      <Search /> Show solution
                    </button>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tabular-nums text-ink-faint">
                  Puzzle {index + 1} / {session.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Previous puzzle"
                    onClick={() => gotoPuzzle(index - 1)}
                    disabled={index === 0}
                    className="grid size-8 place-items-center rounded-[5px] text-ink-soft transition-colors hover:bg-white/[0.06] hover:text-ink disabled:pointer-events-none disabled:opacity-40"
                  >
                    <ChevronsLeft className="size-[18px]" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next puzzle"
                    onClick={() => gotoPuzzle(index + 1)}
                    disabled={index >= dailyLimit - 1}
                    className="grid size-8 place-items-center rounded-[5px] text-ink-soft transition-colors hover:bg-white/[0.06] hover:text-ink disabled:pointer-events-none disabled:opacity-40"
                  >
                    <ChevronsRight className="size-[18px]" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </aside>

      {completeOpen && (
        <CompletionModal
          kind={completionKind}
          solvedClean={solvedClean}
          solvedTotal={solvedTotal}
          attempted={attemptedTotal}
          unsolved={unsolvedCount}
          queueTotal={queueTotal}
          nextCategoryLabel={
            nextCategory
              ? // The plural theme label ("Mistakes"), matching the list on the
                // start screen rather than the singular tag used on the board.
                (categories.find((c) => c.category === nextCategory)?.label ??
                CATEGORY_LABEL[nextCategory])
              : null
          }
          nextCategoryIcon={
            nextCategory
              ? CATEGORY_ICON[nextCategory]
              : null
          }
          onSolveNextCategory={solveNextCategory}
          onRetryUnsolved={retryUnsolved}
          onReplay={() => beginSession(session, sessionCat)}
          onExit={closeToStart}
          onUpgrade={goPremium}
        />
      )}

      {upgrading && <UpgradeTransition onDone={afterUpgrade} />}
    </div>
  );
}
