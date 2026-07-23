import Image from "next/image";
import { cn } from "@/lib/utils";
import { ICON } from "@/lib/assets";

interface AvatarProps {
  /** Pixel size of the (square) avatar. */
  size?: number;
  alt?: string;
  rounded?: "sm" | "md" | "full";
  className?: string;
}

/**
 * Placeholder avatar — Chess.com's official "no photo" default (a grey pawn).
 * No real user photos are used in this prototype.
 */
export function Avatar({
  size = 32,
  alt = "Player avatar",
  rounded = "sm",
  className,
}: AvatarProps) {
  const radius =
    rounded === "full" ? "9999px" : rounded === "md" ? "6px" : "3px";

  return (
    <span
      className={cn("inline-block shrink-0 overflow-hidden", className)}
      style={{ width: size, height: size, borderRadius: radius }}
    >
      <Image
        src={ICON.noAvatar}
        alt={alt}
        width={size}
        height={size}
        className="h-full w-full object-cover"
        unoptimized
      />
    </span>
  );
}
