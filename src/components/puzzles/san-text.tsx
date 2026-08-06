import type { PieceColor } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Letter → piece in the "Chess" figurine font (see the @font-face in
 * globals.css).
 *
 * The font's own convention is outlines for White and solids for Black, which
 * inverts on a dark panel: an outline reads as hollow, so the *solid* glyph is
 * what looks like a white piece here. White therefore takes the filled set and
 * Black the outlined one.
 */
const PIECE_GLYPH: Record<PieceColor, Record<string, string>> = {
  white: { K: "l", Q: "w", R: "t", B: "n", N: "j", P: "o" },
  black: { K: "k", Q: "q", R: "r", B: "b", N: "h", P: "p" },
};

/**
 * A move in figurine notation, the way Chess.com writes it: the piece as a
 * glyph, then the square. "Rd1" becomes ♖d1, "exd5" becomes ♙xd5.
 *
 * The glyph is a real font character, so it inherits the surrounding colour and
 * scales with the text — no image to align.
 */
export function SanText({
  san,
  color,
  className,
  /** Glyph size; the font's pieces run small, so this is usually text + ~35%. */
  glyphClassName,
}: {
  san: string;
  /** Side that played the move — picks the outlined or solid glyph. */
  color: PieceColor;
  className?: string;
  glyphClassName?: string;
}) {
  // Only a leading piece letter takes a glyph. Pawn moves ("e4", "cxd5") and
  // castling are written plainly, as they are everywhere else in chess.
  const glyph = PIECE_GLYPH[color][san[0] ?? ""];

  return (
    <span className={cn("inline-flex items-baseline gap-[1px]", className)}>
      {glyph && (
        <span
          aria-hidden="true"
          className={cn("font-chess font-normal leading-none", glyphClassName)}
        >
          {glyph}
        </span>
      )}
      <span>{glyph ? san.slice(1) : san}</span>
      {/* The glyph is decorative; screen readers get the plain notation. */}
      <span className="sr-only">{san}</span>
    </span>
  );
}
