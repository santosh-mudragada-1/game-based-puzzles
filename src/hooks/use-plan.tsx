"use client";

import * as React from "react";
import type { PlanTier } from "@/types";

const STORAGE_KEY = "gbp:plan";

interface PlanContextValue {
  plan: PlanTier;
  setPlan: (plan: PlanTier) => void;
  /** False until the stored plan has been read, so nothing flashes the wrong tier. */
  ready: boolean;
}

const PlanContext = React.createContext<PlanContextValue>({
  plan: "free",
  setPlan: () => {},
  ready: false,
});

/**
 * Membership tier for the whole app.
 *
 * Lives in context rather than a URL param because upgrading has to reach the
 * sidebar (which drops "Upgrade") as well as the puzzle queue, without a
 * navigation that would throw away the session in progress. Persisted so the
 * upgrade survives a reload; `?plan=` still works for jumping straight into
 * either flow.
 */
export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [plan, setPlanState] = React.useState<PlanTier>("free");
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("plan");
    if (param === "premium" || param === "platinum" || param === "diamond") {
      setPlanState("premium");
    } else if (param === "free") {
      setPlanState("free");
    } else {
      try {
        if (window.localStorage.getItem(STORAGE_KEY) === "premium") {
          setPlanState("premium");
        }
      } catch {
        // Private mode / storage disabled — free is the right default.
      }
    }
    setReady(true);
  }, []);

  const setPlan = React.useCallback((next: PlanTier) => {
    setPlanState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Non-fatal: the tier still applies for this session.
    }
  }, []);

  const value = React.useMemo(
    () => ({ plan, setPlan, ready }),
    [plan, setPlan, ready],
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan(): PlanContextValue {
  return React.useContext(PlanContext);
}
