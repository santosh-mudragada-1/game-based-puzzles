import Image from "next/image";
import { pieceImage } from "@/lib/chess";
import type { PieceColor } from "@/types";
import { cn } from "@/lib/utils";

/** SAN piece letters — anything else leads a pawn move ("e4", "exd5"). */
const PIECE_LETTERS = "KQRBN";

/**
 * A move written the way Chess.com writes it: the piece as a glyph, then the
 * square.
 *
 * Chess.com sets that glyph in its proprietary "Chess" typeface, which isn't
 * ours to ship, so the piece is drawn from the board art already in /public and
 * sized to the surrounding text. Same reading, no licensing problem — and it
 * matches the pieces on the board beside it exactly.
 */
export function SanText({
  san,
  color,
  className,
  glyph = 24,
}: {
  san: string;
  /** Side that played the move — picks the white or black glyph. */
  color: PieceColor;
  className?: string;
  /** Glyph box in px; pick it to match the line height of the text. */
  glyph?: number;
}) {
  const head = san[0] ?? "";
  const isPiece = PIECE_LETTERS.includes(head);
  const base = isPiece ? head : "P";
  const letter = color === "white" ? base : base.toLowerCase();
  const rest = isPiece ? san.slice(1) : san;

  return (
    <span className={cn("inline-flex items-center gap-px", className)}>
      <Image
        src={pieceImage(letter)}
        alt=""
        width={glyph}
        height={glyph}
        // The art carries transparent margins where a font glyph would not, so
        // it is set oversized and pulled back in to keep the line height honest.
        className="-my-2 inline-block shrink-0"
        style={{ width: glyph, height: glyph }}
      />
      <span>{rest}</span>
    </span>
  );
}
