import Image from "next/image";
import {
  boardFromFen,
  cellsForOrientation,
  pieceImage,
  pieceLabel,
} from "@/lib/chess";
import type { PieceColor } from "@/types";
import { cn } from "@/lib/utils";

interface MiniBoardProps {
  fen: string;
  orientation?: PieceColor;
  /** Algebraic squares to spotlight, e.g. ["e4", "c6"]. */
  highlight?: string[];
  /** Squares to ring as a hint/solution target. */
  hint?: string[];
  showCoordinates?: boolean;
  sideToMove?: PieceColor;
  rounded?: boolean;
  className?: string;
}

/**
 * Renders a FEN as a static Chess.com board (default green/cream theme).
 * Square-responsive: it fills the width of its container.
 */
export function MiniBoard({
  fen,
  orientation = "white",
  highlight = [],
  hint = [],
  showCoordinates = false,
  sideToMove,
  rounded = true,
  className,
}: MiniBoardProps) {
  const grid = boardFromFen(fen);
  const cells = cellsForOrientation(grid, orientation);
  const highlightSet = new Set(highlight);
  const hintSet = new Set(hint);

  return (
    <div
      role="img"
      aria-label={`Chess position${sideToMove ? `, ${sideToMove} to move` : ""}`}
      className={cn(
        "grid aspect-square w-full grid-cols-8 overflow-hidden ring-1 ring-black/25",
        rounded && "rounded-[4px]",
        className,
      )}
    >
      {cells.map((cell, i) => {
        const row = Math.floor(i / 8);
        const col = i % 8;
        const isBottomEdge = row === 7;
        const isLeftEdge = col === 0;
        const coordColor = cell.light ? "text-board-dark" : "text-board-light";

        return (
          <div
            key={cell.square}
            className={cn(
              "relative",
              cell.light ? "bg-board-light" : "bg-board-dark",
            )}
          >
            {highlightSet.has(cell.square) && (
              <div className="absolute inset-0 bg-board-highlight/55" />
            )}
            {hintSet.has(cell.square) && (
              <div className="absolute inset-[9%] rounded-full ring-[3px] ring-brand/80" />
            )}

            {cell.piece && (
              <Image
                src={pieceImage(cell.piece)}
                alt={pieceLabel(cell.piece)}
                fill
                sizes="(max-width: 640px) 12vw, 64px"
                className="select-none object-contain p-[5%]"
                draggable={false}
                priority={false}
              />
            )}

            {showCoordinates && isBottomEdge && (
              <span
                className={cn(
                  "pointer-events-none absolute bottom-[2px] right-[3px] text-[8px] font-bold leading-none opacity-80",
                  coordColor,
                )}
              >
                {cell.square[0]}
              </span>
            )}
            {showCoordinates && isLeftEdge && (
              <span
                className={cn(
                  "pointer-events-none absolute left-[3px] top-[2px] text-[8px] font-bold leading-none opacity-80",
                  coordColor,
                )}
              >
                {cell.square[1]}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
