import Image from "next/image";
import { ChevronRight } from "lucide-react";
import type { GeneratedPuzzle } from "@/types";
import { moveTypeIcon, MOVE_LABEL } from "@/lib/assets";
import { cn } from "@/lib/utils";

export function PuzzlePreviewItem({
  puzzle,
  className,
}: {
  puzzle: GeneratedPuzzle;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "group flex w-full items-center gap-3 rounded-control px-2.5 py-2 text-left transition-colors hover:bg-surface-hover",
        className,
      )}
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-[8px] bg-white/[0.05]">
        <Image
          src={moveTypeIcon(puzzle.classification)}
          width={22}
          height={22}
          alt=""
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-sm font-bold text-ink">
          {puzzle.title}
        </span>
        <span className="block truncate text-2xs font-medium text-ink-soft">
          Move {puzzle.moveNo} · {MOVE_LABEL[puzzle.classification]}
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-ink-muted" />
    </button>
  );
}
