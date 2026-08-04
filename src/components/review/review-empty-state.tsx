import Image from "next/image";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/shared/card";
import { Button } from "@/components/shared/button";
import { GAME_ICON } from "@/lib/assets";
import { cn } from "@/lib/utils";

interface ReviewEmptyStateProps {
  className?: string;
}

/**
 * Shown on the Game Review page when a game has not been reviewed yet, so no
 * Game Based Puzzles can exist. Prompts the user to run the review first.
 */
export function ReviewEmptyState({ className }: ReviewEmptyStateProps) {
  return (
    <Card className={cn(className)}>
      <CardContent className="flex flex-col items-center gap-3 px-6 py-8 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-white/[0.05]">
          <Image src={GAME_ICON.puzzleGrey} width={32} height={32} alt="" />
        </span>
        <h2 className="font-display text-base font-bold text-ink">
          Review this game first
        </h2>
        <p className="max-w-xs text-[13px] leading-relaxed text-ink-muted">
          Game Based Puzzles are generated from your Game Review. Run the review
          to unlock personalized puzzles from your critical moments.
        </p>
        <Button size="lg" className="mt-1 w-full">
          <Sparkles />
          Start Game Review
        </Button>
      </CardContent>
    </Card>
  );
}
