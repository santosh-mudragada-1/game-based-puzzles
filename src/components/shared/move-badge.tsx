import Image from "next/image";
import type { MoveClassification } from "@/types";
import { moveTypeIcon, MOVE_LABEL, MOVE_COLOR } from "@/lib/assets";
import { cn } from "@/lib/utils";

interface MoveBadgeProps {
  classification: MoveClassification;
  /** Override the default classification label (e.g. a puzzle theme). */
  label?: string;
  size?: number;
  showLabel?: boolean;
  className?: string;
}

/**
 * A move-classification chip: the official Chess.com badge art + a colored
 * label. Reused across the review summary, move list and puzzle items.
 */
export function MoveBadge({
  classification,
  label,
  size = 20,
  showLabel = true,
  className,
}: MoveBadgeProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <Image
        src={moveTypeIcon(classification)}
        alt=""
        width={size}
        height={size}
        className="shrink-0"
      />
      {showLabel && (
        <span
          className={cn(
            "text-xs font-semibold leading-none",
            MOVE_COLOR[classification],
          )}
        >
          {label ?? MOVE_LABEL[classification]}
        </span>
      )}
    </span>
  );
}
