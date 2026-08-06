import { AppShell } from "@/components/layout/app-shell";
import { GameHistory } from "@/features/games/game-history";

export const metadata = { title: "Game History" };

export default function Page() {
  return (
    <AppShell>
      <GameHistory />
    </AppShell>
  );
}
