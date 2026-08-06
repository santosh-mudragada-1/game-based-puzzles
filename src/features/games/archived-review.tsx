"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { GameReview } from "@/features/game-based-puzzles/game-review";
import { useChessAccount } from "@/hooks/use-chess-account";
import { useGameAnalysis } from "@/hooks/use-game-analysis";
import { buildModelFromPgn } from "@/lib/pgn";

/**
 * Game Review for a game clicked out of the archive.
 *
 * Without `?game=` this is the sample game with its baked depth-18 analysis.
 * With one, the PGN comes from the connected account and Stockfish works
 * through it here in the browser — the board opens straight away and the
 * classifications, graph and accuracies fill in as the engine goes.
 */
export function ArchivedReview() {
  const id = useSearchParams().get("game");
  const { games, profile, status } = useChessAccount();

  const game = React.useMemo(
    () => (id ? games.find((g) => g.id === id) : undefined),
    [id, games],
  );

  const analysis = useGameAnalysis(game?.pgn ?? null);

  const model = React.useMemo(() => {
    if (!game) return undefined;
    return buildModelFromPgn(game.pgn, profile?.username ?? "", analysis.rows);
  }, [game, profile, analysis.rows]);

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
        game ? { done: analysis.done, total: analysis.total } : null
      }
    />
  );
}
