"use client";

import * as React from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

/** A per-row favorite toggle for the Game History table. */
export function FavoriteHeart({ label }: { label: string }) {
  const [fav, setFav] = React.useState(false);
  return (
    <button
      type="button"
      onClick={() => setFav((v) => !v)}
      aria-pressed={fav}
      aria-label={
        fav ? `Remove ${label} from favorites` : `Add ${label} to favorites`
      }
      className="grid size-8 place-items-center rounded-[6px] text-ink-faint transition-colors hover:bg-white/[0.06] hover:text-ink"
    >
      <Heart className={cn("size-[18px]", fav && "fill-loss text-loss")} />
    </button>
  );
}
