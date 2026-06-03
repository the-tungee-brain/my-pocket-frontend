"use client";

import Link from "next/link";
import type { RankingItem } from "@/app/types/rankings";
import { ScoreBreakdown } from "@/components/top-movers/ScoreBreakdown";
import { KeySignalsList } from "@/components/top-movers/KeySignalsList";
import { WatchlistButton } from "@/components/WatchlistButton";
import { KpiStat } from "@/components/ui/KpiStat";
import { Badge } from "@/components/ui/Badge";
import { useTopMoverDetail } from "@/app/hooks/useTopMovers";
import {
  formatExcessReturn,
  formatProbability,
  keySignalsFromIntelligence,
  segmentsFromPatternScores,
  signalStrengthLabel,
  topUniverseLabel,
  trendDisplayFromIntelligence,
} from "@/lib/topMovers";
import { symbolHubPath } from "@/lib/symbolRoutes";
import { cn } from "@/lib/utils";
import { BarChart3, LineChart } from "lucide-react";

type Props = {
  item: RankingItem | null;
  universeSize?: number | null;
  listCount?: number;
  hasMlMetrics?: boolean;
  inPortfolio: boolean;
  className?: string;
};

export function StockDetailPanel({
  item,
  universeSize,
  listCount = 20,
  hasMlMetrics = false,
  inPortfolio,
  className,
}: Props) {
  const symbol = item?.symbol.toUpperCase() ?? null;
  const detailQuery = useTopMoverDetail(symbol);
  const intel = detailQuery.data ?? null;
  const segments = segmentsFromPatternScores(intel?.scores);
  const signals = keySignalsFromIntelligence(intel);
  const strength = signalStrengthLabel(intel?.scores);
  const priceTrend = trendDisplayFromIntelligence(intel);

  if (!item) {
    return (
      <aside
        className={cn(
          "app-panel flex min-h-[320px] flex-col items-center justify-center px-6 py-12 text-center",
          className,
        )}
      >
        <p className="text-sm text-muted">
          Select a symbol to see why it ranks, key signals, and next steps.
        </p>
      </aside>
    );
  }

  const sym = item.symbol.toUpperCase();
  const percentile = topUniverseLabel(item.rank, universeSize, listCount);

  return (
    <aside className={cn("app-panel flex flex-col gap-5 p-4 lg:p-5", className)}>
      <header className="space-y-2 border-b border-border pb-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <h2 className="font-mono text-xl font-semibold tracking-tight">{sym}</h2>
            <p className="text-sm font-semibold text-accent">{percentile}</p>
            {strength ? (
              <p className="text-sm font-medium text-foreground">{strength}</p>
            ) : detailQuery.isLoading ? (
              <p className="text-sm text-muted">Loading signal strength…</p>
            ) : null}
            {priceTrend ? (
              <p className="text-sm text-muted">
                <span className="font-medium text-foreground">Price trend: </span>
                <span aria-hidden>{priceTrend.symbol} </span>
                {priceTrend.label}
              </p>
            ) : null}
          </div>
          <Badge variant={inPortfolio ? "accent" : "muted"}>
            {inPortfolio ? "In model portfolio" : "Not in portfolio"}
          </Badge>
        </div>
        {process.env.NODE_ENV === "development" ? (
          <p className="font-mono text-[10px] text-muted">
            Debug · final score {item.final_score.toFixed(2)}
          </p>
        ) : null}
      </header>

      {hasMlMetrics &&
      (item.ml_probability != null || item.expected_excess_return != null) ? (
        <div className="grid grid-cols-2 gap-3">
          {item.ml_probability != null ? (
            <KpiStat
              label="P(outperform SPY)"
              value={formatProbability(item.ml_probability)}
            />
          ) : null}
          {item.expected_excess_return != null ? (
            <KpiStat
              label="Expected excess 5d"
              value={formatExcessReturn(item.expected_excess_return)}
              tone={
                item.expected_excess_return >= 0 ? "positive" : "default"
              }
            />
          ) : null}
        </div>
      ) : null}

      <section className="space-y-3">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          Why it ranks
        </h3>
        <ScoreBreakdown
          segments={segments}
          loading={detailQuery.isLoading}
        />
      </section>

      <KeySignalsList signals={signals} loading={detailQuery.isLoading} />

      {intel?.explanation?.headline ? (
        <p className="text-sm leading-relaxed text-muted">
          {intel.explanation.headline}
        </p>
      ) : null}

      <div className="mt-auto flex flex-wrap gap-2 border-t border-border pt-4">
        <Link
          href={symbolHubPath(sym, "overview")}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-foreground px-3 text-xs font-semibold text-background hover:opacity-90"
        >
          <LineChart className="h-3.5 w-3.5" aria-hidden />
          Research
        </Link>
        <WatchlistButton symbol={sym} size="sm" />
        <Link
          href={symbolHubPath(sym, "overview")}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-semibold text-foreground hover:bg-muted-bg"
        >
          <BarChart3 className="h-3.5 w-3.5" aria-hidden />
          Chart
        </Link>
      </div>
    </aside>
  );
}
