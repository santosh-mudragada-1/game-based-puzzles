import * as React from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { PuzzleSolver } from "@/features/game-based-puzzles/puzzle-solver";

export const metadata: Metadata = {
  title: "Game Based Puzzles — Chess.com",
};

export default function GameBasedPuzzlesPage() {
  return (
    <AppShell fullBleed activeNav="Puzzles">
      {/* useSearchParams needs a boundary so the shell can still prerender. */}
      <React.Suspense fallback={null}>
        <PuzzleSolver />
      </React.Suspense>
    </AppShell>
  );
}
