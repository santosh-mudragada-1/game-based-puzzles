"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { useChessAccount } from "@/hooks/use-chess-account";
import { useReviews } from "@/hooks/use-reviews";
import { Tour } from "@/components/onboarding/tour";
import { Logo } from "@/components/shared/logo";
import { pieceImage } from "@/lib/chess";
import { cn } from "@/lib/utils";

/** The six pieces, cycling — a loader made of the thing being loaded. */
const LOADER_PIECES = ["P", "N", "B", "R", "Q", "K"];

/**
 * Where the half-typed username is kept.
 *
 * Anything that reloads the tab throws away React state, and the member comes
 * back to an empty box with no idea why. Per-tab, so it never outlives the visit.
 */
const DRAFT_KEY = "gbp:draft-username";

function readDraft(): string {
  try {
    return window.sessionStorage.getItem(DRAFT_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeDraft(value: string) {
  try {
    if (value) window.sessionStorage.setItem(DRAFT_KEY, value);
    else window.sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Private browsing with storage denied — the draft simply isn't kept.
  }
}

function PieceLoader() {
  return (
    <div className="flex items-end justify-center gap-1.5" aria-hidden>
      {LOADER_PIECES.map((p, i) => (
        <motion.span
          key={p}
          className="relative block size-8"
          animate={{ y: [0, -10, 0], opacity: [0.35, 1, 0.35] }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            delay: i * 0.11,
            ease: "easeInOut",
          }}
        >
          <Image src={pieceImage(p)} alt="" fill className="object-contain" />
        </motion.span>
      ))}
    </div>
  );
}

/**
 * Everything before the dashboard: the username, the wait, and the explanation.
 *
 * It covers the app completely and opaquely rather than sitting over it as a
 * modal. Half-loaded sample data showing through was the worst part of the old
 * version — a dashboard of numbers that were about to be replaced, flickering as
 * the real ones arrived. Nothing is shown until it is true.
 *
 * The tour is not decoration either: it takes about as long to read as the
 * review takes to finish, so the explanation and the wait are the same
 * half-minute instead of two consecutive ones.
 */
export function Welcome({ children }: { children: React.ReactNode }) {
  const { profile, status, error, progress, ready, promptNonce, connect } =
    useChessAccount();
  const { sweep } = useReviews();

  const [value, setValue] = React.useState("");
  const [tourDone, setTourDone] = React.useState(false);
  /** True once the member has connected from this screen — a remembered
   *  username reconnects quietly and shouldn't be told the story again. */
  const [connectedHere, setConnectedHere] = React.useState(false);
  /** Waved past the whole thing to look around on the sample game. */
  const [skipped, setSkipped] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const fetching = status === "loading";
  /** Games read before the door opens; the rest carry on behind the dashboard. */
  const firstBatch = sweep.firstBatch;
  const reviewing = firstBatch > 0 && sweep.done < firstBatch;
  const busy = fetching || reviewing;

  const phase: "connect" | "loading" | "tour" | null = !ready
    ? null
    : busy
      ? "loading"
      : skipped
        ? null
        : !profile
          ? "connect"
          : connectedHere && !tourDone
            ? "tour"
            : null;

  // Bring back whatever was typed before the tab reloaded, caret at the end.
  React.useEffect(() => {
    const draft = readDraft();
    if (draft) setValue(draft);
  }, []);

  React.useEffect(() => {
    if (phase !== "connect") return;
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }, [phase]);

  // Logging out asks again, and tells the story again to whoever comes next.
  React.useEffect(() => {
    if (promptNonce > 0) {
      setValue("");
      writeDraft("");
      setTourDone(false);
      setConnectedHere(false);
    }
  }, [promptNonce]);

  // Connected — the draft has done its job; the username is remembered now.
  React.useEffect(() => {
    if (status === "ready" && profile) writeDraft("");
  }, [status, profile]);

  const onType = (next: string) => {
    setValue(next);
    writeDraft(next);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setConnectedHere(true);
    setTourDone(false);
    void connect(value);
  };

  /** Fetching fills the first half of the bar, reviewing the second. */
  const pct = fetching
    ? progress.total > 0
      ? Math.round((progress.done / progress.total) * 50)
      : 6
    : reviewing
      ? 50 + Math.round((sweep.done / firstBatch) * 50)
      : 100;

  return (
    <>
      {/*
        The app itself is not mounted until there is something true to show. It
        keeps a half-loaded dashboard from flickering through, and it keeps a
        few hundred rows and a rail of avatar fetches off the main thread while
        someone is typing their username into the box on top of it.
      */}
      {phase === null && children}

      <AnimatePresence>
      {phase && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-y-auto bg-bg p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          role="dialog"
          aria-modal="true"
          aria-label="Set up Game Based Puzzles"
        >
          {phase === "tour" ? (
            <Tour onDone={() => setTourDone(true)} />
          ) : (
            <motion.div
              className="w-full max-w-[440px] overflow-hidden rounded-[12px] border border-line/60 bg-surface shadow-pop"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            >
              <div className="px-7 pb-7 pt-8">
                <Logo height={26} />
                <h2 className="mt-4 font-display text-[26px] font-black leading-none text-white">
                  {fetching
                    ? "Reading your games"
                    : reviewing
                      ? "Reviewing your games"
                      : "Connect your Chess.com"}
                </h2>
                <p className="mt-2.5 text-[14px] leading-snug text-ink-muted">
                  {fetching
                    ? "Pulling your archive straight from Chess.com so every puzzle comes from a game you actually played."
                    : reviewing
                      ? "Stockfish is going through the games you had reviewed on Chess.com, looking for the moments worth replaying."
                      : "Enter your Chess.com username and we'll pull your game history, then mine it for the mistakes worth drilling."}
                </p>

                {busy ? (
                  <div className="mt-7">
                    <PieceLoader />

                    <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="h-full rounded-full bg-brand"
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      />
                    </div>

                    <div className="mt-3 flex items-baseline justify-between text-[13px]">
                      <span className="text-ink-soft">
                        {fetching
                          ? progress.label || "Finding the account…"
                          : "Analysing with Stockfish"}
                      </span>
                      <span className="font-semibold tabular-nums text-ink">
                        {fetching
                          ? progress.games > 0
                            ? `${progress.games} games`
                            : progress.total > 0
                              ? `${progress.done}/${progress.total}`
                              : ""
                          : `${Math.min(sweep.done, firstBatch)}/${firstBatch} games`}
                      </span>
                    </div>

                    {/* Say the quiet part out loud: this is real engine work. */}
                    <p className="mt-5 rounded-[8px] bg-black/25 px-3.5 py-3 text-center text-[12.5px] font-semibold text-ink-soft">
                      This can take a minute or two
                    </p>
                  </div>
                ) : (
                  <form onSubmit={submit} className="mt-6">
                    <label
                      htmlFor="chesscom-username"
                      className="block text-[11px] font-bold uppercase tracking-wide text-ink-faint"
                    >
                      Chess.com username
                    </label>
                    <input
                      ref={inputRef}
                      id="chesscom-username"
                      value={value}
                      onChange={(e) => onType(e.target.value)}
                      placeholder="e.g. gothamchess"
                      autoComplete="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      className={cn(
                        "mt-2 h-12 w-full rounded-[10px] border bg-black/25 px-3.5 text-[15px] font-semibold text-white outline-none transition-colors placeholder:font-normal placeholder:text-ink-faint",
                        error
                          ? "border-[#d0453f]/70"
                          : "border-line/70 focus:border-brand",
                      )}
                    />

                    {error && (
                      <p className="mt-2 text-[13px] leading-snug text-[#e0625c]">
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={!value.trim()}
                      className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-b from-brand to-[#5d9948] text-[15px] font-bold text-white shadow-[0_1px_2px_rgba(0,0,0,0.14),0_2px_4px_rgba(0,0,0,0.1),inset_0_-1px_0_0_#45753c] transition hover:brightness-[1.04] active:translate-y-px disabled:pointer-events-none disabled:opacity-45"
                    >
                      Fetch my games
                      <ArrowRight className="size-[18px]" />
                    </button>

                    <p className="mt-3 text-center text-[12px] text-ink-faint">
                      Read-only, public data. No password, nothing stored but the
                      name.
                    </p>

                    {/* A way in without an account, for a look around. */}
                    <button
                      type="button"
                      onClick={() => setSkipped(true)}
                      className="mx-auto mt-4 block text-[13px] font-semibold text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline"
                    >
                      Explore with the sample game instead
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
      </AnimatePresence>
    </>
  );
}
