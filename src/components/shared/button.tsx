import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Chess.com's signature "3D" button: a solid face over a darker bottom edge
 * that compresses on press. Variants mirror the real product's button system.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] font-semibold select-none " +
    "transition-[transform,background-color,box-shadow,opacity] duration-100 ease-out-quint " +
    "disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none " +
    "focus-visible:ring-2 focus-visible:ring-brand/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg " +
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 active:translate-y-[1px]",
  {
    variants: {
      variant: {
        primary:
          "bg-brand text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_1px_2px_rgba(0,0,0,0.14),0_2px_4px_rgba(0,0,0,0.10)] " +
          "hover:bg-brand-hover active:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_1px_2px_rgba(0,0,0,0.14)]",
        secondary:
          "bg-gradient-to-b from-white/[0.1] to-white/[0.05] text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_1px_2px_rgba(0,0,0,0.14),0_2px_4px_rgba(0,0,0,0.10)] " +
          "hover:from-white/[0.14] hover:to-white/[0.08] active:shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_1px_2px_rgba(0,0,0,0.14)]",
        gold:
          "bg-gold text-[#2a1c07] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_1px_2px_rgba(0,0,0,0.14),0_2px_4px_rgba(0,0,0,0.10)] " +
          "hover:brightness-105 active:shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_1px_2px_rgba(0,0,0,0.14)]",
        ghost:
          "bg-transparent text-ink-muted hover:bg-white/[0.06] hover:text-ink active:translate-y-0",
        outline:
          "border border-line bg-transparent text-ink hover:bg-white/[0.04] hover:border-line active:translate-y-0",
        link: "text-brand hover:text-brand-hover underline-offset-4 hover:underline active:translate-y-0",
      },
      size: {
        sm: "h-8 px-3 text-[13px] [&_svg]:size-4",
        md: "h-10 px-4 text-sm [&_svg]:size-[18px]",
        lg: "h-12 px-6 text-base [&_svg]:size-5",
        icon: "h-10 w-10 [&_svg]:size-5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
