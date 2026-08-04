"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronUp, ChevronDown } from "lucide-react";

import { moveTypeIcon, MOVE_LABEL, ICON } from "@/lib/assets";
import type { MoveClassification } from "@/types";
import type { ReviewModel, PhaseRating } from "@/lib/pgn";
import { cn } from "@/lib/utils";

/**
 * Count-digit colours. These match the move-classification art, but `blunder`
 * and `great` are lightened from the base tokens so the small bold numbers
 * clear WCAG AA (4.5:1) on the dark surface.
 */
const COUNT_COLOR: Record<MoveClassification, string> = {
  brilliant: "#35cdb0",
  great: "#7ba7cc",
  book: "#b99a76",
  best: "#94c561",
  excellent: "#a6c78a",
  good: "#b6b6a8",
  inaccuracy: "#f0c15c",
  mistake: "#ef9a3f",
  missed: "#e6ab52",
  blunder: "#e8706a",
};

const RATING_WORD: Record<PhaseRating, string> = {
  great: "great",
  good: "good",
  ok: "okay",
};

/**
 * Phase ratings reuse the move-classification badge art (descending green
 * ladder) instead of generic thumbs/checks, matching the design.
 */
const PHASE_MOVE_ICON: Record<PhaseRating, MoveClassification> = {
  great: "best",
  good: "excellent",
  ok: "good",
};

/**
 * Shared 3-column grid (label · player 1 · player 2) so every row's player
 * values line up under the two username headers. Matches the Figma's three
 * equal 150.67px tracks inside the 452px panel content.
 */
const GRID = "grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)] items-center";

function Row({
  label,
  labelClass,
  p1,
  center,
  p2,
  className,
}: {
  label?: React.ReactNode;
  labelClass?: string;
  p1?: React.ReactNode;
  /** Overlaid icon sitting on the boundary between the two player columns. */
  center?: React.ReactNode;
  p2?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative", GRID, className)}>
      <span
        className={cn(
          "min-w-0 truncate text-[14px] font-semibold tracking-[-0.01em] text-white",
          labelClass,
        )}
      >
        {label}
      </span>
      <span className="flex justify-center">{p1}</span>
      <span className="flex justify-center">{p2}</span>
      {center ? (
        <span className="pointer-events-none absolute left-2/3 top-1/2 grid size-6 -translate-x-1/2 -translate-y-1/2 place-items-center">
          {center}
        </span>
      ) : null}
    </div>
  );
}

/** Accuracy / Game-Rating value box: solid white for White, translucent for Black. */
function Pill({ children, filled }: { children: React.ReactNode; filled?: boolean }) {
  return (
    <span
      className={cn(
        "grid h-9 w-16 place-items-center rounded-[5px] text-[17px] font-bold tabular-nums",
        filled ? "bg-white text-[#312e2b]" : "bg-white/[0.06] text-white",
      )}
    >
      {children}
    </span>
  );
}

/** 64px square avatar; the user's side carries a green frame (as in the design). */
function PlayerAvatar({ highlighted, alt }: { highlighted?: boolean; alt: string }) {
  return (
    <span
      className={cn(
        "block size-16 overflow-hidden rounded-[5px] bg-surface-sunken",
        highlighted && "border-[3px] border-brand",
      )}
    >
      <Image
        src={ICON.noAvatar}
        alt={alt}
        width={64}
        height={64}
        unoptimized
        className="h-full w-full object-cover"
      />
    </span>
  );
}

function PhaseIcon({ rating, srLabel }: { rating: PhaseRating; srLabel: string }) {
  return (
    <Image
      src={moveTypeIcon(PHASE_MOVE_ICON[rating])}
      width={24}
      height={24}
      alt={srLabel}
    />
  );
}

function Divider() {
  return <div className="my-2 h-px bg-line/50" />;
}

/**
 * The Chess.com Game Review "overview" table: a username header, Players and
 * Accuracy rows, the collapsible per-classification counts, then Game Rating
 * and the phase ratings — all sharing one 3-column grid so the two players'
 * values line up top to bottom.
 */
export function OverviewStats({
  model,
  className,
}: {
  model: ReviewModel;
  className?: string;
}) {
  const [expanded, setExpanded] = React.useState(true);
  const { white, black, accuracy, counts, gameRating, phases } = model;

  return (
    <div className={className}>
      {/* Column headers — the two usernames */}
      <Row
        p1={
          <span className="max-w-full truncate text-center text-[13px] font-semibold text-ink-soft">
            {white.username}
          </span>
        }
        p2={
          <span className="max-w-full truncate text-center text-[13px] font-semibold text-ink-soft">
            {black.username}
          </span>
        }
        className="pb-1"
      />

      <Row
        label="Players"
        p1={<PlayerAvatar alt={`${white.username} avatar`} />}
        p2={
          <PlayerAvatar
            alt={`${black.username} avatar`}
            highlighted={model.userSide === "black"}
          />
        }
        className="min-h-16"
      />
      <Row
        label="Accuracy"
        p1={<Pill filled>{accuracy.white}</Pill>}
        p2={<Pill>{accuracy.black}</Pill>}
        className="min-h-11"
      />

      {/* Per-classification counts (collapsible) */}
      {expanded &&
        counts.map((row) => (
          <Row
            key={row.classification}
            label={MOVE_LABEL[row.classification]}
            labelClass="font-medium"
            className="min-h-10"
            p1={
              <span
                className="text-[16px] font-bold tabular-nums"
                style={{ color: COUNT_COLOR[row.classification] }}
              >
                {row.white}
              </span>
            }
            center={
              <Image
                src={moveTypeIcon(row.classification)}
                width={24}
                height={24}
                alt=""
              />
            }
            p2={
              <span
                className="text-[16px] font-bold tabular-nums"
                style={{ color: COUNT_COLOR[row.classification] }}
              >
                {row.black}
              </span>
            }
          />
        ))}

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        aria-label={
          expanded ? "Collapse move breakdown" : "Expand move breakdown"
        }
        className="flex w-full items-center justify-center py-1.5 text-ink-soft transition-colors hover:text-ink"
      >
        {expanded ? (
          <ChevronUp className="size-5" />
        ) : (
          <ChevronDown className="size-5" />
        )}
      </button>

      <Divider />

      <Row
        label="Game Rating"
        p1={<Pill filled>{gameRating.white}</Pill>}
        p2={<Pill>{gameRating.black}</Pill>}
        className="min-h-11"
      />
      {phases.map((p) => (
        <Row
          key={p.phase}
          label={p.phase}
          labelClass="font-medium"
          className="min-h-10"
          p1={
            <PhaseIcon
              rating={p.white}
              srLabel={`${white.username}, ${p.phase}: ${RATING_WORD[p.white]}`}
            />
          }
          p2={
            <PhaseIcon
              rating={p.black}
              srLabel={`${black.username}, ${p.phase}: ${RATING_WORD[p.black]}`}
            />
          }
        />
      ))}
    </div>
  );
}
