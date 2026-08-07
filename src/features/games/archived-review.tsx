"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { GameReview } from "@/features/game-based-puzzles/game-review";
import { useChessAccount } from "@/hooks/use-chess-account";
import { useReviews } from "@/hooks/use-reviews";
import { buildModelFromPgn } from "@/lib/pgn";

/**
 * Game Review for a game clicked out of the archive.
 *
 * Without `?game=` this is the sample game with its baked depth-18 analysis.
 * With one, the review comes from the same background pass that fills the
 * archive's accuracy column — asking for it here just moves it to the front of
 * that queue, so the board opens straight away and the classifications, graph
 * and accuracies fill in as the engine works, and none of it is thrown away if
 * the member wanders off mid-analysis.
 */
export function ArchivedReview() {
  const id = useSearchParams().get("game");
  const { games, profile, status } = useChessAccount();
  const { reviews, request } = useReviews();

  const game = React.useMemo(
    () => (id ? games.find((g) => g.id === id) : undefined),
    [id, games],
  );

  React.useEffect(() => {
    if (game) request(game.id);
  }, [game, request]);

  const review = id ? reviews[id] : undefined;

  const model = React.useMemo(() => {
    if (!game) return undefined;
    return buildModelFromPgn(game.pgn, profile?.username ?? "", review?.rows ?? []);
  }, [game, profile, review?.rows]);

  // Asked for a game we haven't got — usually a reload, since games live in
  // memory rather than storage.
  if (id && !game) {
    const loading = status === "loading";
    return (
      <div className="grid min-h-[60vh] place-items-center px-6 text-center">
        <div>
          <p className="font-display text-[22px] font-black text-white">
            {loading ? "Loading your games…" : "That game isn't loaded"}
          </p>
          <p className="mt-2 text-[14px] text-ink-muted">
            {loading
              ? "One moment — pulling the archive from Chess.com."
              : "Games are fetched fresh each visit. Open it from your history again."}
          </p>
          {!loading && (
            <Link
              href="/games"
              className="mt-5 inline-flex h-11 items-center rounded-[10px] bg-gradient-to-b from-brand to-[#5d9948] px-6 text-[15px] font-bold text-white"
            >
              Back to Game History
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <GameReview
      model={model}
      analysing={
        game
          ? { done: review?.done ?? 0, total: review?.total ?? 0 }
          : null
      }
    />
  );
}
