"use client";

import Link from "next/link";
import { memo, useMemo } from "react";
import { useResearchAssetTypeContext } from "@/app/research/[symbol]/ResearchAssetTypeContext";
import { useResearchSymbolHeader } from "@/app/research/[symbol]/ResearchSymbolHeaderContext";
import { ResearchMetricList } from "@/components/research/ResearchMemoPrimitives";
import { Skeleton } from "@/components/ui/Skeleton";
import { symbolHubPath } from "@/lib/symbolRoutes";
import { buildTickerKeyStats, type TickerKeyStat } from "@/lib/tickerKeyStats";
import { cn } from "@/lib/utils";

type Props = {
  symbol: string;
  variant?: "tiles" | "definition";
  className?: string;
};

const STATS_GRID_CLASS =
  "grid w-full min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5 lg:grid-cols-6";

const STAT_TILE_CLASS =
  "min-w-0 rounded-xl border border-border bg-background/60 px-2.5 py-2 sm:px-3 sm:py-2.5";

const SKELETON_KEYS = [
  "market-cap",
  "pe",
  "yield",
  "range",
  "volume",
  "avg-volume",
];

function StatTileContent({ stat }: { stat: TickerKeyStat }) {
  return (
    <>
      <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted">
        {stat.label}
      </p>
      <p
        className="mt-0.5 truncate text-xs font-semibold tabular-nums text-foreground sm:text-sm"
        title={stat.value !== "—" ? stat.value : undefined}
      >
        {stat.value}
      </p>
    </>
  );
}

const TickerKeyStatsGrid = memo(function TickerKeyStatsGrid({
  symbol,
  stats,
  className,
}: {
  symbol: string;
  stats: TickerKeyStat[];
  className?: string;
}) {
  const symbolUpper = symbol.toUpperCase();

  return (
    <div className={cn(STATS_GRID_CLASS, className)}>
      {stats.map((stat) => {
        if (stat.hrefTab) {
          return (
            <Link
              key={stat.label}
              href={symbolHubPath(symbolUpper, stat.hrefTab)}
              className={cn(
                STAT_TILE_CLASS,
                "block transition hover:border-accent/40 hover:bg-secondary/40",
              )}
            >
              <StatTileContent stat={stat} />
            </Link>
          );
        }

        return (
          <div key={stat.label} className={STAT_TILE_CLASS}>
            <StatTileContent stat={stat} />
          </div>
        );
      })}
    </div>
  );
});

function TickerKeyStatsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(STATS_GRID_CLASS, className)}>
      {SKELETON_KEYS.map((key) => (
        <Skeleton key={key} className="h-[3.25rem] rounded-xl sm:h-[3.75rem]" />
      ))}
    </div>
  );
}

function TickerKeyStatsDefinitionList({
  stats,
  className,
}: {
  stats: TickerKeyStat[];
  className?: string;
}) {
  return (
    <ResearchMetricList
      items={stats.map((stat) => ({
        label: stat.label,
        value: stat.value,
      }))}
      className={className}
    />
  );
}

export function TickerKeyStats({
  symbol,
  variant = "tiles",
  className,
}: Props) {
  const { isEtf } = useResearchAssetTypeContext();
  const { snapshot, etfHoldings, isLoading } = useResearchSymbolHeader();

  const stats = useMemo(() => {
    if (!snapshot) return [];
    return buildTickerKeyStats(snapshot, { isEtf, etfHoldings });
  }, [snapshot, isEtf, etfHoldings]);

  if (isLoading) {
    return <TickerKeyStatsSkeleton className={className} />;
  }

  if (!snapshot || stats.length === 0) {
    return null;
  }

  if (variant === "definition") {
    return <TickerKeyStatsDefinitionList stats={stats} className={className} />;
  }

  return (
    <TickerKeyStatsGrid symbol={symbol} stats={stats} className={className} />
  );
}
