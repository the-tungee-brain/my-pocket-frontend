"use client";

import type { SymbolAlertSummary } from "@/lib/intelligence";
import { signalSeverityClass } from "@/lib/intelligence";
import { cn } from "@/lib/utils";

type Props = {
  summary: SymbolAlertSummary;
  compact?: boolean;
  className?: string;
};

export function AlertBadge({ summary, compact = false, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        signalSeverityClass(summary.topSeverity),
        className,
      )}
      title={`${summary.count} item${summary.count === 1 ? "" : "s"} need attention`}
    >
      <span className="h-1.5 w-1.5 bg-current" aria-hidden />
      {compact ? null : summary.count}
    </span>
  );
}
