"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";

import { Avatar } from "@/components/shared/avatar";
import { FavoriteHeart } from "@/components/dashboard/favorite-heart";
import { useChessAccount } from "@/hooks/use-chess-account";
import { flagOf, type ArchivedGame } from "@/lib/chesscom";
import { GAME_ICON } from "@/lib/assets";
import { cn } from "@/lib/utils";

const TABS = ["All", "Favorites", "Live", "Daily", "Bot", "Coach"] as const;
type Tab = (typeof TABS)[number];

/** Chess.com's time-class glyphs; anything unusual falls back to the puzzle icon. */
const CLASS_ICON: Record<string, string> = {
  rapid: GAME_ICON.rapid,
  blitz: GAME_ICON.blitz,
  bullet: GAME_ICON.bullet,
  daily: GAME_ICON.daily,
};

/** The small pill buttons in a row — Review and Solve share it. */
const ROW_BTN =
  "inline-flex h-8 w-full items-center justify-center rounded-[6px] bg-gradient-to-b from-white/[0.1] to-white/[0.05] px-3 text-[13px] font-semibold text-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:from-white/[0.14] hover:to-white/[0.08] active:translate-y-px";

/** Games per page — enough to fill the screen, few enough to stay snappy. */
const PAGE_SIZE = 25;

const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

function PlayerLine({
  name,
  rating,
  country,
  side,
  isMe,
  won,
}: {
  name: string;
  rating: number;
  country?: string;
  side: "white" | "black";
  isMe: boolean;
  won: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar size={20} alt="" />
      <span
        aria-hidden
        className={cn(
          "size-3 shrink-0 rounded-[2px] border",
          side === "white"
            ? "border-black/25 bg-board-light"
            : "border-white/15 bg-[#403d39]",
        )}
      />
      <span
        className={cn(
          "max-w-[14rem] truncate text-[13px]",
          isMe || won ? "font-bold text-ink" : "font-semibold text-ink-muted",
        )}
      >
        {name}
      </span>
      <span className="shrink-0 text-xs text-ink-faint">({rating})</span>
      {country && (
        <span className="shrink-0 text-xs leading-none" aria-hidden>
          {flagOf(country)}
        </span>
      )}
    </div>
  );
}

/** Green +, red −, grey = from the account holder's point of view. */
function ResultIcon({ result }: { result: ArchivedGame["result"] }) {
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
  game,
  me,
  myCountry,
}: {
  game: ArchivedGame;
  me: string;
  myCountry?: string;
}) {
  const lower = me.toLowerCase();
  const whiteWon = game.white.result === "win";
  const blackWon = game.black.result === "win";
  const score = (won: boolean, drawn: boolean) =>
    drawn ? "½" : won ? "1" : "0";
  const drawn = game.result === "draw";

  return (
    <div className="flex items-center gap-3 border-t border-line/30 px-4 py-3 transition-colors odd:bg-white/[0.022] hover:bg-white/[0.05]">
      {/* Time class + control */}
      <div className="flex w-14 shrink-0 flex-col items-center gap-0.5 text-ink-soft">
        <Image
          src={CLASS_ICON[game.timeClass] ?? GAME_ICON.puzzleGrey}
          width={20}
          height={20}
          alt={game.timeClass}
        />
        <span className="whitespace-nowrap text-2xs font-semibold">
          {game.timeControl}
        </span>
      </div>

      {/* Both players */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <PlayerLine
          name={game.white.username}
          rating={game.white.rating}
          country={
            game.white.username.toLowerCase() === lower ? myCountry : undefined
          }
          side="white"
          isMe={game.white.username.toLowerCase() === lower}
          won={whiteWon}
        />
        <PlayerLine
          name={game.black.username}
          rating={game.black.rating}
          country={
            game.black.username.toLowerCase() === lower ? myCountry : undefined
          }
          side="black"
          isMe={game.black.username.toLowerCase() === lower}
          won={blackWon}
        />
      </div>

      {/* Score + result glyph */}
      <div className="flex shrink-0 items-center gap-2">
        <div className="flex flex-col items-center gap-0.5 text-[13px] font-semibold leading-none tabular-nums text-ink/85">
          <span>{score(whiteWon, drawn)}</span>
          <span>{score(blackWon, drawn)}</span>
        </div>
        <ResultIcon result={game.result} />
      </div>

      {/* Chess.com's own accuracies, when it has already reviewed the game */}
      <div className="w-[52px] shrink-0 text-center">
        {game.accuracies ? (
          <div className="flex flex-col gap-1 text-xs font-semibold tabular-nums text-ink-muted">
            <span>{game.accuracies.white.toFixed(1)}</span>
            <span>{game.accuracies.black.toFixed(1)}</span>
          </div>
        ) : (
          <span className="text-2xs font-semibold text-ink-faint">–</span>
        )}
      </div>

      {/* Our own review — the PGN goes to Stockfish when this is clicked */}
      <div className="w-[86px] shrink-0 text-center">
        <Link href={`/review?game=${game.id}`} className={ROW_BTN}>
          Review
        </Link>
      </div>

      {/* Drill the mistakes this game gave up */}
      <div className="w-[76px] shrink-0 text-center">
        <Link href="/puzzles/game-based" className={ROW_BTN}>
          Solve
        </Link>
      </div>

      <span className="w-9 shrink-0 text-center text-[13px] font-semibold tabular-nums text-ink-muted">
        {game.moves}
      </span>

      <span className="w-[104px] shrink-0 whitespace-nowrap text-center text-xs font-medium text-ink-soft">
        {DATE_FMT.format(new Date(game.endTime * 1000))}
      </span>

      <div className="shrink-0">
        <FavoriteHeart
          label={`${game.white.username} vs ${game.black.username}`}
        />
      </div>
    </div>
  );
}

/** A row-shaped shimmer, so the list has a shape while the months come in. */
function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 border-t border-line/30 px-4 py-3">
      <div className="h-9 w-14 shrink-0 animate-pulse rounded bg-white/[0.05]" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="h-3.5 w-52 animate-pulse rounded bg-white/[0.05]" />
        <div className="h-3.5 w-44 animate-pulse rounded bg-white/[0.05]" />
      </div>
      <div className="h-8 w-[86px] shrink-0 animate-pulse rounded bg-white/[0.05]" />
      <div className="h-8 w-[76px] shrink-0 animate-pulse rounded bg-white/[0.05]" />
      <div className="h-4 w-[104px] shrink-0 animate-pulse rounded bg-white/[0.05]" />
    </div>
  );
}

/** Page numbers with ellipses — first, last and a window around the current. */
function pageWindow(page: number, count: number): (number | "gap")[] {
  if (count <= 7)
    return Array.from({ length: count }, (_, i) => i + 1);
  const out: (number | "gap")[] = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(count - 1, page + 1);
  if (from > 2) out.push("gap");
  for (let i = from; i <= to; i++) out.push(i);
  if (to < count - 1) out.push("gap");
  out.push(count);
  return out;
}

function Pagination({
  page,
  pageCount,
  onGo,
}: {
  page: number;
  pageCount: number;
  onGo: (p: number) => void;
}) {
  const btn =
    "grid h-9 min-w-9 place-items-center rounded-[6px] px-2.5 text-[13px] font-semibold transition-colors disabled:pointer-events-none disabled:opacity-40";
  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-center gap-1 border-t border-line/30 px-4 py-3"
    >
      <button
        type="button"
        aria-label="Previous page"
        onClick={() => onGo(page - 1)}
        disabled={page === 1}
        className={cn(btn, "text-ink-soft hover:bg-white/[0.06] hover:text-ink")}
      >
        <ChevronLeft className="size-4" />
      </button>

      {pageWindow(page, pageCount).map((p, i) =>
        p === "gap" ? (
          <span key={`gap-${i}`} className="px-1 text-ink-faint">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onGo(p)}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              btn,
              p === page
                ? "bg-brand text-white"
                : "text-ink-soft hover:bg-white/[0.06] hover:text-ink",
            )}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        aria-label="Next page"
        onClick={() => onGo(page + 1)}
        disabled={page === pageCount}
        className={cn(btn, "text-ink-soft hover:bg-white/[0.06] hover:text-ink")}
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}

/**
 * Screen: the full Chess.com game archive for the connected account.
 *
 * Reached from "View All Games" on the dashboard. The tab row, the count
 * dropdown and the sort control follow Chess.com's own archive page; the rows
 * are the same shape as the dashboard's Game History so the two read as one
 * thing at two sizes.
 */
export function GameHistory() {
  const { profile, games, status, progress } = useChessAccount();
  const [tab, setTab] = React.useState<Tab>("All");
  const [query, setQuery] = React.useState("");
  const [searching, setSearching] = React.useState(false);
  const [newestFirst, setNewestFirst] = React.useState(true);
  const [page, setPage] = React.useState(1);

  const me = profile?.username ?? "";

  const filtered = React.useMemo(() => {
    let list = games;
    if (tab === "Live")
      list = list.filter((g) => g.timeClass !== "daily" && !g.vsBot);
    else if (tab === "Daily") list = list.filter((g) => g.timeClass === "daily");
    else if (tab === "Bot") list = list.filter((g) => g.vsBot);
    else if (tab === "Coach") list = [];
    else if (tab === "Favorites") list = [];

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (g) =>
          g.white.username.toLowerCase().includes(q) ||
          g.black.username.toLowerCase().includes(q),
      );
    }
    return newestFirst ? list : [...list].reverse();
  }, [games, tab, query, newestFirst]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const shown = filtered.slice(
    (current - 1) * PAGE_SIZE,
    current * PAGE_SIZE,
  );

  // Any change to what's being listed puts you back at the top of it.
  React.useEffect(() => setPage(1), [tab, query, newestFirst]);

  const loading = status === "loading";

  return (
    <div className="mx-auto w-full max-w-[1084px]">
      {/* Header */}
      <div className="flex items-center gap-3.5 px-4 pb-5 pt-4">
        {profile?.avatar ? (
          <Avatar size={40} rounded="md" src={profile.avatar} alt="" />
        ) : (
          <Image src={GAME_ICON.games} width={40} height={40} alt="" />
        )}
        <h1 className="truncate font-display text-[27px] font-black text-white/90">
          {me ? `${me}'s Game History` : "Game History"}
        </h1>
      </div>

      <div className="overflow-hidden rounded-[6px] bg-surface">
        {/* Tabs */}
        <div className="flex items-center border-b border-line/40 px-0">
          <div className="flex min-w-0 flex-1">
            {TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                aria-current={t === tab ? "true" : undefined}
                className={cn(
                  "relative flex-1 px-2 py-5 text-[14px] font-semibold transition-colors",
                  t === tab
                    ? "text-white"
                    : "text-ink-soft hover:text-ink-muted",
                )}
              >
                {t}
                {t === tab && (
                  <span className="absolute inset-x-0 bottom-0 h-[3px] bg-brand" />
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 pr-2">
            {searching && (
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search opponent…"
                className="h-9 w-48 rounded-[6px] border border-line/70 bg-black/25 px-3 text-[13px] text-white outline-none placeholder:text-ink-faint focus:border-brand"
              />
            )}
            <button
              type="button"
              aria-label="Search games"
              onClick={() => {
                setSearching((v) => !v);
                if (searching) setQuery("");
              }}
              className="grid size-12 place-items-center text-ink-soft transition-colors hover:text-ink"
            >
              <Search className="size-5" />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2">
          <span className="inline-flex items-center gap-1.5 rounded-[6px] px-2 py-1.5 text-[14px] font-semibold text-ink-muted">
            All Games ({filtered.length})
            <ChevronDown className="size-4 text-ink-soft" />
          </span>
          <button
            type="button"
            onClick={() => setNewestFirst((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-[6px] px-2 py-1.5 text-[14px] font-semibold text-ink-muted transition-colors hover:text-ink"
          >
            Date: {newestFirst ? "Latest First" : "Oldest First"}
            <ChevronDown className="size-4 text-ink-soft" />
          </button>
        </div>

        {/* Rows */}
        <div>
          {shown.map((g) => (
            <GameRow
              key={g.id}
              game={g}
              me={me}
              myCountry={profile?.country ?? undefined}
            />
          ))}

          {loading &&
            Array.from({ length: filtered.length > 0 ? 2 : 6 }).map((_, i) => (
              <RowSkeleton key={`sk-${i}`} />
            ))}

          {!loading && filtered.length === 0 && (
            <p className="border-t border-line/30 px-4 py-16 text-center text-[14px] text-ink-soft">
              {games.length === 0
                ? "No games loaded yet — connect a Chess.com account from the dashboard."
                : tab === "Coach" || tab === "Favorites"
                  ? `Nothing under ${tab} for this account.`
                  : "No games match that search."}
            </p>
          )}
        </div>

        {pageCount > 1 && (
          <Pagination page={current} pageCount={pageCount} onGo={setPage} />
        )}

        {loading && progress.total > 0 && (
          <p className="border-t border-line/30 px-4 py-3 text-center text-[13px] text-ink-soft">
            Loading {progress.label} — {progress.done} of {progress.total} months
          </p>
        )}
      </div>
    </div>
  );
}
