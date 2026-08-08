"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { useChessAccount } from "@/hooks/use-chess-account";
import { useReviews } from "@/hooks/use-reviews";
import { Tour } from "@/components/onboarding/tour";
import { Logo } from "@/components/shared/logo";
import { pieceImage } from "@/lib/chess";
import { DRAFT_KEY, RETURN_KEY, SKIP_KEY, read, write } from "@/lib/onboarding";
import { cn } from "@/lib/utils";

/** The six pieces, cycling — a loader made of the thing being loaded. */
const LOADER_PIECES = ["P", "N", "B", "R", "Q", "K"];

/**
 * Things worth knowing, one at a time, while the engine works.
 *
 * A progress bar with nothing to read beside it makes two minutes feel like
 * five. These are all true of what is happening on the other side of the bar,
 * so reading them is also being told what the wait is for.
 */
const WAIT_NOTES = [
  "Stockfish is scoring every position of every game — around eighty per game, each one searched on its own worker thread.",
  "Only the games you had reviewed on Chess.com are read. Asking for a review is itself a signal you cared how that game went.",
  "A mistake is only made into a puzzle if missing it actually cost you the game. Declining a faster mate is not a mistake worth drilling.",
  "A collapse counts once. If one move led to four disasters, the puzzle is the move that would have prevented all of them.",
  "The solution stops where the lesson does — checkmate for a mating attack, a won piece for a combination. No engine filler.",
  "Everything is worked out once and kept, so the next time you open this it will already be here.",
];

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
 * Its own page rather than a sheet over the app — nothing of the dashboard is
 * rendered underneath, so there is no half-loaded screen of numbers about to be
 * replaced showing through, and no rail of avatar fetches competing with
 * someone typing their username.
 *
 * The tour is not decoration either: it takes about as long to read as the
 * review takes to finish, so the explanation and the wait are the same
 * half-minute instead of two consecutive ones.
 */
export function WelcomeFlow() {
  const router = useRouter();
  const { profile, status, error, progress, ready, connect } = useChessAccount();
  const { sweep } = useReviews();

  const [value, setValue] = React.useState("");
  /** Which note is on screen; they rotate while the bar fills. */
  const [fact, setFact] = React.useState(0);
  const [tourDone, setTourDone] = React.useState(false);
  /** True once the member has connected from this screen — a remembered
   *  username reconnects quietly and shouldn't be told the story again. */
  const [connectedHere, setConnectedHere] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const fetching = status === "loading";
  /** Games read before the door opens; the rest carry on behind the app. */
  const firstBatch = sweep.firstBatch;
  const reviewing = firstBatch > 0 && sweep.done < firstBatch;
  const busy = fetching || reviewing;

  /*
    "connect" is also what this renders before the client knows anything.

    Waiting for `ready` meant the page was blank until the JavaScript had
    downloaded, parsed and run — two and a half seconds on a throttled machine —
    and only then did the card animate in, often under the first keystroke of
    someone who had started typing the moment it appeared. Rendering the form as
    the page's own markup puts it on screen with the HTML instead. Anyone with a
    remembered account is held on their own page by the gate and never sees this.
  */
  const phase: "connect" | "loading" | "tour" | null = !ready
    ? "connect"
    : busy
      ? "loading"
      : !profile
        ? "connect"
        : connectedHere && !tourDone
          ? "tour"
          : null;

  /** Back to wherever they were headed when setup interrupted them. */
  const leave = React.useCallback(() => {
    const back = read(RETURN_KEY) || "/";
    write(RETURN_KEY, "");
    router.replace(back);
  }, [router]);

  // Nothing left to set up — hand them over.
  React.useEffect(() => {
    if (ready && phase === null) leave();
  }, [ready, phase, leave]);

  React.useEffect(() => {
    const t = setInterval(
      () => setFact((f) => (f + 1) % WAIT_NOTES.length),
      6500,
    );
    return () => clearInterval(t);
  }, []);

  // Bring back whatever was typed before the tab reloaded, caret at the end.
  React.useEffect(() => {
    const draft = read(DRAFT_KEY);
    if (draft) setValue(draft);
  }, []);

  React.useEffect(() => {
    if (phase !== "connect") return;
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }, [phase]);

  // Connected — the draft has done its job; the username is remembered now.
  React.useEffect(() => {
    if (status === "ready" && profile) write(DRAFT_KEY, "");
  }, [status, profile]);

  const onType = (next: string) => {
    setValue(next);
    write(DRAFT_KEY, next);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setConnectedHere(true);
    setTourDone(false);
    void connect(value);
  };

  const skip = () => {
    write(SKIP_KEY, "1");
    leave();
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
    <main className="flex min-h-screen flex-col items-center justify-center overflow-y-auto bg-bg p-4">
      <AnimatePresence mode="wait">
        {phase === "tour" ? (
          <motion.div
            key="tour"
            className="flex w-full justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <Tour onDone={() => setTourDone(true)} />
          </motion.div>
        ) : phase ? (
          <motion.div
            key="card"
            className="w-full max-w-[440px] overflow-hidden rounded-[12px] border border-line/60 bg-surface shadow-pop"
            // No entrance. The card is the first thing on the page and it is
            // there in the markup, so animating it in would mean animating it
            // *after* it was already visible — which is the flinch people saw.
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

                  {/* No count while reviewing: "3 of 5" invites arithmetic about
                      how long the other games will take, and the rest of them
                      finish behind the app anyway. */}
                  <div className="mt-3 flex items-baseline justify-between text-[13px]">
                    <span className="text-ink-soft">
                      {fetching
                        ? progress.label || "Finding the account…"
                        : "Your games are being analysed"}
                    </span>
                    {fetching && (
                      <span className="font-semibold tabular-nums text-ink">
                        {progress.games > 0
                          ? `${progress.games} games`
                          : progress.total > 0
                            ? `${progress.done}/${progress.total}`
                            : ""}
                      </span>
                    )}
                  </div>

                  {/* Something true to read while the engine works, changing
                      often enough to be worth looking at. */}
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={fact}
                      className="mt-5 min-h-[64px] rounded-[8px] bg-black/25 px-3.5 py-3 text-center text-[12.5px] font-medium leading-relaxed text-ink-soft"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.3 }}
                    >
                      {WAIT_NOTES[fact]}
                    </motion.p>
                  </AnimatePresence>

                  {/* Say the quiet part out loud: this is a prototype doing real
                      engine work on this machine, and it is not quick. */}
                  <p className="mt-2.5 text-center text-[11.5px] leading-snug text-ink-faint">
                    This is a feature prototype, not the real product — every
                    position is analysed here in your browser, so building the
                    puzzles takes a few minutes.
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
                    onClick={skip}
                    className="mx-auto mt-4 block text-[13px] font-semibold text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline"
                  >
                    Explore with the sample game instead
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
