import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export function Toast({
  show,
  message,
  className,
}: {
  show: boolean;
  message: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center transition-all duration-300",
        show ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        className,
      )}
    >
      {show && (
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-line bg-surface-raised px-4 py-2.5 shadow-pop">
          <Check className="size-4 text-brand" strokeWidth={3} />
          <span className="text-[13px] font-semibold text-ink">{message}</span>
        </div>
      )}
    </div>
  );
}
