"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import type { Game, GameResult, PlayerRef } from "@/types";
import { Card, CardHeader, CardTitle } from "@/components/shared/card";
import { Avatar } from "@/components/shared/avatar";
import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/shared/button";
import { FavoriteHeart } from "./favorite-heart";
import { recentGames, meUsername } from "@/data/games";
import { useChessAccount } from "@/hooks/use-chess-account";
import { useReviews } from "@/hooks/use-reviews";
import { flagOf, toGame } from "@/lib/chesscom";
import { GAME_ICON } from "@/lib/assets";
import { cn } from "@/lib/utils";

function PlayerLine({
  p,
  isWinner,
  me,
}: {
  p: PlayerRef;
  isWinner: boolean;
  me: string;
}) {
  const isMe = p.username.toLowerCase() === me.toLowerCase();
  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden
        className={cn(
          "size-3 shrink-0 rounded-[2px] border",
          p.color === "white"
            ? "border-black/25 bg-board-light"
            : "border-white/15 bg-[#403d39]",
        )}
      />
      <Avatar size={20} alt={`${p.username} avatar`} />
      <span
        className={cn(
          "max-w-[9rem] truncate text-[13px] sm:max-w-[12rem]",
          isMe ? "font-bold text-ink" : "font-semibold text-ink-muted",
          isWinner && !isMe && "text-ink",
        )}
      >
        {p.username}
      </span>
      <span className="text-xs text-ink-faint">({p.rating})</span>
      {p.countryFlag && (
        <span className="text-xs leading-none" aria-hidden>
          {p.countryFlag}
        </span>
      )}
      {p.isBot && (
        <Badge variant="info" size="sm" className="px-1.5 py-0">
          BOT
        </Badge>
      )}
    </div>
  );
}

const fmtScore = (s: number) => (s === 0.5 ? "½" : String(s));

/** Win/loss/draw glyph from the trainee's perspective (green +, red −, grey =). */
function ResultIcon({ result }: { result: GameResult }) {
  const map = {
    win: { cls: "bg-win", sym: "+", label: "Win" },
    loss: { cls: "bg-loss", sym: "−", label: "Loss" },
    draw: { cls: "bg-draw", sym: "=", label: "Draw" },
  } as const;
  const r = map[result];
  return (
    <span
      role="img"
      aria-label={r.label}
      className={cn(
        "grid size-4 shrink-0 place-items-center rounded-[3px] text-[11px] font-bold leading-none text-white",
        r.cls,
      )}
    >
      {r.sym}
    </span>
  );
}

function GameRow({
  g,
  me,
  live,
  onReview,
  onSolve,
}: {
  g: Game;
  me: string;
  /** True when `g.id` is a real Chess.com game the links can carry. */
  live?: boolean;
  onReview?: () => void;
  onSolve?: () => void;
}) {
  const whiteWon = g.whiteScore === 1;
  const blackWon = g.blackScore === 1;
  const hasPuzzles = g.reviewed && g.blindSpots > 0;
  const reviewHref = live ? `/review?game=${g.id}` : "/review";
  const solveHref = live
    ? `/puzzles/game-based?game=${g.id}`
    : "/puzzles/game-based";
  return (
    <tr className="group border-t border-line/30 transition-colors odd:bg-white/[0.022] hover:bg-white/[0.05]">
      {/* Time / type */}
      <td className="py-2.5 pl-4 pr-1">
        <div className="flex w-12 flex-col items-center gap-0.5 text-ink-soft">
          <Image src={GAME_ICON[g.timeClass]} width={18} height={18} alt="" />
          <span className="whitespace-nowrap text-2xs font-semibold">
            {g.timeControl}
          </span>
        </div>
      </td>

      {/* Players */}
      <td className="py-2.5 pl-1 pr-2">
        <div className="flex flex-col gap-1.5">
          <PlayerLine p={g.white} isWinner={whiteWon} me={me} />
          <PlayerLine p={g.black} isWinner={blackWon} me={me} />
        </div>
      </td>

      {/* Result — stacked scores + a win/loss/draw glyph */}
      <td className="px-2 py-2.5">
        <div className="flex items-center justify-center gap-2">
          <div className="flex flex-col items-center gap-0.5 text-[13px] font-semibold leading-none tabular-nums text-ink/85">
            <span>{fmtScore(g.whiteScore)}</span>
            <span>{fmtScore(g.blackScore)}</span>
          </div>
          <ResultIcon result={g.result} />
        </div>
      </td>

      {/* Accuracy — numbers once reviewed, otherwise a Review button */}
      <td className="px-2 py-2.5 text-center">
        {g.reviewed && g.accuracy ? (
          <div className="flex flex-col gap-1 text-xs font-semibold tabular-nums text-ink-muted">
            <span>{g.accuracy.white.toFixed(1)}</span>
            <span>{g.accuracy.black.toFixed(1)}</span>
          </div>
        ) : (
          <Button size="sm" variant="secondary" asChild>
            <Link href={reviewHref} onClick={onReview}>
              Review
            </Link>
          </Button>
        )}
      </td>

      {/* Moves */}
      <td className="px-2 py-2.5 text-center text-[13px] font-semibold tabular-nums text-ink-muted">
        {g.moves}
      </td>

      {/* Puzzles — Solve button when the game has blind spots, else a dash */}
      <td className="px-2 py-2.5 text-center">
        {hasPuzzles ? (
          <Button size="sm" variant="secondary" asChild>
            <Link href={solveHref} onClick={onSolve}>
              Solve
            </Link>
          </Button>
        ) : g.reviewed ? (
          // Reviewed with nothing in it — said out loud, because a dash beside
          // an accuracy reads as a button that failed to render.
          <span
            className="text-2xs font-semibold text-ink-faint"
            title="No mistakes to drill — you played this one cleanly"
          >
            Clean
          </span>
        ) : (
          <span className="text-2xs font-semibold text-ink-faint">–</span>
        )}
      </td>

      {/* Date */}
      <td className="whitespace-nowrap px-2 py-2.5 text-center text-xs font-medium text-ink-soft">
        {g.date}
      </td>

      {/* Favorite */}
      <td className="py-2.5 pl-1 pr-4 text-right">
        <FavoriteHeart label={`${g.white.username} vs ${g.black.username}`} />
      </td>
    </tr>
  );
}

/** The dashboard's Game History: the connected archive, or the sample game. */
export function RecentGames() {
  const { profile, games, status } = useChessAccount();
  const { reviews, puzzles, request, requestPuzzles } = useReviews();
  const live = games.length > 0;

  /** How many of today's puzzles each game gave up. */
  const mined = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of puzzles) counts[p.gameId] = (counts[p.gameId] ?? 0) + 1;
    return counts;
  }, [puzzles]);

  const rows = live
    ? games.slice(0, 10).map((g) => {
        const row = toGame(g);
        // The archive carries no country per player; we only know our own.
        const flag = flagOf(profile?.country ?? undefined) || undefined;
        if (g.userSide === "white") row.white.countryFlag = flag;
        else row.black.countryFlag = flag;
        // Our own review wins over Chess.com's, since it is what the puzzles
        // and the review page are built from.
        const review = reviews[g.id];
        row.accuracy = review?.accuracy ?? g.accuracies;
        row.reviewed = row.accuracy != null;
        // Puzzles already built, or mistakes our review found. A game only
        // Chess.com has reviewed counts too — Solve reviews it on the spot,
        // rather than showing an accuracy beside a dash.
        row.blindSpots =
          mined[g.id] ??
          (review?.source === "chesscom" && review.accuracy
            ? 1
            : (review?.mistakes ?? 0));
        return row;
      })
    : recentGames;
  const me = live ? (profile?.username ?? "") : meUsername;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Game History</CardTitle>
        <Button variant="link" size="sm" className="px-0" asChild>
          <Link href="/games">View All Games</Link>
        </Button>
      </CardHeader>

      {status === "loading" && !live && (
        <p className="border-t border-line/30 px-4 py-3 text-[13px] text-ink-soft">
          Pulling your games from Chess.com…
        </p>
      )}

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="bg-surface-sunken text-2xs font-bold uppercase tracking-wide text-ink-faint">
              <th scope="col" className="py-2 pl-4 pr-1">
                <span className="sr-only">Time control</span>
              </th>
              <th scope="col" className="py-2 pl-1 pr-2 text-left font-bold">
                Players
              </th>
              <th scope="col" className="px-2 py-2 text-center font-bold">
                Result
              </th>
              <th scope="col" className="px-2 py-2 text-center font-bold">
                Accuracy
              </th>
              <th scope="col" className="px-2 py-2 text-center font-bold">
                Moves
              </th>
              <th scope="col" className="px-2 py-2 text-center font-bold">
                Puzzles
              </th>
              <th scope="col" className="px-2 py-2 text-center font-bold">
                Date
              </th>
              <th scope="col" className="py-2 pl-1 pr-4 text-right font-bold">
                <span className="sr-only">Favorite</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((g) => (
              <GameRow
                key={g.id}
                g={g}
                me={me}
                live={live}
                onReview={live ? () => request(g.id) : undefined}
                onSolve={live ? () => requestPuzzles(g.id) : undefined}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
