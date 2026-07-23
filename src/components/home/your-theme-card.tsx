import Image from "next/image";
import { pieceImage } from "@/lib/chess";
import { cn } from "@/lib/utils";

// A tiny 3x2 board swatch previewing the active (default green/cream) theme.
const SWATCH: string[] = [
  "K", "B", "N", // white back-rank sample
  "q", "r", "k", // black sample
];

export function YourThemeCard() {
  return (
    <button
      type="button"
      aria-label="Your board theme: Green"
      className="flex w-full items-center justify-between gap-3 overflow-hidden rounded-card border border-line/70 bg-surface p-4 text-left shadow-card transition-colors hover:bg-surface-hover"
    >
      <span className="font-display text-sm font-bold text-ink">Your theme</span>

      <span
        aria-hidden="true"
        className="grid shrink-0 grid-cols-3 overflow-hidden rounded-[4px] ring-1 ring-black/25"
      >
        {SWATCH.map((piece, i) => {
          const row = Math.floor(i / 3);
          const col = i % 3;
          const light = (row + col) % 2 === 0;
          return (
            <span
              key={i}
              className={cn(
                "relative block size-11",
                light ? "bg-board-light" : "bg-board-dark",
              )}
            >
              <Image
                src={pieceImage(piece)}
                alt=""
                fill
                sizes="44px"
                className="object-contain p-[14%]"
              />
            </span>
          );
        })}
      </span>
    </button>
  );
}
