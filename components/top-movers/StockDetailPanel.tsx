"use client";

import Link from "next/link";
import type { RankingItem } from "@/app/types/rankings";
import { ScoreBreakdown } from "@/components/top-movers/ScoreBreakdown";
import { WatchlistButton } from "@/components/WatchlistButton";
import { KpiStat } from "@/components/ui/KpiStat";
import { Badge } from "@/components/ui/Badge";
import { useTopMoverDetail } from "@/app/hooks/useTopMovers";
import {
  formatExcessReturn,
  formatProbability,
  formatRegimeLabel,
  segmentsFromPatternScores,
} from "@/lib/topMovers";
import { symbolHubPath } from "@/lib/symbolRoutes";
import { cn } from "@/lib/utils";
import { BarChart3, LineChart } from "lucide-react";

type Props = {
  item: RankingItem | null;
  regimeId: string | null | undefined;
  inPortfolio: boolean;
  className?: string;
};

export function StockDetailPanel({
  item,
  regimeId,
  inPortfolio,
  className,
}: Props) {
  const symbol = item?.symbol.toUpperCase() ?? null;
  const detailQuery = useTopMoverDetail(symbol);
  const bundle = detailQuery.data ?? null;
  const scores = bundle?.intelligence?.patternIntelligence?.scores;
  const segments = segmentsFromPatternScores(scores);
  const companyName = bundle?.snapshot?.name ?? null;
  const trendLabel = bundle?.performance?.trendLabel;

  if (!item) {
    return (
      <aside
        className={cn(
          "app-panel flex min-h-[320px] flex-col items-center justify-center px-6 py-12 text-center",
          className,
        )}
      >
        <p className="text-sm text-muted">
          Select a symbol to see score breakdown, regime context, and actions.
        </p>
      </aside>
    );
  }

  const sym = item.symbol.toUpperCase();

  return (
    <aside className={cn("app-panel flex flex-col gap-5 p-4 lg:p-5", className)}>
      <header className="space-y-1 border-b border-border pb-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="font-mono text-xl font-semibold tracking-tight">{sym}</h2>
            {companyName ? (
              <p className="text-sm text-muted">{companyName}</p>
            ) : detailQuery.isLoading ? (
              <p className="text-sm text-muted">Loading…</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {inPortfolio ? (
              <Badge variant="accent">In model portfolio</Badge>
            ) : (
              <Badge variant="muted">Not in portfolio</Badge>
            )}
          </div>
        </div>
        <p className="text-xs text-muted">
          Rank #{item.rank} · Final score {item.final_score.toFixed(2)}
          {trendLabel ? ` · ${trendLabel}` : ""}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <KpiStat
          label="P(outperform SPY)"
          value={formatProbability(item.ml_probability)}
        />
        <KpiStat
          label="Excess 5d"
          value={formatExcessReturn(item.expected_excess_return)}
          tone={
            item.expected_excess_return != null && item.expected_excess_return >= 0
              ? "positive"
              : "default"
          }
        />
      </div>

      <section className="space-y-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          Why it ranks
        </h3>
        <ScoreBreakdown
          segments={segments}
          loading={detailQuery.isLoading}
        />
      </section>

      <section className="space-y-2 border-t border-border pt-4">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          Regime context
        </h3>
        <p className="text-sm text-foreground/90">{formatRegimeLabel(regimeId)}</p>
        <p className="text-xs text-muted">
          Scores are precomputed for the current pipeline run. Breakdown bars reflect
          latest pattern intelligence when available.
        </p>
      </section>

      <div className="mt-auto flex flex-wrap gap-2 border-t border-border pt-4">
        <Link
          href={symbolHubPath(sym, "overview")}
          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-foreground px-3 text-xs font-semibold text-background hover:opacity-90"
        >
          <LineChart className="h-3.5 w-3.5" aria-hidden />
          Research
        </Link>
        <WatchlistButton symbol={sym} size="sm" />
        <Link
          href={symbolHubPath(sym, "overview")}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-semibold text-foreground hover:bg-muted-bg"
        >
          <BarChart3 className="h-3.5 w-3.5" aria-hidden />
          Chart
        </Link>
      </div>
    </aside>
  );
}
