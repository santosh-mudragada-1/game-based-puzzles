"use client";

import * as React from "react";
import Image from "next/image";
import { motion, useAnimationControls } from "framer-motion";
import {
  boardFromFen,
  cellsForOrientation,
  pieceImage,
  pieceLabel,
} from "@/lib/chess";
import { legalTargets, pieceColorAt } from "@/lib/puzzle";
import type { PieceColor } from "@/types";
import { cn } from "@/lib/utils";

export interface BoardArrow {
  from: string;
  to: string;
  tone: "orange" | "teal";
}

interface PuzzleBoardProps {
  fen: string;
  orientation?: PieceColor;
  /** The side the user is allowed to move (disables picking up the opponent). */
  playerSide: PieceColor;
  /** Whether the board accepts input at all. */
  interactive?: boolean;
  onMove?: (from: string, to: string) => void;
  /** Yellow move-highlight squares (e.g. the last move's from/to). */
  highlight?: string[];
  /** King-in-check square, painted red. */
  dangerSquare?: string | null;
  /** Teal ring on the piece(s) to move (the "Hint" reveal). */
  hint?: string[];
  arrows?: BoardArrow[];
  /** Increment to trigger a "wrong move" shake. */
  shakeSignal?: number;
  /** The move that produced this position — its piece slides into place. */
  lastMove?: { from: string; to: string } | null;
  showCoordinates?: boolean;
  className?: string;
}

const ARROW_COLOR: Record<BoardArrow["tone"], string> = {
  orange: "#f0810f",
  teal: "#26c2a3",
};

/** Display column/row (0–7) of a square, honouring orientation. */
function squareColRow(square: string, orientation: PieceColor) {
  const file = square.charCodeAt(0) - 97; // a=0
  const rank = Number(square[1]) - 1; // 0-based
  const col = orientation === "white" ? file : 7 - file;
  const row = orientation === "white" ? 7 - rank : rank;
  return { col, row };
}

/** Centre of a square in 0–100% board coords, honouring orientation. */
function squarePct(square: string, orientation: PieceColor) {
  const { col, row } = squareColRow(square, orientation);
  return { x: (col + 0.5) * 12.5, y: (row + 0.5) * 12.5 };
}

/** Start offset (in % of one square) so a moved piece begins on its from-square. */
function moveOffset(from: string, to: string, orientation: PieceColor) {
  const f = squareColRow(from, orientation);
  const t = squareColRow(to, orientation);
  return { x: (f.col - t.col) * 100, y: (f.row - t.row) * 100 };
}

/**
 * An interactive Chess.com board for puzzle solving. Reuses the static board's
 * green/cream theme + piece art, and adds click-to-move (with legal-move dots),
 * native drag-and-drop, hint rings, from/to arrows, and a wrong-move shake.
 */
export function PuzzleBoard({
  fen,
  orientation = "white",
  playerSide,
  interactive = true,
  onMove,
  highlight = [],
  dangerSquare,
  hint = [],
  arrows = [],
  shakeSignal = 0,
  lastMove = null,
  showCoordinates = true,
  className,
}: PuzzleBoardProps) {
  const grid = boardFromFen(fen);
  const cells = cellsForOrientation(grid, orientation);
  const [selected, setSelected] = React.useState<string | null>(null);
  const controls = useAnimationControls();

  const highlightSet = new Set(highlight);
  const hintSet = new Set(hint);
  const targets = React.useMemo(
    () => (selected ? new Set(legalTargets(fen, selected)) : new Set<string>()),
    [selected, fen],
  );

  // A new position (next puzzle / opponent reply) clears any selection.
  React.useEffect(() => setSelected(null), [fen]);

  // Shake the board on each wrong attempt.
  //
  // Only an *increase* counts. The board is remounted per puzzle, so testing
  // `shakeSignal > 0` would replay the previous puzzle's shake the moment the
  // next one appears — before the solver has put a foot wrong.
  const prevShake = React.useRef(shakeSignal);
  React.useEffect(() => {
    const rose = shakeSignal > prevShake.current;
    prevShake.current = shakeSignal;
    if (!rose) return;
    controls.start({
      x: [0, -9, 9, -7, 7, -3, 0],
      transition: { duration: 0.42, ease: "easeInOut" },
    });
  }, [shakeSignal, controls]);

  const canPickUp = (square: string) =>
    interactive && pieceColorAt(fen, square) === playerSide;

  const attempt = (from: string, to: string) => {
    setSelected(null);
    onMove?.(from, to);
  };

  const handleSquareClick = (square: string) => {
    if (!interactive) return;
    if (selected) {
      if (square === selected) {
        setSelected(null);
        return;
      }
      if (targets.has(square)) {
        attempt(selected, square);
        return;
      }
      // Clicked a different own piece → reselect; otherwise deselect.
      setSelected(canPickUp(square) ? square : null);
      return;
    }
    if (canPickUp(square)) setSelected(square);
  };

  return (
    <motion.div
      animate={controls}
      className={cn(
        "relative grid aspect-square w-full grid-cols-8 select-none overflow-hidden rounded-[4px] ring-1 ring-black/25",
        className,
      )}
    >
      {cells.map((cell, i) => {
        const row = Math.floor(i / 8);
        const col = i % 8;
        const isSel = selected === cell.square;
        const isTarget = targets.has(cell.square);
        const isCapture = isTarget && cell.piece != null;
        const coordColor = cell.light ? "text-board-dark" : "text-board-light";
        const pickable = canPickUp(cell.square);
        const isMovedPiece = !!lastMove && cell.square === lastMove.to;
        const off = isMovedPiece
          ? moveOffset(lastMove!.from, lastMove!.to, orientation)
          : null;

        const focusable = interactive && (pickable || isTarget || isSel);
        return (
          <div
            key={cell.square}
            role={interactive ? "button" : undefined}
            tabIndex={focusable ? 0 : -1}
            aria-label={
              cell.piece
                ? `${cell.square}, ${pieceLabel(cell.piece)}`
                : `${cell.square}, empty`
            }
            onClick={() => handleSquareClick(cell.square)}
            onKeyDown={(e) => {
              if (interactive && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                handleSquareClick(cell.square);
              }
            }}
            onDragOver={(e) => {
              if (interactive) e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              const from = e.dataTransfer.getData("text/plain");
              if (from && from !== cell.square) attempt(from, cell.square);
            }}
            className={cn(
              "relative",
              cell.light ? "bg-board-light" : "bg-board-dark",
              interactive && (pickable || isTarget || isSel)
                ? "cursor-pointer"
                : interactive
                  ? "cursor-default"
                  : "",
            )}
          >
            {dangerSquare === cell.square && (
              <div className="absolute inset-0 bg-[#e15353]" />
            )}
            {(highlightSet.has(cell.square) || isSel) && (
              <div className="absolute inset-0 bg-board-highlight/55" />
            )}
            {hintSet.has(cell.square) && (
              <div className="absolute inset-[7%] rounded-full ring-[3px] ring-[#26c2a3]" />
            )}

            {cell.piece && (
              <motion.div
                // Re-key the moved piece per move so it re-runs its slide-in.
                key={isMovedPiece ? `mv-${lastMove!.from}${lastMove!.to}` : "pc"}
                className="absolute inset-0 z-[1]"
                initial={off ? { x: `${off.x}%`, y: `${off.y}%` } : false}
                animate={{ x: "0%", y: "0%" }}
                transition={{ type: "spring", stiffness: 700, damping: 42, mass: 0.7 }}
              >
                <Image
                  src={pieceImage(cell.piece)}
                  alt={pieceLabel(cell.piece)}
                  fill
                  sizes="(max-width: 640px) 12vw, 64px"
                  className={cn(
                    "object-contain p-[5%]",
                    pickable ? "cursor-grab active:cursor-grabbing" : "",
                  )}
                  draggable={pickable}
                  onDragStart={(e) => {
                    if (!pickable) {
                      e.preventDefault();
                      return;
                    }
                    e.dataTransfer.setData("text/plain", cell.square);
                    e.dataTransfer.effectAllowed = "move";
                    setSelected(cell.square);
                  }}
                  priority={false}
                />
              </motion.div>
            )}

            {/* Legal-move indicators: a dot for a quiet move, a ring for a capture. */}
            {isTarget &&
              (isCapture ? (
                <div className="absolute inset-[6%] z-[2] rounded-full ring-[5px] ring-black/25" />
              ) : (
                <div className="absolute left-1/2 top-1/2 z-[2] size-[30%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/20" />
              ))}

            {showCoordinates && row === 7 && (
              <span
                className={cn(
                  "pointer-events-none absolute bottom-[2px] right-[3px] z-[2] text-[8px] font-bold leading-none opacity-80",
                  coordColor,
                )}
              >
                {cell.square[0]}
              </span>
            )}
            {showCoordinates && col === 0 && (
              <span
                className={cn(
                  "pointer-events-none absolute left-[3px] top-[2px] z-[2] text-[8px] font-bold leading-none opacity-80",
                  coordColor,
                )}
              >
                {cell.square[1]}
              </span>
            )}
          </div>
        );
      })}

      {/* Arrows overlay (played move = orange, solution = teal). */}
      {arrows.length > 0 && (
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 z-[3] size-full"
        >
          <defs>
            {(["orange", "teal"] as const).map((tone) => (
              <marker
                key={tone}
                id={`arrowhead-${tone}`}
                markerWidth="2.6"
                markerHeight="2.6"
                refX="1.3"
                refY="1.3"
                orient="auto"
              >
                <path d="M0,0 L2.6,1.3 L0,2.6 Z" fill={ARROW_COLOR[tone]} />
              </marker>
            ))}
          </defs>
          {arrows.map((a, idx) => {
            const s = squarePct(a.from, orientation);
            const e = squarePct(a.to, orientation);
            // Shorten the line so the arrowhead sits inside the target square.
            const dx = e.x - s.x;
            const dy = e.y - s.y;
            const len = Math.hypot(dx, dy) || 1;
            const back = 3.4;
            const ex = e.x - (dx / len) * back;
            const ey = e.y - (dy / len) * back;
            return (
              <line
                key={idx}
                x1={s.x}
                y1={s.y}
                x2={ex}
                y2={ey}
                stroke={ARROW_COLOR[a.tone]}
                strokeWidth={2}
                strokeLinecap="round"
                opacity={0.9}
                markerEnd={`url(#arrowhead-${a.tone})`}
              />
            );
          })}
        </svg>
      )}
    </motion.div>
  );
}
