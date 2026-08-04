import { Target } from "lucide-react";

import { Button } from "@/components/shared/button";
import { cn } from "@/lib/utils";

interface TrainingCTAProps {
  label?: string;
  variant?: "primary" | "secondary";
  className?: string;
}

export function TrainingCTA({
  label = "Start Training",
  variant = "primary",
  className,
}: TrainingCTAProps) {
  return (
    <Button variant={variant} size="lg" className={cn("w-full", className)}>
      <Target />
      {label}
    </Button>
  );
}
