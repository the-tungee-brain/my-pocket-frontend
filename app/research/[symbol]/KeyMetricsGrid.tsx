"use client";

import type { FundamentalMetric } from "@/app/hooks/useFundamentals";

type KeyMetricsGridProps = {
  metrics: FundamentalMetric[];
};

export function KeyMetricsGrid({ metrics }: KeyMetricsGridProps) {
  if (metrics.length === 0) {
    return (
      <p className="text-sm text-muted">
        No fundamental metrics were returned for this symbol.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-xl border border-border bg-background/60 px-3 py-2.5"
          title={metric.note ?? undefined}
        >
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
            {metric.label}
          </p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
            {metric.value}
          </p>
          {metric.note && (
            <p className="mt-1 text-[11px] leading-relaxed text-muted">
              {metric.note}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export function KeyMetricsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="h-[4.5rem] animate-pulse rounded-xl bg-muted-bg"
        />
      ))}
    </div>
  );
}
