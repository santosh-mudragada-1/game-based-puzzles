import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { GameReview } from "@/features/game-based-puzzles/game-review";

export const metadata: Metadata = {
  title: "Game Review — Chess.com",
};

export default function ReviewPage() {
  return (
    <AppShell fullBleed>
      <GameReview />
    </AppShell>
  );
}
