"use client";

import type { FundamentalMetric } from "@/app/hooks/useFundamentals";
import { groupFundamentalMetrics } from "@/lib/fundamentalMetricGroups";
import { appSectionLabelClass } from "@/lib/appUi";
import { Skeleton } from "@/components/ui/Skeleton";

type KeyMetricsGridProps = {
  metrics: FundamentalMetric[];
  grouped?: boolean;
};

function MetricTile({ metric }: { metric: FundamentalMetric }) {
  return (
    <div
      className="border border-border bg-background/60 px-3 py-2.5"
      title={metric.note ?? undefined}
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
        {metric.label}
      </p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
        {metric.value}
      </p>
      {metric.note ? (
        <p className="mt-1 text-[11px] leading-relaxed text-muted">
          {metric.note}
        </p>
      ) : null}
    </div>
  );
}

function MetricsGrid({ metrics }: { metrics: FundamentalMetric[] }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {metrics.map((metric) => (
        <MetricTile key={metric.label} metric={metric} />
      ))}
    </div>
  );
}

export function KeyMetricsGrid({
  metrics,
  grouped = false,
}: KeyMetricsGridProps) {
  if (metrics.length === 0) {
    return (
      <p className="text-sm text-muted">
        No fundamental metrics were returned for this symbol.
      </p>
    );
  }

  if (!grouped) {
    return <MetricsGrid metrics={metrics} />;
  }

  const groups = groupFundamentalMetrics(metrics);

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.id}>
          <h3 className={appSectionLabelClass}>{group.title}</h3>
          <div className="mt-2">
            <MetricsGrid metrics={group.metrics} />
          </div>
        </section>
      ))}
    </div>
  );
}

export function KeyMetricsGridSkeleton({ grouped = false }: { grouped?: boolean }) {
  const block = (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-[4.5rem]" />
      ))}
    </div>
  );

  if (!grouped) {
    return block;
  }

  return (
    <div className="space-y-5">
      {["Valuation", "Profitability", "Growth"].map((title) => (
        <div key={title}>
          <Skeleton className="mb-2 h-3 w-24" />
          {block}
        </div>
      ))}
    </div>
  );
}
