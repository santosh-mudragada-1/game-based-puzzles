"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Check, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";

import { dayLabel } from "@/hooks/use-version";
import { cn } from "@/lib/utils";

/**
 * The day being drilled, and the month it sits in.
 *
 * Version 2 treats puzzles as a diary rather than a queue, so the first thing
 * the screen has to answer is "which day". Collapsed it is a stepper — previous
 * day, the date, next day. Opened it is the month, with a tick on every day
 * that has been cleared and the days that produced nothing left plain, so the
 * calendar doubles as the record of what has been done.
 */

const WEEKDAYS = ["M", "T", "W", "TH", "F", "S", "S"];

/** Days in a month, and the weekday its 1st falls on (Monday = 0). */
function monthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7; // JS weeks start Sunday; ours Monday
  const days = new Date(year, month + 1, 0).getDate();
  return { lead, days };
}

const keyOf = (y: number, m: number, d: number) =>
  `${y}-${`${m + 1}`.padStart(2, "0")}-${`${d}`.padStart(2, "0")}`;

interface DayPickerProps {
  /** The day on screen. */
  day: string | null;
  /** Every day that produced puzzles. */
  days: string[];
  /** Days whose puzzles have all been solved. */
  cleared?: string[];
  onPick: (day: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part: "stepper" | "calendar";
}

export function DayPicker({
  day,
  days,
  cleared = [],
  onPick,
  open,
  onOpenChange,
  /** The stepper sits above the coach; the month opens below it. */
  part,
}: DayPickerProps) {
  const setOpen = (v: boolean) => onOpenChange(v);
  const available = React.useMemo(() => new Set(days), [days]);
  const done = React.useMemo(() => new Set(cleared), [cleared]);

  const active = day ?? days[0] ?? null;
  const [y, m] = active
    ? active.split("-").map(Number)
    : [new Date().getFullYear(), new Date().getMonth() + 1];
  const [cursor, setCursor] = React.useState({ year: y, month: m - 1 });

  // Following the chosen day into its own month, so stepping across a boundary
  // doesn't leave the calendar looking at the wrong one.
  React.useEffect(() => {
    if (!active) return;
    const [ay, am] = active.split("-").map(Number);
    setCursor({ year: ay, month: am - 1 });
  }, [active]);

  /** Ordered newest-first, so "previous" means further back in time. */
  const index = active ? days.indexOf(active) : -1;
  const older = index >= 0 && index < days.length - 1 ? days[index + 1] : null;
  const newer = index > 0 ? days[index - 1] : null;

  const { lead, days: count } = monthGrid(cursor.year, cursor.month);
  const monthName = new Date(cursor.year, cursor.month, 1).toLocaleDateString(
    "en-US",
    { month: "long", year: "numeric" },
  );

  const step = (delta: number) =>
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  if (part === "stepper") {
    return (
      <div className="px-5 pt-3">
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          aria-label="Previous day with puzzles"
          disabled={!older}
          onClick={() => older && onPick(older)}
          className="grid size-9 place-items-center rounded-[6px] bg-white/[0.06] text-ink-soft transition-colors hover:bg-white/[0.1] hover:text-ink disabled:pointer-events-none disabled:opacity-35"
        >
          <ChevronLeft className="size-5" />
        </button>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="flex h-9 items-center gap-2 rounded-[6px] bg-white/[0.06] px-3 text-[14px] font-semibold text-ink transition-colors hover:bg-white/[0.1]"
        >
          {open ? (
            <X className="size-[18px] text-ink-soft" />
          ) : (
            <>
              <Calendar className="size-[18px] text-ink-soft" />
              {active ? dayLabel(active) : "No games yet"}
              <ChevronDown className="size-4 text-ink-soft" />
            </>
          )}
        </button>

        <button
          type="button"
          aria-label="Next day with puzzles"
          disabled={!newer}
          onClick={() => newer && onPick(newer)}
          className="grid size-9 place-items-center rounded-[6px] bg-white/[0.06] text-ink-soft transition-colors hover:bg-white/[0.1] hover:text-ink disabled:pointer-events-none disabled:opacity-35"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
      </div>
    );
  }

  return (
    <div className="px-5">
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="pb-1 pt-1">
              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() => step(-1)}
                  className="grid size-8 place-items-center rounded-[6px] text-ink-soft transition-colors hover:bg-white/[0.06] hover:text-ink"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <span className="font-display text-[17px] font-bold text-white">
                  {monthName}
                </span>
                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() => step(1)}
                  className="grid size-8 place-items-center rounded-[6px] text-ink-soft transition-colors hover:bg-white/[0.06] hover:text-ink"
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>

              <div className="mt-4 grid grid-cols-7 gap-1 text-center">
                {WEEKDAYS.map((w, i) => (
                  <span
                    key={`${w}-${i}`}
                    className="pb-1 text-[10px] font-bold uppercase tracking-wide text-ink-faint"
                  >
                    {w}
                  </span>
                ))}
                {Array.from({ length: lead }, (_, i) => (
                  <span key={`lead-${i}`} />
                ))}
                {Array.from({ length: count }, (_, i) => {
                  const d = i + 1;
                  const key = keyOf(cursor.year, cursor.month, d);
                  const has = available.has(key);
                  const isDone = done.has(key);
                  const isActive = key === active;
                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={!has}
                      onClick={() => {
                        onPick(key);
                        setOpen(false);
                      }}
                      aria-current={isActive ? "date" : undefined}
                      className={cn(
                        "relative grid h-10 place-items-center rounded-[6px] text-[14px] font-semibold transition-colors",
                        isActive
                          ? "bg-brand text-white"
                          : has
                            ? "bg-white/[0.07] text-ink hover:bg-white/[0.12]"
                            : "text-ink-faint/60",
                      )}
                    >
                      {isDone && !isActive && (
                        <Check className="absolute top-0.5 size-3 text-brand" strokeWidth={3} />
                      )}
                      <span className={cn(isDone && !isActive && "mt-2")}>{d}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
