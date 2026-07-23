import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full font-semibold leading-none whitespace-nowrap",
  {
    variants: {
      variant: {
        neutral: "bg-white/[0.06] text-ink-muted",
        brand: "bg-brand/15 text-brand",
        gold: "bg-gold/15 text-gold",
        info: "bg-info/15 text-info",
        danger: "bg-loss/15 text-loss",
        outline: "border border-line text-ink-muted",
      },
      size: {
        sm: "px-2 py-0.5 text-2xs",
        md: "px-2.5 py-1 text-xs",
      },
    },
    defaultVariants: { variant: "neutral", size: "sm" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    />
  );
}
