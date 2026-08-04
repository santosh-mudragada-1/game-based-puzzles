import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

interface ReviewStatusProps {
  label?: string;
  className?: string;
}

export function ReviewStatus({
  label = "Review Complete",
  className,
}: ReviewStatusProps) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <span className="grid size-6 place-items-center rounded-full bg-brand text-white">
        <Check className="size-4" strokeWidth={3} aria-hidden="true" />
      </span>
      <span className="font-display text-sm font-bold text-ink">{label}</span>
    </div>
  );
}
