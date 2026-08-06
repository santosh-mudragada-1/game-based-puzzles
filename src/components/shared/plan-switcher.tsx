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
 * Sits in the sidebar's bottom cluster above Search, styled as one of its rows.
 * Every gate it flips — the daily limit, the paywall card, the Upgrade CTA —
 * reads from the same plan context the real UI does.
 */
export function PlanSwitcher({ onNavigate }: { onNavigate?: () => void }) {
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

  const premium = plan === "premium";

  return (
    <div ref={rootRef} className="relative">
      {/* Opens to the side, like the nav flyouts, so it never covers the rail. */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute bottom-0 left-full z-50 pl-2"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -6 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              role="menu"
              aria-label="Switch plan"
              className="w-[212px] rounded-[8px] border border-line/60 bg-surface-sunken p-1.5 shadow-pop"
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
                      onNavigate?.();
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* A compact round control rather than a full nav row — it isn't part of
          the product, so it shouldn't read like one of the real rail items. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Preview as ${premium ? "Premium" : "Free"} — switch plan`}
        title={`Prototype: previewing the ${premium ? "Premium" : "Free"} plan`}
        className={cn(
          "grid size-9 place-items-center rounded-full border border-line/70 bg-surface-sunken/90 shadow-card transition",
          "hover:brightness-125 active:translate-y-px",
          open
            ? "text-ink opacity-100"
            : "text-ink-soft opacity-60 hover:opacity-100",
        )}
      >
        {premium ? (
          <Image src={ICON.upgrade} width={16} height={16} alt="" />
        ) : (
          <FlaskConical className="size-[15px]" strokeWidth={2.25} />
        )}
      </button>
    </div>
  );
}
