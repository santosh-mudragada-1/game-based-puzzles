"use client";

import * as React from "react";
import Image from "next/image";
import { Heart, Lightbulb, ArrowLeft, ArrowRight, Share2 } from "lucide-react";

import { ICON, moveTypeIcon } from "@/lib/assets";
import { usePlan } from "@/hooks/use-plan";
import { Toast } from "@/components/shared/toast";
import { ReviewBoard } from "@/components/review/review-board";
import { PlaybackControls } from "@/components/review/playback-controls";
import { CoachBubble } from "@/components/review/coach-bubble";
import { EvalGraph } from "@/components/review/eval-graph";
import { TrainingList, TRAINING_ROWS } from "@/components/review/training-list";
import { evalBarLabel } from "@/components/review/eval-bar";
import { MoveListNav } from "@/components/review/move-list-nav";
import { OverviewStats } from "@/components/review/overview-stats";
import { ReviewBottomBar } from "@/components/review/review-bottom-bar";
import {
  reviewModel,
  notablePliesOf,
  suggestBestMove,
  type ReviewPly,
  type ReviewModel,
} from "@/lib/pgn";
import type { MoveClassification, PieceColor } from "@/types";
import { cn } from "@/lib/utils";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/** The pill beside the coach line — same wording as the bar. */
function formatEval(ply: ReviewPly): string {
  const result = ply.san.endsWith("#")
    ? ply.side === "white"
      ? "1-0"
      : "0-1"
    : null;
  return evalBarLabel(ply.evalCp / 100, ply.evalMate, result);
}

/** One-line coach commentary for a played move. */
function moveCommentary(ply: ReviewPly): string {
  const { san, side } = ply;
  const opp = side === "white" ? "Black" : "White";
  switch (ply.classification) {
    case "book":
      return `${san} is a book move — still following known opening theory.`;
    case "brilliant":
      return `${san} is brilliant! A stunning resource that's easy to miss.`;
    case "great":
      return `${san} is a great move, seizing exactly the right moment.`;
    case "best":
      return `${san} is best — nothing here is more precise.`;
    case "excellent":
      return `${san} is an excellent move, keeping everything on track.`;
    case "good":
      return `${san} is a good, solid move.`;
    case "inaccuracy":
      return `${san} is an inaccuracy — a slightly sharper option was available.`;
    case "mistake":
      return `${san} is a mistake; it hands ${opp} the initiative.`;
    case "missed":
      return `${san} misses a stronger continuation that was on the board.`;
    case "blunder":
      return `${san} is a blunder that drops material — a moment to study.`;
  }
}

/** Expanded "Explain" text — phrased for whose move it was. */
function moveExplanation(ply: ReviewPly, userSide: PieceColor): string {
  const mine = ply.side === userSide;
  const subj = mine ? "You" : "Your opponent";
  switch (ply.classification) {
    case "brilliant":
      return `${subj} found a brilliant, hard-to-see resource — usually a sacrifice that wins by force.`;
    case "great":
      return `${subj} found a great move — practically the only one that holds everything together.`;
    case "best":
      return `${subj} played the best move. The engine agrees there was nothing more accurate here.`;
    case "excellent":
      return `${subj} kept things on the rails — a hair short of the very best, but fully sound.`;
    case "good":
      return `${subj} played a good, solid move that doesn't give anything away.`;
    case "book":
      return `Still theory — this is a well-known book move from the opening.`;
    case "inaccuracy":
      return `${subj} loosened the grip a little; a more testing continuation kept the pressure on.`;
    case "mistake":
      return `${subj} let the initiative slip. Keeping the pieces coordinated and the king safe came first.`;
    case "missed":
      return `A stronger idea was on the board — usually a tactic or a more active piece. Slowing down to calculate pays off here.`;
    case "blunder":
      return `${subj} allowed a decisive tactic and dropped material. This exact position is a great one to drill as a puzzle.`;
  }
}

type TopAction = "best" | "explain" | "share" | "next";

/** Which action buttons sit above the move list, per the played move's quality. */
function topActions(c: MoveClassification): TopAction[] {
  if (c === "book") return ["next"];
  if (c === "best") return ["explain", "next"];
  if (c === "brilliant" || c === "great") return ["share", "next"];
  return ["best", "explain", "next"];
}

function TopButton({
  green,
  active,
  icon,
  label,
  onClick,
}: {
  green?: boolean;
  active?: boolean;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex h-11 flex-1 items-center justify-center gap-2 rounded-[8px] text-[15px] font-bold transition active:translate-y-px [&_svg]:size-[18px]",
        green
          ? "bg-gradient-to-b from-brand to-[#5d9948] text-white shadow-[0_1px_2px_rgba(0,0,0,0.16),inset_0_-1px_0_0_#45753c] hover:brightness-[1.04]"
          : cn(
              "bg-[#3a3734] text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_2px_rgba(0,0,0,0.25)] hover:bg-[#454240]",
              active && "ring-1 ring-inset ring-brand",
            ),
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function PanelHeader({
  showBack,
  onBack,
}: {
  showBack?: boolean;
  onBack?: () => void;
}) {
  const iconBtn =
    "grid size-9 place-items-center rounded-[6px] text-ink-soft transition-colors hover:bg-white/[0.06] hover:text-ink";
  return (
    <div className="relative flex items-center border-b border-line/50 bg-black/[0.14] px-3 py-2">
      {/* Left cluster: back (while reviewing) + favorite */}
      <div className="flex items-center gap-0.5">
        {showBack ? (
          <button
            type="button"
            aria-label="Back to overview"
            onClick={onBack}
            className={iconBtn}
          >
            <ArrowLeft className="size-5" />
          </button>
        ) : null}
        <button type="button" aria-label="Save game" className={iconBtn}>
          <Heart className="size-5" />
        </button>
      </div>

      {/* Centered title */}
      <h2 className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 items-center gap-2 font-display text-[17px] font-semibold text-white/90">
        <Image src={ICON.gameReview} width={24} height={24} alt="" />
        Game Review
      </h2>

      {/* Right: go-to-analysis (self analysis) only on the overview */}
      <div className="ml-auto">
        {showBack ? null : (
          <button type="button" aria-label="Go to analysis" className={iconBtn}>
            <span
              aria-hidden="true"
              className="size-5 bg-current"
              style={{
                maskImage: "url(/misc/analysis.svg)",
                WebkitMaskImage: "url(/misc/analysis.svg)",
                maskSize: "contain",
                WebkitMaskSize: "contain",
                maskRepeat: "no-repeat",
                WebkitMaskRepeat: "no-repeat",
                maskPosition: "center",
                WebkitMaskPosition: "center",
              }}
            />
          </button>
        )}
      </div>
    </div>
  );
}

export function GameReview({
  model = reviewModel,
  /** Shown while a game pulled off Chess.com is still being analysed. */
  analysing,
  /** The archived game this is, so the end-of-review list can link to its puzzles. */
  gameId,
}: {
  model?: ReviewModel;
  analysing?: { done: number; total: number } | null;
  gameId?: string;
} = {}) {
  const { setPlan } = usePlan();
  const N = model.plies.length;
  const notablePlies = React.useMemo(() => notablePliesOf(model), [model]);
  const [currentPly, setCurrentPly] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  // When set, autoplay stops once this ply is reached ("play to next important").
  const [playTarget, setPlayTarget] = React.useState<number | null>(null);
  const [bestShown, setBestShown] = React.useState(false);
  const [explainShown, setExplainShown] = React.useState(false);
  const [toast, setToast] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState("");
  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const seek = React.useCallback((p: number) => {
    setPlaying(false);
    setPlayTarget(null);
    setCurrentPly(Math.max(0, Math.min(N, p)));
  }, []);

  // Deep-link a starting ply, e.g. /review?ply=45 jumps to a critical moment.
  React.useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("ply");
    if (p == null) return;
    const n = Number.parseInt(p, 10);
    if (!Number.isNaN(n)) setCurrentPly(Math.max(0, Math.min(N, n)));
  }, []);

  // Keyboard navigation: arrows step through the game (which reveals this
  // per-move review UI), space toggles autoplay.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable)
      )
        return;
      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          seek(currentPly + 1);
          break;
        case "ArrowLeft":
          e.preventDefault();
          seek(currentPly - 1);
          break;
        case "ArrowUp":
        case "Home":
          e.preventDefault();
          seek(0);
          break;
        case "ArrowDown":
        case "End":
          e.preventDefault();
          seek(N);
          break;
        case " ":
          if (t && t.tagName === "BUTTON") return; // let a focused button activate
          e.preventDefault();
          setPlayTarget(null);
          setPlaying((p) => !p);
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentPly, seek]);

  // Autoplay: advance one ply at a time. With a target set (the top "Next"
  // button), it plays quickly and stops at the next important move.
  React.useEffect(() => {
    if (!playing) return;
    const target = playTarget ?? N;
    if (currentPly >= target) {
      setPlaying(false);
      setPlayTarget(null);
      return;
    }
    const delay = playTarget != null ? 320 : 700;
    const id = setTimeout(
      () => setCurrentPly((p) => Math.min(target, p + 1)),
      delay,
    );
    return () => clearTimeout(id);
  }, [playing, currentPly, playTarget]);

  // Any move change closes the Best / Explain overlays.
  React.useEffect(() => {
    setBestShown(false);
    setExplainShown(false);
  }, [currentPly]);

  React.useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const showToast = React.useCallback((msg: string) => {
    setToastMsg(msg);
    setToast(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(false), 2800);
  }, []);

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
    showToast("Game link copied to clipboard");
  };

  /*
    Next, at the end of the game.

    There are no more moves to step to, so the button starts walking the
    training list instead — Openings, then the game's own puzzles, then the
    locked drills — highlighting one at a time. On the last of them it has
    nothing left to offer and gives way to the upgrade button.
  */
  const [trainingStep, setTrainingStep] = React.useState(-1);
  const atEnd = currentPly >= N;
  const lastTrainingStep = TRAINING_ROWS.length - 1;
  const walkingTraining = atEnd && trainingStep >= 0;
  const trainingDone = trainingStep >= lastTrainingStep;

  // Stepping back into the game puts the list away.
  React.useEffect(() => {
    if (!atEnd) setTrainingStep(-1);
  }, [atEnd]);

  // The top "Next" button plays forward to the next important move.
  const goNextImportant = () => {
    if (atEnd) {
      setTrainingStep((s) => Math.min(s + 1, lastTrainingStep));
      return;
    }
    const next = notablePlies.find((p) => p > currentPly);
    setBestShown(false);
    setExplainShown(false);
    setPlayTarget(next ?? N);
    setPlaying(true);
  };

  const ply = currentPly > 0 ? model.plies[currentPly - 1] : null;
  const isOverview = ply === null;
  const actions = ply ? topActions(ply.classification) : [];

  const bestMove = React.useMemo(
    () => (currentPly > 0 ? suggestBestMove(model, currentPly) : null),
    [currentPly],
  );
  const showingBest = bestShown && bestMove != null;
  const fenBefore = currentPly >= 2 ? model.plies[currentPly - 2].fen : START_FEN;

  const summaryText =
    "You broke through in the endgame! Strong maneuvers win the day!";

  const coach: {
    text: string;
    classification?: MoveClassification;
    evalText?: string;
  } = !ply
    ? { text: summaryText }
    : showingBest
      ? { text: `${bestMove!.san} was the best move here.`, classification: "best" }
      : explainShown
        ? {
            text: moveExplanation(ply, model.userSide),
            classification: ply.classification,
            evalText: formatEval(ply),
          }
        : {
            text: moveCommentary(ply),
            classification: ply.classification,
            evalText: formatEval(ply),
          };

  const graphPoints = model.plies.map((p, i) => ({
    evalCp: p.evalCp,
    classification: p.classification,
  }));

  const renderAction = (a: TopAction) => {
    switch (a) {
      case "next":
        // Walked to the end of the training list: the last drill is premium, so
        // the only thing left worth offering is the way to unlock it.
        if (trainingDone) {
          return (
            <TopButton
              key="upgrade"
              green
              icon={<Image src={ICON.upgrade} width={18} height={18} alt="" />}
              label="Go Premium"
              onClick={() => setPlan("premium")}
            />
          );
        }
        // When Share is the primary (brilliant/great), Next drops to secondary.
        return (
          <TopButton
            key="next"
            green={!actions.includes("share")}
            icon={<ArrowRight />}
            label="Next"
            onClick={goNextImportant}
          />
        );
      case "explain":
        return (
          <TopButton
            key="explain"
            active={explainShown}
            icon={<Lightbulb />}
            label="Explain"
            onClick={() => {
              setBestShown(false);
              setExplainShown((v) => !v);
            }}
          />
        );
      case "best":
        return (
          <TopButton
            key="best"
            active={bestShown}
            icon={
              <Image src={moveTypeIcon("best")} width={18} height={18} alt="" />
            }
            label="Best"
            onClick={() => {
              setExplainShown(false);
              setBestShown((v) => !v);
            }}
          />
        );
      case "share":
        return (
          <TopButton
            key="share"
            green
            icon={<Share2 />}
            label="Share"
            onClick={handleShare}
          />
        );
    }
  };

  return (
    <div className="flex flex-col lg:h-screen lg:flex-row lg:overflow-hidden">
      <h1 className="sr-only">Game Review — santoshmudragada vs jazzzzzzzyyyyy</h1>

      {/* LEFT — the board fills the whole left side */}
      <div className="flex min-h-0 flex-1 flex-col justify-center px-3 py-4 sm:px-5 lg:h-screen lg:py-5">
        <ReviewBoard
          model={model}
          currentPly={currentPly}
          fenOverride={showingBest ? fenBefore : undefined}
          highlightOverride={
            showingBest ? [bestMove!.from, bestMove!.to] : undefined
          }
        />
      </div>

      {/* RIGHT — overview / review panel */}
      <aside className="flex w-full shrink-0 flex-col border-t border-line/60 bg-surface lg:h-screen lg:w-[500px] lg:border-l lg:border-t-0">
        <PanelHeader showBack={!isOverview} onBack={() => seek(0)} />

        {/* Live analysis of an archived game — the numbers sharpen as it runs. */}
        {analysing && analysing.done < analysing.total && (
          <div className="shrink-0 border-b border-line/40 bg-black/[0.14] px-6 py-3">
            <div className="flex items-baseline justify-between text-[13px]">
              <span className="text-ink-soft">
                Analysing with Stockfish…
              </span>
              <span className="font-semibold tabular-nums text-ink">
                {analysing.done}/{analysing.total}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-brand transition-[width] duration-300"
                style={{
                  width: `${Math.round((analysing.done / Math.max(1, analysing.total)) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {isOverview ? (
          <>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4 scrollbar-thin">
              <CoachBubble text={coach.text} />
              <EvalGraph points={graphPoints} className="h-24" />
              <OverviewStats model={model} />
              <button
                type="button"
                className="h-12 w-full rounded-[10px] bg-[#3a3734] text-[16px] font-bold text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_2px_3px_rgba(0,0,0,0.3)] transition hover:bg-[#454240] active:translate-y-px"
              >
                New 15 | 10
              </button>
            </div>
            <div className="shrink-0 border-t border-line/40 px-6 pb-6 pt-2">
              <button
                type="button"
                onClick={() => seek(1)}
                className="relative h-14 w-full rounded-[10px] bg-gradient-to-b from-brand to-[#5d9948] text-[19px] font-extrabold text-white shadow-[0_1px_2px_rgba(0,0,0,0.14),0_2px_4px_rgba(0,0,0,0.1),inset_0_-1px_0_0_#45753c] transition hover:brightness-[1.04] active:translate-y-px active:brightness-95"
              >
                Start Review
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Sticky top — coach + per-move action buttons */}
            <div className="shrink-0 space-y-3 border-b border-line/40 px-5 pb-3 pt-3">
              <CoachBubble
                text={coach.text}
                classification={coach.classification}
                evalText={coach.evalText}
              />
              <div className="flex items-stretch gap-2">
                {actions.map(renderAction)}
              </div>
            </div>

            {/* Scrolling — the move list, and at the end of it, what to do next */}
            <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
              <MoveListNav
                model={model}
                currentPly={currentPly}
                onSeek={seek}
                className="px-2 py-1"
              />
              {/* The game is over: the panel stops narrating and starts
                  offering. "Solve game puzzles" is this whole feature's front
                  door, so it sits where Chess.com puts its training list. */}
              {currentPly >= N && (
                <div className="space-y-2.5 px-5 pb-4 pt-2">
                  <TrainingList gameId={gameId} highlight={trainingStep} />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => seek(0)}
                      className="flex h-11 flex-1 items-center justify-center gap-2 rounded-[8px] bg-white/[0.06] text-[14px] font-semibold text-ink transition-colors hover:bg-white/[0.1]"
                    >
                      <ArrowLeft className="size-4" />
                      Highlights
                    </button>
                    <button
                      type="button"
                      className="h-11 flex-1 rounded-[8px] bg-white/[0.06] text-[14px] font-semibold text-ink transition-colors hover:bg-white/[0.1]"
                    >
                      New 15 + 10
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky bottom — eval graph, playback controls, actions */}
            <div className="shrink-0 space-y-2.5 border-t border-line/40 px-5 pb-3 pt-3">
              <EvalGraph
                points={graphPoints}
                currentIndex={currentPly - 1}
                className="h-16"
              />
              <PlaybackControls
                playing={playing}
                onFirst={() => seek(0)}
                onPrev={() => seek(currentPly - 1)}
                onToggle={() => {
                  setPlayTarget(null);
                  setPlaying((p) => !p);
                }}
                onNext={() => seek(currentPly + 1)}
                onLast={() => seek(N)}
                atEnd={atEnd}
              />
              <ReviewBottomBar onShare={handleShare} />
            </div>
          </>
        )}
      </aside>

      <Toast show={toast} message={toastMsg} />
    </div>
  );
}
