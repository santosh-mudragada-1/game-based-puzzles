import Image from "next/image";

import { Button } from "@/components/shared/button";
import { ICON } from "@/lib/assets";
import { cn } from "@/lib/utils";

interface PremiumUpgradeCardProps {
  className?: string;
}

export function PremiumUpgradeCard({ className }: PremiumUpgradeCardProps) {
  return (
    <div className={cn("rounded-card border border-info/25 bg-info/[0.06] p-4", className)}>
      <div className="flex items-center gap-2">
        <Image src={ICON.upgrade} width={22} height={22} alt="" />
        <span className="font-display text-sm font-bold text-ink">Go Platinum</span>
      </div>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
        Unlock Game Based Puzzles from every reviewed game with Platinum — not just one a day.
      </p>
      <Button variant="secondary" size="sm" className="mt-3">
        Learn More
      </Button>
    </div>
  );
}
