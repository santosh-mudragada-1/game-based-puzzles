import * as React from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { ArchivedReview } from "@/features/games/archived-review";

export const metadata: Metadata = {
  title: "Game Review — Chess.com",
};

export default function ReviewPage() {
  return (
    <AppShell fullBleed>
      {/* useSearchParams needs a boundary so the shell can still prerender. */}
      <React.Suspense fallback={null}>
        <ArchivedReview />
      </React.Suspense>
    </AppShell>
  );
}
