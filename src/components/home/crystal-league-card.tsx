import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { crystalLeague } from "@/data/home";
import { ICON } from "@/lib/assets";

/** Ordinal suffix for a place: 1st, 2nd, 3rd, 11th, 21st ... */
function ordinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

export function CrystalLeagueCard() {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-card border border-line/70 bg-surface p-4 text-left shadow-card transition-colors hover:bg-surface-hover"
    >
      <Image
        src={ICON.crystalLeague}
        width={40}
        height={25}
        alt=""
        className="shrink-0"
      />
      <span className="flex min-w-0 flex-col">
        <span className="font-display text-sm font-bold text-ink">
          {crystalLeague.name}
        </span>
        <span className="text-xs text-ink-soft">
          You are in {ordinal(crystalLeague.place)} place
        </span>
      </span>
      <ChevronRight className="ml-auto size-4 text-ink-faint" />
    </button>
  );
}
