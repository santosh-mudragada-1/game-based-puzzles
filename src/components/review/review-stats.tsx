import { Avatar } from "@/components/shared/avatar";
import { MoveBadge } from "@/components/shared/move-badge";
import type { ReviewModel } from "@/lib/pgn";
import { cn } from "@/lib/utils";

/**
 * Accuracy header (White vs Black) plus the per-classification count table,
 * matching Chess.com's Game Review panel. No Card wrapper — it sits inside the
 * review panel. The user's own accuracy is highlighted in brand green.
 */
export function ReviewStats({
  model,
  className,
}: {
  model: ReviewModel;
  className?: string;
}) {
  const { accuracy, white, black, userSide, counts } = model;

  return (
    <div className={className}>
      {/* Accuracy — White (left) vs Black (right) */}
      <div className="flex items-stretch gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Avatar size={22} alt={`${white.username} avatar`} />
            <span className="truncate text-[13px] font-semibold text-ink">
              {white.username}
            </span>
          </div>
          <div
            className={cn(
              "mt-1 font-display text-2xl font-bold tabular-nums",
              userSide === "white" ? "text-brand" : "text-ink",
            )}
          >
            {accuracy.white}
          </div>
        </div>

        <div className="flex flex-col items-center justify-center px-1">
          <span className="w-px flex-1 bg-line/60" aria-hidden />
          <span className="my-1 text-2xs font-semibold uppercase tracking-wide text-ink-faint">
            Accuracy
          </span>
          <span className="w-px flex-1 bg-line/60" aria-hidden />
        </div>

        <div className="min-w-0 flex-1 text-right">
          <div className="flex items-center justify-end gap-2">
            <span className="truncate text-[13px] font-semibold text-ink">
              {black.username}
            </span>
            <Avatar size={22} alt={`${black.username} avatar`} />
          </div>
          <div
            className={cn(
              "mt-1 font-display text-2xl font-bold tabular-nums",
              userSide === "black" ? "text-brand" : "text-ink",
            )}
          >
            {accuracy.black}
          </div>
        </div>
      </div>

      {/* Classification table */}
      <div className="mt-4">
        <div className="grid grid-cols-[2rem_1fr_2rem] items-center pb-0.5">
          <span className="text-right text-2xs font-bold uppercase tracking-wide text-ink-faint">
            W
          </span>
          <span aria-hidden />
          <span className="text-center text-2xs font-bold uppercase tracking-wide text-ink-faint">
            B
          </span>
        </div>

        {counts.map((row) => (
          <div
            key={row.classification}
            className="grid grid-cols-[2rem_1fr_2rem] items-center border-t border-line/40 py-1.5"
          >
            <span className="text-right text-sm font-bold tabular-nums text-ink-muted">
              {row.white}
            </span>
            <span className="flex justify-start pl-2">
              <MoveBadge classification={row.classification} size={18} />
            </span>
            <span className="text-center text-sm font-bold tabular-nums text-ink-muted">
              {row.black}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
