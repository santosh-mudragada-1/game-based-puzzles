import Image from "next/image";
import type { Game, PlayerRef } from "@/types";
import { Card, CardHeader, CardTitle } from "@/components/shared/card";
import { Avatar } from "@/components/shared/avatar";
import { Badge } from "@/components/shared/badge";
import { Button } from "@/components/shared/button";
import { recentGames, meUsername } from "@/data/games";
import { GAME_ICON } from "@/lib/assets";
import { cn } from "@/lib/utils";

function PlayerLine({
  p,
  isWinner,
}: {
  p: PlayerRef;
  isWinner: boolean;
}) {
  const isMe = p.username === meUsername;
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

function ScoreBox({ score, win }: { score: number; win: boolean }) {
  return (
    <span
      className={cn(
        "grid h-5 w-5 place-items-center rounded-[3px] text-2xs font-bold tabular-nums",
        win
          ? "bg-win/25 text-win"
          : score === 0.5
            ? "bg-gold/20 text-gold"
            : "bg-white/[0.05] text-ink-soft",
      )}
    >
      {score === 0.5 ? "½" : score}
    </span>
  );
}

function GameRow({ g }: { g: Game }) {
  const whiteWon = g.whiteScore === 1;
  const blackWon = g.blackScore === 1;
  return (
    <tr className="group border-t border-line/30 transition-colors odd:bg-white/[0.022] hover:bg-white/[0.05]">
      {/* Players */}
      <td className="py-2.5 pl-4 pr-2">
        <div className="flex items-center gap-3">
          <div className="hidden w-12 shrink-0 flex-col items-center gap-0.5 text-ink-soft sm:flex">
            <Image src={GAME_ICON[g.timeClass]} width={18} height={18} alt="" />
            <span className="text-2xs font-semibold">{g.timeControl}</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <PlayerLine p={g.white} isWinner={whiteWon} />
            <PlayerLine p={g.black} isWinner={blackWon} />
          </div>
        </div>
      </td>

      {/* Result */}
      <td className="px-2 py-2.5">
        <div className="flex flex-col items-center gap-1">
          <ScoreBox score={g.whiteScore} win={whiteWon} />
          <ScoreBox score={g.blackScore} win={blackWon} />
        </div>
      </td>

      {/* Accuracy */}
      <td className="hidden px-2 py-2.5 text-center md:table-cell">
        {g.reviewed && g.accuracy ? (
          <div className="flex flex-col gap-1 text-xs font-semibold tabular-nums text-ink-muted">
            <span>{g.accuracy.white.toFixed(1)}</span>
            <span>{g.accuracy.black.toFixed(1)}</span>
          </div>
        ) : (
          <span className="text-xs text-ink-faint">—</span>
        )}
      </td>

      {/* Puzzles — only reviewed games can have them */}
      <td className="px-2 py-2.5 text-center">
        {!g.reviewed ? (
          <span className="text-2xs font-semibold text-ink-faint">—</span>
        ) : g.blindSpots > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-1 text-2xs font-bold text-ink-muted">
            <Image src={GAME_ICON.puzzleGrey} width={14} height={14} alt="" />
            {g.blindSpots}
          </span>
        ) : (
          <span className="text-2xs font-semibold text-ink-faint">Clean</span>
        )}
      </td>

      {/* Date */}
      <td className="hidden px-2 py-2.5 text-center text-xs font-medium text-ink-soft sm:table-cell">
        {g.date}
      </td>

      {/* Action — Practice needs a reviewed game; otherwise Review first */}
      <td className="py-2.5 pl-2 pr-4 text-right">
        {g.reviewed ? (
          <Button size="sm" variant="primary">
            Practice
          </Button>
        ) : (
          <Button size="sm" variant="secondary">
            Review
          </Button>
        )}
      </td>
    </tr>
  );
}

export function RecentGames() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Game History</CardTitle>
        <Button variant="link" size="sm" className="px-0">
          View All Games
        </Button>
      </CardHeader>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-surface-sunken text-2xs font-bold uppercase tracking-wide text-ink-faint">
              <th scope="col" className="py-2 pl-4 pr-2 text-left font-bold">
                Players
              </th>
              <th scope="col" className="px-2 py-2 text-center font-bold">
                Result
              </th>
              <th
                scope="col"
                className="hidden px-2 py-2 text-center font-bold md:table-cell"
              >
                Accuracy
              </th>
              <th scope="col" className="px-2 py-2 text-center font-bold">
                Puzzles
              </th>
              <th
                scope="col"
                className="hidden px-2 py-2 text-center font-bold sm:table-cell"
              >
                Date
              </th>
              <th scope="col" className="py-2 pl-2 pr-4 text-right font-bold">
                <span className="sr-only">Action</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {recentGames.map((g) => (
              <GameRow key={g.id} g={g} />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
