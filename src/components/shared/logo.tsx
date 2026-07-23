import Image from "next/image";
import { LOGO } from "@/lib/assets";

// Chess.com white wordmark lockup (pawn + "Chess.com"), aspect 1266:400.
const ASPECT = 1266 / 400;

/** Chess.com nav logo, sized by height. */
export function Logo({
  className,
  height = 28,
}: {
  className?: string;
  height?: number;
}) {
  return (
    <Image
      src={LOGO.wordmarkNav}
      alt="Chess.com"
      width={Math.round(height * ASPECT)}
      height={height}
      priority
      className={className}
    />
  );
}
