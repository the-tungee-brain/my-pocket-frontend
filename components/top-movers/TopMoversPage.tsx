"use client";

import { useEffect, useMemo, useState } from "react";
import { MarketRegimeCard } from "@/components/top-movers/MarketRegimeCard";
import { StockDetailPanel } from "@/components/top-movers/StockDetailPanel";
import { TopMoversHeader } from "@/components/top-movers/TopMoversHeader";
import { TopMoversTable } from "@/components/top-movers/TopMoversTable";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import { TrendingUp } from "lucide-react";
import { PageShell, PageSplit } from "@/components/PageShell";
import { useTopMoversBundle, useTopMoverDetail } from "@/app/hooks/useTopMovers";
import { appStackClass } from "@/lib/appUi";
import { pageSplitClass } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

export function TopMoversPage() {
  const query = useTopMoversBundle();
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);

  const items = query.data?.rankings.items ?? [];
  const regimeId =
    query.data?.health.regime_id ?? query.data?.rankings.regime_id ?? null;
  const updatedAt =
    query.data?.health.last_ranking_run_at ??
    query.data?.rankings.timestamp ??
    null;

  useEffect(() => {
    if (!items.length) return;
    setSelectedSymbol((current) => {
      if (current && items.some((i) => i.symbol.toUpperCase() === current)) {
        return current;
      }
      return items[0]?.symbol.toUpperCase() ?? null;
    });
  }, [items]);

  const selectedItem = useMemo(
    () =>
      items.find((i) => i.symbol.toUpperCase() === selectedSymbol) ?? null,
    [items, selectedSymbol],
  );

  const detailForName = useTopMoverDetail(selectedSymbol);
  const companyNames = useMemo(() => {
    const map: Record<string, string> = {};
    const name = detailForName.data?.snapshot?.name;
    if (selectedSymbol && name) map[selectedSymbol] = name;
    return map;
  }, [detailForName.data?.snapshot?.name, selectedSymbol]);

  const inPortfolio = selectedSymbol
    ? query.data?.portfolioSymbols.has(selectedSymbol) ?? false
    : false;

  const lacksMlMetrics =
    items.length > 0 &&
    items.every(
      (i) => i.ml_probability == null && i.expected_excess_return == null,
    );

  if (query.isLoading && !query.data) {
    return (
      <PageShell className={appStackClass}>
        <TopMoversHeader />
        <SkeletonList rows={8} />
      </PageShell>
    );
  }

  if (query.isError) {
    return (
      <PageShell className={appStackClass}>
        <TopMoversHeader />
        <ErrorBanner
          message={
            query.error instanceof Error
              ? query.error.message
              : "Something went wrong."
          }
        />
      </PageShell>
    );
  }

  if (!items.length) {
    return (
      <PageShell className={appStackClass}>
        <TopMoversHeader />
        <EmptyState
          icon={TrendingUp}
          title="Rankings not ready"
          description="The nightly ranking pipeline may still be running. Try again in a few minutes."
        />
      </PageShell>
    );
  }

  return (
    <PageShell className={appStackClass}>
      <TopMoversHeader />
      <MarketRegimeCard
        regimeId={regimeId}
        asOfDate={query.data?.rankings.as_of_date}
        updatedAt={updatedAt}
        systemStatus={query.data?.health.system_status}
      />
      {lacksMlMetrics ? (
        <p className="text-xs text-muted">
          P(SPY) and excess return are not in this ranking run (composite-only model).
          Re-run the pipeline with an ML backend to populate them.
        </p>
      ) : null}
      <PageSplit
        splitClassName={cn(pageSplitClass, "lg:items-start")}
        main={
          <TopMoversTable
            items={items}
            selectedSymbol={selectedSymbol}
            onSelect={setSelectedSymbol}
            companyNames={companyNames}
          />
        }
        aside={
          <StockDetailPanel
            item={selectedItem}
            regimeId={regimeId}
            inPortfolio={inPortfolio}
            className="lg:sticky lg:top-4"
          />
        }
      />
    </PageShell>
  );
}
