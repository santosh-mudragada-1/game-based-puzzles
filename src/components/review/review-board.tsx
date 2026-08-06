import { MiniBoard } from "@/components/board/mini-board";
import { Avatar } from "@/components/shared/avatar";
import { EvalBar } from "@/components/review/eval-bar";
import type { PlayerRef } from "@/types";
import type { ReviewModel } from "@/lib/pgn";
import { cn } from "@/lib/utils";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/** Last clock string for a given side up to (and including) the current ply. */
function clockFor(model: ReviewModel, side: "white" | "black", ply: number) {
  for (let i = Math.min(ply, model.plies.length) - 1; i >= 0; i--) {
    const p = model.plies[i];
    if (p.side === side && p.clock) return p.clock;
  }
  return "15:00";
}

function PlayerRow({
  player,
  clock,
  isUser,
}: {
  player: PlayerRef;
  clock: string;
  isUser?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Avatar size={40} rounded="md" alt={`${player.username} avatar`} />
      <span className="truncate text-[15px] font-bold text-ink">
        {player.username}
      </span>
      <span className="text-xs text-ink-faint">({player.rating})</span>
      {player.countryFlag && (
        <span className="text-[22px] leading-none" aria-hidden>
          {player.countryFlag}
        </span>
      )}
      <span
        className={cn(
          "ml-auto flex items-center gap-1.5 rounded-[4px] px-3 py-1 font-display text-[15px] font-bold tabular-nums",
          isUser ? "bg-surface-raised text-ink" : "bg-white text-[#2b2926]",
        )}
      >
        {clock}
      </span>
    </div>
  );
}

/**
 * The left side of the Game Review: opponent on top, eval bar + board in the
 * middle, you at the bottom. The board fills the available height (like the
 * real Chess.com review), sized to the smaller of its column width and the
 * viewport height. Oriented for the user's side (Black here).
 */
export function ReviewBoard({
  model,
  currentPly,
  className,
  fenOverride,
  highlightOverride,
}: {
  model: ReviewModel;
  currentPly: number;
  className?: string;
  /** Show a different position than the current ply (e.g. the "Best" preview). */
  fenOverride?: string;
  /** Squares to highlight instead of the played move (e.g. the best move). */
  highlightOverride?: string[];
}) {
  const ply = currentPly > 0 ? model.plies[currentPly - 1] : null;
  const fen = fenOverride ?? ply?.fen ?? START_FEN;
  const highlight = highlightOverride ?? (ply ? [ply.from, ply.to] : []);
  const evalPawns = (ply?.evalCp ?? 0) / 100;

  // Once the final move is on the board and it was mate, crown the winner and
  // topple the loser. Suppressed while previewing an alternative line.
  const last = model.plies[model.plies.length - 1];
  const gameEnd =
    last?.san.endsWith("#") &&
    currentPly >= model.plies.length &&
    !fenOverride
      ? { winner: last.side }
      : null;

  const opponent = model.userSide === "black" ? model.white : model.black;
  const you = model.userSide === "black" ? model.black : model.white;

  return (
    <div
      className={cn(
        "mx-auto flex min-h-0 w-full max-w-[min(100%,calc(100vh-9rem))] flex-col justify-center gap-2 sm:gap-3",
        className,
      )}
    >
      <PlayerRow
        player={opponent}
        clock={clockFor(model, opponent.color, currentPly)}
      />
      <div className="flex min-h-0 items-stretch justify-center gap-1.5 sm:gap-2">
        <EvalBar
          evalPawns={evalPawns}
          orientation={model.userSide}
          className="w-5 shrink-0 sm:w-6"
        />
        <div className="aspect-square min-h-0 flex-1">
          <MiniBoard
            fen={fen}
            orientation={model.userSide}
            highlight={highlight}
            gameEnd={gameEnd}
            showCoordinates
            className="h-full w-full shadow-raised"
          />
        </div>
      </div>
      <PlayerRow
        player={you}
        clock={clockFor(model, you.color, currentPly)}
        isUser
      />
    </div>
  );
}
