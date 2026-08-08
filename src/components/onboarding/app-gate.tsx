"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

import { useChessAccount } from "@/hooks/use-chess-account";
import { useReviews } from "@/hooks/use-reviews";
import { WELCOME_PATH, RETURN_KEY, SKIP_KEY, read, write } from "@/lib/onboarding";

/**
 * Holds the app back until there is a real account behind it.
 *
 * Setup is a page of its own at {@link WELCOME_PATH} rather than a sheet over
 * the dashboard: an overlay still has the dashboard underneath it, so the
 * server sends a whole home page of sample numbers that shows for a beat before
 * the client can decide anybody is logged in. Nothing renders here until that
 * decision is made, so there is nothing to flash.
 */
export function AppGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, status, ready, promptNonce } = useChessAccount();
  const { sweep } = useReviews();

  const onWelcome = pathname === WELCOME_PATH;

  /** False until this route is known to be showable — the app stays unmounted. */
  const [open, setOpen] = React.useState(false);
  /**
   * Set once the app has been let through. Setup is a thing that happens on the
   * way in, not a state to be sent back to: a sweep picking up a game played
   * since the last visit, or the archive quietly refreshing behind a restored
   * one, both make the app "busy" again — and neither is a reason to throw
   * somebody out of the page they are on.
   */
  const openedRef = React.useRef(false);

  // Logging out takes the "just looking" pass with it, so setup comes back.
  React.useEffect(() => {
    if (promptNonce > 0) {
      openedRef.current = false;
      write(SKIP_KEY, "");
    }
  }, [promptNonce]);

  /*
    Having an account is the whole test.

    This used to also wait on the sweep, which meant every reload of a fully
    cached account was thrown out to /welcome to watch "Analysing your last 10
    games" for five seconds before being let back in — analysing nothing, since
    the answers were already on disk. The wait belongs to setting up, and
    setting up happens on /welcome, which holds people there itself. Anyone who
    already has an account has already been through it.
  */
  React.useEffect(() => {
    if (onWelcome || !ready) return;
    if (openedRef.current || read(SKIP_KEY) || profile) {
      openedRef.current = true;
      setOpen(true);
      return;
    }
    // Remember where they were headed; setup hands them back to it.
    setOpen(false);
    write(RETURN_KEY, pathname);
    router.replace(WELCOME_PATH);
  }, [onWelcome, ready, profile, pathname, router]);

  if (onWelcome) return <>{children}</>;
  // A plain field of the app's own background: no logo, no spinner, no wait
  // implied — this is the sliver before the redirect, not a loading screen.
  return open ? <>{children}</> : <div className="min-h-screen bg-bg" />;
}
