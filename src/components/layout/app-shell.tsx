"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./sidebar";
import { Logo } from "@/components/shared/logo";
import { Avatar } from "@/components/shared/avatar";
import { currentUser } from "@/data";

/**
 * The Chess.com app frame: a fixed sidebar on desktop, an off-canvas drawer
 * on smaller screens, and a two-column content area (main + right rail).
 */
export function AppShell({
  children,
  activeNav,
}: {
  children: React.ReactNode;
  /** Sidebar item to highlight; omit for the home page (none highlighted). */
  activeNav?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const drawerRef = React.useRef<HTMLDivElement>(null);

  const closeDrawer = React.useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  // Lock body scroll while the mobile drawer is open.
  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Move focus into the drawer when it opens.
  React.useEffect(() => {
    if (!open) return;
    drawerRef.current
      ?.querySelector<HTMLElement>(
        'button, a[href], [tabindex]:not([tabindex="-1"])',
      )
      ?.focus();
  }, [open]);

  // Escape to close + focus trap while the drawer is open.
  const onDrawerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      closeDrawer();
      return;
    }
    if (e.key !== "Tab") return;
    const nodes = drawerRef.current?.querySelectorAll<HTMLElement>(
      'button, a[href], input, [tabindex]:not([tabindex="-1"])',
    );
    if (!nodes || nodes.length === 0) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Desktop sidebar */}
      <Sidebar
        activeLabel={activeNav}
        className="fixed inset-y-0 left-0 z-30 hidden w-[232px] border-r border-line/60 lg:flex"
      />

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line/60 bg-surface-rail px-3 lg:hidden">
        <button
          ref={triggerRef}
          type="button"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
          className="grid size-9 place-items-center rounded-[6px] text-ink-muted hover:bg-white/[0.05] hover:text-ink"
        >
          <Menu className="size-6" />
        </button>
        <Logo height={22} />
        <div className="flex-1" />
        <Avatar size={30} alt={currentUser.displayName} />
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDrawer}
            />
            <motion.div
              ref={drawerRef}
              onKeyDown={onDrawerKeyDown}
              className="fixed inset-y-0 left-0 z-50 w-[264px] max-w-[80vw] shadow-pop lg:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              <button
                type="button"
                aria-label="Close menu"
                onClick={closeDrawer}
                className="absolute right-2 top-3 z-10 grid size-9 place-items-center rounded-[6px] text-ink-soft hover:bg-white/[0.06] hover:text-ink"
              >
                <X className="size-5" />
              </button>
              <Sidebar
                activeLabel={activeNav}
                onNavigate={() => setOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Content — the page composes its own columns so the hero can span
          full width (like chess.com) with Game History + rail below it. */}
      <div className="lg:pl-[232px]">
        <div className="mx-auto max-w-[1120px] px-3 py-5 sm:px-5 lg:px-6 lg:py-6">
          {children}
        </div>
      </div>
    </div>
  );
}
