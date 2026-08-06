"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";

import { useChessAccount } from "@/hooks/use-chess-account";
import { GAME_ICON } from "@/lib/assets";
import { pieceImage } from "@/lib/chess";
import { cn } from "@/lib/utils";

/** The six pieces, cycling — a loader made of the thing being loaded. */
const LOADER_PIECES = ["P", "N", "B", "R", "Q", "K"];

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
 * The first thing a visitor sees: whose games are we training on?
 *
 * Everything downstream — the history, the review, the puzzles — is built from
 * one Chess.com username, so it is asked for once, up front, and remembered.
 */
export function ConnectDialog() {
  const { profile, status, error, progress, ready, restored, promptNonce, connect } =
    useChessAccount();
  const [value, setValue] = React.useState("");
  const [dismissed, setDismissed] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const loading = status === "loading";
  // Open until an account is connected, or until it's waved away for this
  // visit. A remembered username reconnects quietly in the background.
  const open = ready && !dismissed && !restored && (!profile || loading);

  React.useEffect(() => {
    if (open && !loading) inputRef.current?.focus();
  }, [open, loading]);

  // Logging out asks again, even if the prompt was waved away earlier.
  React.useEffect(() => {
    if (promptNonce > 0) {
      setDismissed(false);
      setValue("");
    }
  }, [promptNonce]);

  // A finished load closes the dialog on its own.
  React.useEffect(() => {
    if (status === "ready" && profile) {
      const t = setTimeout(() => setDismissed(true), 550);
      return () => clearTimeout(t);
    }
  }, [status, profile]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loading) void connect(value);
  };

  const pct =
    progress.total > 0
      ? Math.round((progress.done / progress.total) * 100)
      : loading
        ? 6
        : 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Connect your Chess.com account"
        >
          <motion.div
            className="relative w-full max-w-[440px] overflow-hidden rounded-[12px] border border-line/60 bg-surface shadow-pop"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          >
            {/* Skippable — the prototype still works on its sample game. */}
            {!loading && (
              <button
                type="button"
                aria-label="Continue without connecting"
                onClick={() => setDismissed(true)}
                className="absolute right-3 top-3 grid size-8 place-items-center rounded-[6px] text-ink-soft transition-colors hover:bg-white/[0.06] hover:text-ink"
              >
                <X className="size-[18px]" />
              </button>
            )}

            <div className="px-7 pb-7 pt-8">
              <Image
                src={GAME_ICON.gameBasedPuzzles}
                width={44}
                height={44}
                alt=""
              />
              <h2 className="mt-3.5 font-display text-[26px] font-black leading-none text-white">
                {loading ? "Reading your games" : "Connect your Chess.com"}
              </h2>
              <p className="mt-2.5 text-[14px] leading-snug text-ink-muted">
                {loading
                  ? "Pulling your archive straight from Chess.com so every puzzle comes from a game you actually played."
                  : "Enter your Chess.com username and we'll pull your game history, then mine it for the mistakes worth drilling."}
              </p>

              {loading ? (
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
                      {progress.label || "Finding the account…"}
                    </span>
                    <span className="font-semibold tabular-nums text-ink">
                      {progress.games > 0
                        ? `${progress.games} games`
                        : progress.total > 0
                          ? `${progress.done}/${progress.total}`
                          : ""}
                    </span>
                  </div>
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
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="e.g. santoshmudragada"
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
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
