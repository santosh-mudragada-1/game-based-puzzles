import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { PuzzlesScreen } from "@/features/puzzles/puzzles";

export const metadata: Metadata = {
  title: "Puzzles — Chess.com",
};

export default function PuzzlesPage() {
  return (
    <AppShell fullBleed activeNav="Puzzles">
      <PuzzlesScreen />
    </AppShell>
  );
}
