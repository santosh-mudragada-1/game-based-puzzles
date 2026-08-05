"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Check, FlaskConical } from "lucide-react";

import { usePlan } from "@/hooks/use-plan";
import { ICON } from "@/lib/assets";
import { cn } from "@/lib/utils";
import type { PlanTier } from "@/types";

const OPTIONS: { plan: PlanTier; label: string; blurb: string }[] = [
  { plan: "free", label: "Free Plan", blurb: "3 puzzles a day" },
  { plan: "premium", label: "Premium Plan", blurb: "The whole queue" },
];

/**
 * A prototype-only switch between the Free and Premium experiences, so a
 * reviewer can see both without clearing storage or editing a URL.
 *
 * Deliberately a small floating control rather than anything in the product
 * chrome — it isn't part of the design, and every gate it flips (the daily
 * limit, the paywall card, the sidebar Upgrade CTA) reads from the same plan
 * context the real UI does.
 */
export function PlanSwitcher() {
  const { plan, setPlan } = usePlan();
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  // Click-away and Escape close the popover.
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    // Raised clear of the bottom bar: every screen puts its primary CTA in the
    // bottom-right (Solve / Start Review / the puzzle-nav arrows), and measuring
    // each route showed 100px is the first offset that lands on nothing clickable.
    <div ref={rootRef} className="fixed bottom-[100px] right-3 z-[100] print:hidden">
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label="Switch plan"
            className="absolute bottom-11 right-0 w-[212px] overflow-hidden rounded-[10px] border border-line/70 bg-surface-sunken p-1.5 shadow-pop"
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="px-2 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-wide text-ink-faint">
              Preview as
            </p>
            {OPTIONS.map((o) => {
              const active = plan === o.plan;
              return (
                <button
                  key={o.plan}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => {
                    setPlan(o.plan);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-[7px] px-2 py-2 text-left transition-colors",
                    active ? "bg-white/[0.07]" : "hover:bg-white/[0.05]",
                  )}
                >
                  {o.plan === "premium" ? (
                    <Image src={ICON.upgrade} width={18} height={18} alt="" />
                  ) : (
                    <span className="grid size-[18px] place-items-center">
                      <span className="size-2.5 rounded-full border-2 border-ink-faint" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-bold text-ink">
                      {o.label}
                    </span>
                    <span className="block text-[11px] text-ink-soft">
                      {o.blurb}
                    </span>
                  </span>
                  {active && <Check className="size-4 shrink-0 text-brand" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Preview as ${plan === "premium" ? "Premium" : "Free"} — switch plan`}
        title="Prototype: switch plan"
        className={cn(
          "grid size-9 place-items-center rounded-full border border-line/70 bg-surface-sunken/90 text-ink-soft shadow-pop backdrop-blur transition",
          "hover:text-ink hover:brightness-125 active:translate-y-px",
          open ? "opacity-100" : "opacity-45 hover:opacity-100",
        )}
      >
        {plan === "premium" ? (
          <Image src={ICON.upgrade} width={16} height={16} alt="" />
        ) : (
          <FlaskConical className="size-[15px]" strokeWidth={2.25} />
        )}
      </button>
    </div>
  );
}
