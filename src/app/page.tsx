import { AppShell } from "@/components/layout/app-shell";
import { Home } from "@/features/game-based-puzzles/home";

export default function Page() {
  return (
    <AppShell>
      <Home />
    </AppShell>
  );
}
