import Image from "next/image";
import { Button } from "@/components/shared/button";
import { homeStreakDays, quickPlayActions } from "@/data/home";
import type { QuickPlayKind } from "@/types";
import { ICON } from "@/lib/assets";

/** Official Chess.com glyph per quick-play action. */
const KIND_ICON: Record<QuickPlayKind, string> = {
  time: ICON.playTime,
  online: ICON.playOnline,
  bots: ICON.playBots,
  coach: ICON.coach,
  friend: ICON.handshake,
};

/**
 * Quick-play column — sits directly on the hero container (no card wrapper):
 * the streak header + five play buttons with bold labels.
 */
export function QuickPlayCard() {
  return (
    <div className="flex flex-col px-1 pt-1">
      <div className="flex items-center gap-2 pb-1">
        <Image src={ICON.streak} width={28} height={28} alt="" />
        <p className="font-display text-xl font-bold text-ink">
          <span className="tabular-nums">{homeStreakDays}</span> Days
        </p>
      </div>

      <div className="mt-3 flex flex-1 flex-col gap-2">
        {quickPlayActions.map((action) => (
          <Button
            key={action.label}
            type="button"
            variant="secondary"
            size="lg"
            className="h-14 w-full justify-start gap-3 text-[15px] font-bold [&_svg]:size-6"
          >
            <Image
              src={KIND_ICON[action.kind]}
              width={26}
              height={26}
              alt=""
            />
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
