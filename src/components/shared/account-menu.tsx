"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LogOut, RefreshCw } from "lucide-react";

import { Avatar } from "@/components/shared/avatar";
import { useChessAccount } from "@/hooks/use-chess-account";
import { currentUser } from "@/data";
import { flagOf } from "@/lib/chesscom";
import { cn } from "@/lib/utils";

/**
 * The signed-in member at the foot of the rail.
 *
 * Shows the connected Chess.com account — photo, name, live rating — and is
 * where you disconnect it, which puts the username prompt back on screen.
 */
export function AccountMenu({ onNavigate }: { onNavigate?: () => void }) {
  const { profile, games, status, connect, disconnect } = useChessAccount();
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const name = profile?.username ?? currentUser.displayName;
  const rating = profile?.stats.rapid?.rating ?? currentUser.ratings.rapid;

  return (
    <div ref={rootRef} className="relative">
      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute bottom-full left-0 z-50 w-full min-w-[232px] pb-2"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          >
            <div
              role="menu"
              className="rounded-[8px] border border-line/60 bg-surface-sunken p-1.5 shadow-pop"
            >
              {profile ? (
                <>
                  <div className="px-2 pb-2 pt-1.5">
                    <p className="truncate text-[13px] font-bold text-ink">
                      {profile.name || profile.username}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-ink-soft">
                      Connected to Chess.com · {games.length} games
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(
                        [
                          ["Rapid", profile.stats.rapid?.rating],
                          ["Blitz", profile.stats.blitz?.rating],
                          ["Bullet", profile.stats.bullet?.rating],
                        ] as const
                      )
                        .filter(([, r]) => r != null)
                        .map(([label, r]) => (
                          <span
                            key={label}
                            className="rounded-[4px] bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-semibold text-ink-muted"
                          >
                            {label} {r}
                          </span>
                        ))}
                    </div>
                  </div>

                  <div className="my-1 h-px bg-line/60" />

                  <button
                    type="button"
                    role="menuitem"
                    disabled={status === "loading"}
                    onClick={() => {
                      setOpen(false);
                      void connect(profile.username, true);
                    }}
                    className={MENU_ITEM}
                  >
                    <RefreshCw className="size-4 shrink-0" />
                    Refresh games
                  </button>
                </>
              ) : (
                <p className="px-2 py-2 text-[12px] text-ink-soft">
                  No Chess.com account connected.
                </p>
              )}

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  disconnect();
                  onNavigate?.();
                }}
                className={cn(MENU_ITEM, "text-[#e0625c] hover:text-[#e88b86]")}
              >
                <LogOut className="size-4 shrink-0" />
                {profile ? "Log out" : "Connect an account"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 rounded-[6px] px-2 py-1.5 transition-colors hover:bg-white/[0.04]"
      >
        <Avatar size={30} src={profile?.avatar} alt={name} />
        <span className="min-w-0 flex-1 text-left">
          <span className="block truncate text-sm font-semibold text-ink">
            {name}
          </span>
          {profile && (
            <span className="block truncate text-[11px] text-ink-soft">
              {rating ? `${rating}` : "unrated"}
              {profile.country ? ` ${flagOf(profile.country)}` : ""}
            </span>
          )}
        </span>
        <ChevronDown className="size-4 shrink-0 text-ink-soft" />
      </button>
    </div>
  );
}

const MENU_ITEM =
  "flex w-full items-center gap-2.5 rounded-[6px] px-2 py-2 text-left text-[13px] font-semibold text-ink-muted transition-colors hover:bg-white/[0.06] hover:text-ink disabled:pointer-events-none disabled:opacity-50";
