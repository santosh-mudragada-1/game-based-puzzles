import type { PieceColor } from "@/types";

/** FEN piece letter -> piece PNG basename in /public/chess-pieces. */
export const PIECE_TO_IMAGE: Record<string, string> = {
  P: "pawn-white",
  N: "knight-white",
  B: "bishop-white",
  R: "rook-white",
  Q: "queen-white",
  K: "king-white",
  p: "pawn-black",
  n: "knight-black",
  b: "bishop-black",
  r: "rook-black",
  q: "queen-black",
  k: "king-black",
};

export interface BoardCell {
  /** Algebraic name, e.g. "e4". */
  square: string;
  /** FEN piece letter, or null for an empty square. */
  piece: string | null;
  /** True for a light (cream) square. */
  light: boolean;
}

/** Where each king stands, for the win/loss badges. */
export function kingSquares(cells: BoardCell[]): Record<PieceColor, string> {
  const out = { white: "", black: "" };
  for (const c of cells) {
    if (c.piece === "K") out.white = c.square;
    else if (c.piece === "k") out.black = c.square;
  }
  return out;
}

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

/**
 * Parse the placement field of a FEN string into an 8x8 grid.
 * Row 0 is rank 8; column 0 is the a-file (i.e. White's back rank on the
 * bottom when rendered for White). Rendering flips this for orientation.
 */
export function boardFromFen(fen: string): BoardCell[][] {
  const placement = fen.trim().split(/\s+/)[0] ?? "";
  const ranks = placement.split("/");
  const grid: BoardCell[][] = [];

  for (let r = 0; r < 8; r++) {
    const rankNumber = 8 - r;
    const row: BoardCell[] = [];
    const chars = ranks[r] ?? "8";

    for (const ch of chars) {
      if (/\d/.test(ch)) {
        const empties = parseInt(ch, 10);
        for (let i = 0; i < empties; i++) {
          row.push(makeCell(row.length, rankNumber, null));
        }
      } else {
        row.push(makeCell(row.length, rankNumber, ch));
      }
    }
    // Pad short/invalid ranks defensively so the board always renders 8x8.
    while (row.length < 8) row.push(makeCell(row.length, rankNumber, null));
    grid.push(row.slice(0, 8));
  }
  return grid;
}

function makeCell(
  fileIndex: number,
  rankNumber: number,
  piece: string | null,
): BoardCell {
  return {
    square: `${FILES[fileIndex]}${rankNumber}`,
    piece,
    // a1 is dark; a square is light when file+rank is even.
    light: (fileIndex + rankNumber) % 2 === 0,
  };
}

/**
 * Flatten the grid into display order for a given orientation.
 * White: rank 8 -> 1, files a -> h. Black: mirrored.
 */
export function cellsForOrientation(
  grid: BoardCell[][],
  orientation: PieceColor,
): BoardCell[] {
  const rows = orientation === "white" ? grid : [...grid].reverse();
  return rows.flatMap((row) =>
    orientation === "white" ? row : [...row].reverse(),
  );
}

export const pieceImage = (letter: string) =>
  `/chess-pieces/${PIECE_TO_IMAGE[letter]}.png`;

export const PIECE_NAME: Record<string, string> = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
};

/** Human label for a piece letter, e.g. "White knight" (for a11y). */
export function pieceLabel(letter: string): string {
  const color = letter === letter.toUpperCase() ? "White" : "Black";
  return `${color} ${PIECE_NAME[letter.toLowerCase()] ?? "piece"}`;
}
