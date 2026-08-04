import Image from "next/image";
import type { MoveClassification } from "@/types";
import { LOGO, moveTypeIcon } from "@/lib/assets";
import { cn } from "@/lib/utils";

interface CoachBubbleProps {
  /** The coach's spoken line about the current move. */
  text: string;
  /** Optional evaluation string shown as a grey pill (e.g. "+1.2"). */
  evalText?: string;
  /** Optional move classification badge shown before the text. */
  classification?: MoveClassification;
  className?: string;
}

/**
 * Chess.com's Game Review coach: a tall square coach portrait paired with a
 * white speech bubble (dark text) whose pointer tail aims back at the coach.
 * Optionally led by a move-classification badge and tailed by a grey eval pill
 * for the per-move review state. Pure/static — content via props.
 */
export function CoachBubble({
  text,
  evalText,
  classification,
  className,
}: CoachBubbleProps) {
  return (
    <div className={cn("flex items-end gap-0", className)}>
      <Image
        src={LOGO.coach}
        width={96}
        height={96}
        alt="Coach"
        className="size-24 shrink-0 rounded-[2px] object-contain"
      />
      <div className="relative min-w-0 flex-1">
        {/* Pointer tail aiming back at the coach portrait */}
        <span
          aria-hidden="true"
          className="absolute -left-1.5 top-5 size-0 border-y-[7px] border-r-[9px] border-y-transparent border-r-white"
        />
        <div className="min-h-16 rounded-[10px] bg-white px-4 py-3">
          <div className="flex items-start gap-1.5">
            {classification ? (
              <Image
                src={moveTypeIcon(classification)}
                width={20}
                height={20}
                alt=""
                className="mt-0.5 shrink-0"
              />
            ) : null}
            <p className="flex-1 text-[15px] font-medium leading-5 tracking-[-0.01em] text-[#312e2b]">
              {text}
            </p>
            {evalText ? (
              <span className="shrink-0 self-start rounded-md bg-black/10 px-1.5 py-0.5 text-2xs font-bold tabular-nums text-[#312e2b]">
                {evalText}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
