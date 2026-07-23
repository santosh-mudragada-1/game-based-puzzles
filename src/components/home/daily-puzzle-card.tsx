import { MiniBoard } from "@/components/board/mini-board";
import { Button } from "@/components/shared/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/shared/card";
import { dailyPuzzle } from "@/data/home";
import { formatNumber } from "@/lib/utils";

export function DailyPuzzleCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Puzzle</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full">
          <MiniBoard
            fen={dailyPuzzle.fen}
            orientation={dailyPuzzle.orientation}
            showCoordinates={false}
          />
        </div>
        <p className="mt-3 font-display text-[15px] font-bold text-ink">
          {dailyPuzzle.title}
        </p>
        <p className="text-xs text-ink-soft">
          Solved by {formatNumber(dailyPuzzle.solvedBy)} players
        </p>
        <div className="mt-3">
          <Button variant="secondary" className="w-full">
            Solve Daily Puzzle
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
