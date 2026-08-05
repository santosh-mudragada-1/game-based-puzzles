"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
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
import { GAME_ICON, moveTypeIcon } from "@/lib/assets";
import { currentUser } from "@/data";
import {
  solvePuzzles,
  puzzleCategoryStats,
  puzzleProgress,
  coachIntro,
  CATEGORY_LABEL,
  CATEGORY_MOVE_ICON,
  FREE_DAILY_LIMIT,
} from "@/data/solve-puzzles";
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
import { checkedKingSquare, evalLabel, fenAfterMove } from "@/lib/puzzle";
import { useEngineEval } from "@/hooks/use-engine-eval";
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
}: {
  player: PlayerRef;
  isUser?: boolean;
  thinking?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Avatar size={34} rounded="md" alt={`${player.username} avatar`} />
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
              : coachIntro
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
          {puzzleCategoryStats.map((c) => (
            <button
              key={c.category}
              type="button"
              onClick={() => onStart(c.category)}
              className="group flex w-full items-center gap-3 rounded-[8px] px-3 py-2.5 text-left transition-colors hover:bg-white/[0.06]"
            >
              <Image
                src={moveTypeIcon(CATEGORY_MOVE_ICON[c.category])}
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
          completed={progress ? progress.done : puzzleProgress.completed}
          total={progress ? progress.total : puzzleProgress.total}
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
        src={moveTypeIcon(CATEGORY_MOVE_ICON[puzzle.category])}
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
        href={`/review?ply=${puzzle.reviewPly}`}
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
  const [view, setView] = React.useState<View>("start");
  /** The end-of-session celebration, shown over the finished puzzle. */
  const [completeOpen, setCompleteOpen] = React.useState(false);
  /** Plays once after upgrading, before the queue resumes. */
  const [upgrading, setUpgrading] = React.useState(false);
  /** True once a run has happened, so the start screen can recap it. */
  const [played, setPlayed] = React.useState(false);
  const [session, setSession] = React.useState<SolvePuzzle[]>(solvePuzzles);
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
  const barFen = vp === 0 ? playedFen : line[vp - 1].fen;
  const authoredCurrent =
    vp === 0
      ? { cp: puzzle?.start.cp ?? 0, mate: puzzle?.start.mate ?? null }
      : { cp: line[vp - 1].cp, mate: line[vp - 1].mate };
  const barEval = useEngineEval(barFen, userSide, {
    enabled: view === "run" && puzzle != null,
    fallback: authoredCurrent,
    resetKey: puzzle?.id,
  });

  // The opening drop only plays once both numbers are real. Past the first move
  // the bar just tracks the line, so it never holds again mid-puzzle.
  const barReady =
    vp > 0 ||
    ((peakEval.settled || peakEval.failed) &&
      (barEval.settled || barEval.failed));

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
    const order = puzzleCategoryStats.map((c) => c.category);
    const from = sessionCat ? order.indexOf(sessionCat) + 1 : 0;
    const rotated = [...order.slice(from), ...order.slice(0, Math.max(0, from))];
    return (
      rotated.find((cat) =>
        solvePuzzles.some(
          (p) => p.category === cat && record[p.id] !== "solved-clean",
        ),
      ) ?? null
    );
  }, [sessionCat, record]);
  /** Recap shown when returning to the start screen mid-queue. */
  const startProgress = played
    ? {
        done: solvedTotal,
        left: Math.max(0, puzzleProgress.total - attemptedTotal),
        replay: unsolvedCount,
        total: puzzleProgress.total,
        locked: outOfPuzzles,
      }
    : undefined;

  React.useEffect(
    () => () => {
      if (wrongTimer.current) clearTimeout(wrongTimer.current);
    },
    [],
  );

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
    const q = category
      ? solvePuzzles.filter((p) => p.category === category)
      : solvePuzzles;
    const pool = q.length ? q : solvePuzzles;
    // The queue is never trimmed for free members: they should see all of it —
    // and how far in the wall sits. `dailyLimit` is what actually stops them.
    beginSession(pool, q.length ? category : null);
  };

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
    const again = solvePuzzles.filter(
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

  const opponent: PlayerRef | null = puzzle
    ? {
        username: puzzle.opponent,
        rating: puzzle.opponentRating,
        color: userSide === "white" ? "black" : "white",
        countryFlag: "🇮🇳",
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
  if (puzzle) {
    if (vp === 0) {
      // The move actually played, as context (orange), on the starting position.
      arrows.push({ from: puzzle.played.from, to: puzzle.played.to, tone: "orange" });
      highlight = [puzzle.played.from, puzzle.played.to];
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
  const dangerSquare = checkedKingSquare(currentFen);

  const coachText = !puzzle
    ? coachIntro
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
            <PlayerRow player={opponent} thinking={opponentThinking} />
            <div className="flex min-h-0 items-stretch justify-center gap-1.5 sm:gap-2">
              <PuzzleEvalBar
                key={puzzle.id}
                cp={barEval.cp}
                label={evalLabel(
                  barEval.cp,
                  barEval.mate,
                  barEval.mate === 0,
                  userSide,
                )}
                peakCp={peakEval.cp}
                peakLabel={evalLabel(
                  peakEval.cp,
                  peakEval.mate,
                  peakEval.mate === 0,
                  userSide,
                )}
                loop={!solved}
                step={`${puzzle.id}:${vp}`}
                isUserMove={vp > 0 && line[vp - 1]?.side === userSide}
                ready={barReady}
                className="w-5 shrink-0 sm:w-6"
              />
              <div className="aspect-square min-h-0 flex-1">
                <PuzzleBoard
                  key={puzzle.id}
                  fen={currentFen}
                  orientation={userSide}
                  playerSide={userSide}
                  interactive={userTurn}
                  onMove={onMove}
                  highlight={highlight}
                  dangerSquare={dangerSquare}
                  hint={hintSquares}
                  arrows={arrows}
                  shakeSignal={shakeSignal}
                  lastMove={
                    atLive && !solved && vp > 0
                      ? { from: line[vp - 1].from, to: line[vp - 1].to }
                      : null
                  }
                  className="h-full w-full shadow-raised"
                />
              </div>
            </div>
            <PlayerRow player={mePlayer(userSide)} isUser />
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
          <StartView onStart={start} progress={startProgress} />
        )}

        {view === "run" && puzzle && (
          <>
            {/* Coach + classification tag */}
            <div className="shrink-0 space-y-3 border-b border-line/40 px-5 pb-4 pt-4">
              <CoachBubble text={coachText} />
              <ClassificationTag puzzle={puzzle} />
              {vp === 0 && !solved && reachedPly === 0 && (
                <p className="flex items-center gap-1.5 text-[12px] text-ink-faint">
                  <span className="inline-block h-[3px] w-4 rounded-full bg-[#f0810f]" />
                  The orange arrow is the move you played — find a stronger one.
                </p>
              )}
            </div>

            {/* Spacer keeps the footer pinned to the bottom like the review panel */}
            <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin" />

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
                  <button
                    type="button"
                    disabled
                    aria-label="Analyse with the engine (coming soon)"
                    title="Engine analysis — coming soon"
                    className={cn(DARK_BTN, "w-14 shrink-0")}
                  >
                    <Search />
                  </button>
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
          queueTotal={puzzleProgress.total}
          nextCategoryLabel={
            nextCategory
              ? // The plural theme label ("Mistakes"), matching the list on the
                // start screen rather than the singular tag used on the board.
                (puzzleCategoryStats.find((c) => c.category === nextCategory)
                  ?.label ?? CATEGORY_LABEL[nextCategory])
              : null
          }
          nextCategoryIcon={
            nextCategory
              ? moveTypeIcon(CATEGORY_MOVE_ICON[nextCategory])
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
