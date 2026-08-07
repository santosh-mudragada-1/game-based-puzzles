"use client";

import * as React from "react";
import { Chess } from "chess.js";

import { Avatar } from "@/components/shared/avatar";
import { PreviewCard } from "@/components/home/preview-card";
import { useChessAccount } from "@/hooks/use-chess-account";
import { useOpponents } from "@/hooks/use-opponents";
import { useReviews } from "@/hooks/use-reviews";
import { gamePreview } from "@/data/home";
import type { PieceColor } from "@/types";

/** Final position of a game, so the card shows how it actually ended. */
function finalFen(pgn: string): string | null {
  try {
    const game = new Chess();
    game.loadPgn(pgn);
    return game.fen();
  } catch {
    return null;
  }
}

const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

/**
 * "Review Game" in the home hero — the most recent game still waiting for one.
 *
 * Everything already reviewed is skipped, so the card is always pointing at
 * work left to do rather than at whatever happened to be last.
 */
export function ReviewGameCard() {
  const { games, profile } = useChessAccount();
  const { reviews } = useReviews();
  // Already fetched for the Friends rail, so the photo costs nothing extra.
  const { opponents } = useOpponents(8);

  const game = React.useMemo(
    () => games.find((g) => reviews[g.id]?.accuracy == null),
    [games, reviews],
  );

  if (!game || !profile) {
    return (
      <PreviewCard
        fen={gamePreview.fen}
        orientation={gamePreview.orientation}
        action="Review Game"
        actionHref="/review"
      >
        <div className="flex items-center gap-2.5">
          <Avatar size={36} rounded="sm" alt={`${gamePreview.opponent} avatar`} />
          <span className="min-w-0 truncate text-[15px] font-semibold text-ink">
            vs {gamePreview.opponent}
          </span>
        </div>
      </PreviewCard>
    );
  }

  const opponent = game.userSide === "white" ? game.black : game.white;
  const orientation: PieceColor = game.userSide;
  const fen = finalFen(game.pgn) ?? gamePreview.fen;
  const outcome =
    game.result === "win" ? "Won" : game.result === "loss" ? "Lost" : "Drew";

  return (
    <PreviewCard
      fen={fen}
      orientation={orientation}
      action="Review Game"
      actionHref={`/review?game=${game.id}`}
    >
      <div className="flex items-center gap-2.5">
        <Avatar
          size={36}
          rounded="sm"
          src={
            opponents.find(
              (o) => o.username.toLowerCase() === opponent.username.toLowerCase(),
            )?.avatar
          }
          alt=""
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold text-ink">
            vs {opponent.username}
          </span>
          <span className="block truncate text-[12px] text-ink-soft">
            {outcome} · {DATE_FMT.format(new Date(game.endTime * 1000))} · not
            reviewed
          </span>
        </span>
      </div>
    </PreviewCard>
  );
}
