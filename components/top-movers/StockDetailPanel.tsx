"use client";

import Link from "next/link";
import type { RankingItem } from "@/app/types/rankings";
import { ContributionBreakdown } from "@/components/top-movers/ContributionBreakdown";
import { ConvictionBadge } from "@/components/top-movers/ConvictionBadge";
import {
  MoverResearchSections,
  PortfolioRoleLabel,
  RegimeCompactCard,
} from "@/components/top-movers/MoverResearchSections";
import { WatchlistButton } from "@/components/WatchlistButton";
import { KpiStat } from "@/components/ui/KpiStat";
import { Badge } from "@/components/ui/Badge";
import { useTopMoverDetail } from "@/app/hooks/useTopMovers";
import {
  buildMoverResearchInsight,
  formatExcessReturn,
  formatProbability,
  priceTrendLabel,
  rankContext,
  convictionForDetail,
  convictionForRow,
  segmentsFromPatternScores,
} from "@/lib/topMovers";
import { symbolHubPath } from "@/lib/symbolRoutes";
import { cn } from "@/lib/utils";
import { BarChart3, LineChart } from "lucide-react";

type Props = {
  item: RankingItem | null;
  items: RankingItem[];
  regimeId: string | null | undefined;
  hasMlMetrics?: boolean;
  inPortfolio: boolean;
  className?: string;
};

export function StockDetailPanel({
  item,
  items,
  regimeId,
  hasMlMetrics = false,
  inPortfolio,
  className,
}: Props) {
  const symbol = item?.symbol.toUpperCase() ?? null;
  const detailQuery = useTopMoverDetail(symbol);
  const intel = detailQuery.data ?? null;
  const segments = segmentsFromPatternScores(intel?.scores);

  const insight =
    item && !detailQuery.isLoading
      ? buildMoverResearchInsight({
          symbol: item.symbol,
          intel,
          segments,
          regimeId,
          rank: item.rank,
          listCount: items.length,
          inPortfolio,
        })
      : null;

  if (!item) {
    return (
      <aside
        className={cn(
          "app-panel flex min-h-[320px] flex-col items-center justify-center px-6 py-12 text-center",
          className,
        )}
      >
        <p className="text-sm text-muted">
          Select a symbol for thesis, decision summary, and what to watch next.
        </p>
      </aside>
    );
  }

  const sym = item.symbol.toUpperCase();
  const ctx = rankContext(item, items);
  const listConviction = convictionForRow(item.rank, items.length);
  const signalConviction = convictionForDetail(
    item.rank,
    items.length,
    intel?.scores,
  );
  const trend = priceTrendLabel(intel);

  return (
    <aside className={cn("app-panel flex flex-col gap-4 p-4 lg:p-5", className)}>
      <header className="space-y-3 border-b border-border pb-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-2">
            <h2 className="font-mono text-xl font-semibold tracking-tight">{sym}</h2>
            <p className="text-sm text-muted">
              <span className="font-semibold text-foreground">{ctx.rankLabel}</span>
              {" · "}
              {ctx.subtitle}
            </p>
            <PortfolioRoleLabel role={insight?.portfolioRole ?? null} />
            <div className="flex flex-wrap items-center gap-2">
              <ConvictionBadge
                tier={listConviction.tier}
                label={listConviction.label}
              />
              {intel?.scores &&
              signalConviction.tier !== listConviction.tier ? (
                <span className="text-xs text-muted">
                  Signal{" "}
                  <ConvictionBadge
                    tier={signalConviction.tier}
                    label={signalConviction.label}
                    className="ml-0.5 align-middle"
                  />
                </span>
              ) : null}
              {trend ? (
                <span className="text-xs text-muted">
                  Price <span className="font-medium text-foreground">{trend}</span>
                </span>
              ) : detailQuery.isLoading ? (
                <span className="text-xs text-muted">Loading…</span>
              ) : null}
            </div>
          </div>
          <Badge variant={inPortfolio ? "accent" : "muted"}>
            {inPortfolio ? "In model portfolio" : "Not in portfolio"}
          </Badge>
        </div>
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

      <MoverResearchSections insight={insight} loading={detailQuery.isLoading} />

      <section className="space-y-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          Why it ranks
        </h3>
        <ContributionBreakdown
          segments={segments}
          loading={detailQuery.isLoading}
        />
      </section>

      {insight ? (
        <RegimeCompactCard regime={insight.regimeCompact} />
      ) : detailQuery.isLoading ? (
        <div className="h-14 animate-pulse rounded-lg bg-muted-bg" aria-busy />
      ) : null}

      <div className="mt-auto space-y-2 border-t border-border pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          Investigate next
        </p>
        <div className="flex flex-wrap gap-2">
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
      </div>
    </aside>
  );
}
