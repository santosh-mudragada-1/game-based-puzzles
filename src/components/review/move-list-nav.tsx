"use client";

import * as React from "react";
import Image from "next/image";
import { notablePlySet, type ReviewModel, type ReviewPly } from "@/lib/pgn";
import { moveTypeIcon, MOVE_COLOR, MOVE_LABEL } from "@/lib/assets";
import { cn } from "@/lib/utils";

function MoveCell({
  ply,
  currentPly,
  onSeek,
  currentRef,
}: {
  ply?: ReviewPly;
  currentPly: number;
  onSeek: (ply: number) => void;
  currentRef: React.RefObject<HTMLButtonElement | null>;
}) {
  if (!ply) return <span aria-hidden="true" />;
  const isCurrent = ply.ply === currentPly;
  // Only "important" moves carry an icon — the list stays uncluttered.
  const notable = notablePlySet.has(ply.ply);
  return (
    <button
      ref={isCurrent ? currentRef : undefined}
      type="button"
      onClick={() => onSeek(ply.ply)}
      aria-current={isCurrent ? "true" : undefined}
      aria-label={`${ply.moveNo}${ply.side === "white" ? "." : "…"} ${ply.san}${notable ? ", " + MOVE_LABEL[ply.classification] : ""}`}
      className={cn(
        "flex items-center gap-1.5 rounded px-1.5 py-1 text-left transition-colors",
        isCurrent ? "bg-surface-hover" : "hover:bg-surface-hover",
      )}
    >
      {notable ? (
        <Image
          src={moveTypeIcon(ply.classification)}
          width={16}
          height={16}
          alt=""
          className="shrink-0"
        />
      ) : null}
      <span
        className={cn(
          "text-[13px] font-semibold",
          isCurrent
            ? notable
              ? MOVE_COLOR[ply.classification]
              : "text-ink"
            : "text-ink-muted",
        )}
      >
        {ply.san}
      </span>
    </button>
  );
}

interface Row {
  no: number;
  white?: ReviewPly;
  black?: ReviewPly;
}

/** Navigable, numbered move list; only notable moves show a classification icon. */
export function MoveListNav({
  model,
  currentPly,
  onSeek,
  className,
}: {
  model: ReviewModel;
  currentPly: number;
  onSeek: (ply: number) => void;
  className?: string;
}) {
  const currentRef = React.useRef<HTMLButtonElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Keep the active move in view within the list only — never scroll ancestors.
  React.useEffect(() => {
    const el = currentRef.current;
    const box = listRef.current;
    if (el && box) {
      const top =
        el.getBoundingClientRect().top -
        box.getBoundingClientRect().top +
        box.scrollTop;
      const bottom = top + el.offsetHeight;
      if (top < box.scrollTop) box.scrollTop = top - 8;
      else if (bottom > box.scrollTop + box.clientHeight)
        box.scrollTop = bottom - box.clientHeight + 8;
    }
  }, [currentPly]);

  const rows: Row[] = [];
  const byNo = new Map<number, Row>();
  for (const p of model.plies) {
    let row = byNo.get(p.moveNo);
    if (!row) {
      row = { no: p.moveNo };
      byNo.set(p.moveNo, row);
      rows.push(row);
    }
    if (p.side === "white") row.white = p;
    else row.black = p;
  }

  return (
    <div ref={listRef} className={cn("relative scrollbar-thin overflow-y-auto", className)}>
      {rows.map((row) => (
        <div
          key={row.no}
          className="grid grid-cols-[2.25rem_1fr_1fr] items-center border-b border-line/20 px-1 text-[13px] odd:bg-white/[0.015]"
        >
          <span className="tabular-nums text-ink-faint">{row.no}.</span>
          <MoveCell
            ply={row.white}
            currentPly={currentPly}
            onSeek={onSeek}
            currentRef={currentRef}
          />
          <MoveCell
            ply={row.black}
            currentPly={currentPly}
            onSeek={onSeek}
            currentRef={currentRef}
          />
        </div>
      ))}
    </div>
  );
}
