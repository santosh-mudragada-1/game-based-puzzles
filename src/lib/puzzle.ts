import { Chess, type Square } from "chess.js";
import type { PieceColor } from "@/types";

/** Legal destination squares for the piece on `square` (click-to-move dots). */
export function legalTargets(fen: string, square: string): string[] {
  try {
    const g = new Chess(fen);
    return g.moves({ square: square as Square, verbose: true }).map((m) => m.to);
  } catch {
    return [];
  }
}

/** Colour of the piece on a square, or null if empty (for pick-up rules). */
export function pieceColorAt(fen: string, square: string): PieceColor | null {
  try {
    const g = new Chess(fen);
    const p = g.get(square as Square);
    return p ? (p.color === "w" ? "white" : "black") : null;
  } catch {
    return null;
  }
}

/** FEN letter of the piece on a square (uppercase = white), or null if empty. */
export function pieceAt(fen: string, square: string): string | null {
  try {
    const g = new Chess(fen);
    const p = g.get(square as Square);
    return p ? (p.color === "w" ? p.type.toUpperCase() : p.type) : null;
  } catch {
    return null;
  }
}

/** The position after playing a move, or null when it isn't legal in `fen`. */
export function fenAfterMove(
  fen: string,
  from: string,
  to: string,
): string | null {
  try {
    const g = new Chess(fen);
    g.move({ from, to, promotion: "q" });
    return g.fen();
  } catch {
    return null;
  }
}

/** Square of the king in check, if any (to paint it red). */
export function checkedKingSquare(fen: string): string | null {
  try {
    const g = new Chess(fen);
    if (!g.isCheck()) return null;
    const turn = g.turn();
    for (const row of g.board()) {
      for (const sq of row) {
        if (sq && sq.type === "k" && sq.color === turn) return sq.square;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Render an eval-bar label from a Stockfish score (user-positive). Only shows a
 * game result on actual checkmate, "M{n}" for a genuine forced mate, and a
 * signed pawn value otherwise — so it never claims "1-0" or "M1" incorrectly.
 */
export function evalLabel(
  cp: number,
  mate: number | null,
  isMate: boolean,
  userSide: PieceColor,
): string {
  if (isMate) return userSide === "white" ? "1-0" : "0-1";
  if (mate != null) return `${mate < 0 ? "−" : ""}M${Math.abs(mate)}`;
  const p = cp / 100;
  if (Math.abs(p) < 0.05) return "0.0";
  return `${p > 0 ? "+" : "−"}${Math.abs(p).toFixed(1)}`;
}
