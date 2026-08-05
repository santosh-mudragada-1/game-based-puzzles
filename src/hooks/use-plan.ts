"use client";

import * as React from "react";
import type { PlanTier } from "@/types";

/**
 * Which membership the prototype is demoing.
 *
 * Driven by `?plan=premium` on the URL rather than a control in the UI, so both
 * flows can be shown back to back without adding anything to the main screens.
 * Free is the default, which is also what a cold visitor should see.
 */
export function usePlan(): PlanTier {
  const [plan, setPlan] = React.useState<PlanTier>("free");

  React.useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("plan");
    if (p === "premium" || p === "platinum" || p === "diamond") {
      setPlan("premium");
    }
  }, []);

  return plan;
}
