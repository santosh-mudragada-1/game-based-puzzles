import type { ReactNode } from "react";
import Link from "next/link";
import type { PieceColor } from "@/types";
import { MiniBoard } from "@/components/board/mini-board";
import { Button, type ButtonProps } from "@/components/shared/button";

/**
 * Shared shell for the hero preview cards, matching chess.com exactly:
 * a board flush to the top edge, a compact footer, and a full-width
 * action button (centered, no trailing icon) pinned to the bottom.
 * Cards are a fixed 248px wide so the row scrolls horizontally like the design.
 */
export function PreviewCard({
  fen,
  orientation,
  action,
  actionHref,
  actionVariant = "secondary",
  children,
}: {
  fen: string;
  orientation: PieceColor;
  action: string;
  actionHref?: string;
  actionVariant?: ButtonProps["variant"];
  children: ReactNode;
}) {
  return (
    <div className="relative flex w-[248px] shrink-0 flex-col overflow-clip rounded-[5px] bg-gradient-to-b from-white/[0.1] to-white/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_2px_rgba(0,0,0,0.14),0_2px_4px_rgba(0,0,0,0.1)] transition-colors hover:from-white/[0.13] hover:to-white/[0.07]">
      {/*
        The whole card is the link, not just the button.

        A board, a progress meter and a button that all describe one destination
        should not have one clickable third. The overlay sits under the button
        (which has its own link and a higher layer), so the button still works
        and everything around it does too.
      */}
      {actionHref && (
        <Link
          href={actionHref}
          aria-label={action}
          className="absolute inset-0 z-0"
          tabIndex={-1}
        />
      )}
      <div className="pointer-events-none w-full">
        <MiniBoard
          fen={fen}
          orientation={orientation}
          rounded={false}
          showCoordinates={false}
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="pointer-events-none relative z-[1] mb-3 min-w-0">
          {children}
        </div>
        <Button
          variant={actionVariant}
          size="md"
          className="relative z-[1] mt-auto h-12 w-full text-[17px]"
          asChild={!!actionHref}
        >
          {actionHref ? <Link href={actionHref}>{action}</Link> : action}
        </Button>
      </div>
    </div>
  );
}
