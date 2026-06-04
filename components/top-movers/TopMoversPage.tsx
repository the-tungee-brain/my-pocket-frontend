"use client";

import { useEffect, useMemo, useState } from "react";
import { CompositeModelBanner } from "@/components/top-movers/CompositeModelBanner";
import { MarketRegimeCard } from "@/components/top-movers/MarketRegimeCard";
import { StockDetailPanel } from "@/components/top-movers/StockDetailPanel";
import { TopMoversHeader } from "@/components/top-movers/TopMoversHeader";
import { TopMoversTable } from "@/components/top-movers/TopMoversTable";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import { TrendingUp } from "lucide-react";
import { PageShell, PageSplit } from "@/components/PageShell";
import {
  useSymbolCompanyName,
  useTopMoverDetail,
  useTopMoversBundle,
  useTopMoversIntelPrefetch,
} from "@/app/hooks/useTopMovers";
import { rankingsHaveMlMetrics } from "@/lib/topMovers";
import { appStackClass } from "@/lib/appUi";
import { moversDetailAsideStickyClass } from "@/lib/moversUi";
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
  const hasMlMetrics = rankingsHaveMlMetrics(items);

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

  const prefetchSymbols = useMemo(
    () => items.map((i) => i.symbol.toUpperCase()),
    [items],
  );
  const prefetchedIntel = useTopMoversIntelPrefetch(prefetchSymbols);
  const nameQuery = useSymbolCompanyName(selectedSymbol);
  const detailQuery = useTopMoverDetail(selectedSymbol);

  const intelligenceBySymbol = useMemo(() => {
    const map = { ...prefetchedIntel };
    if (selectedSymbol && detailQuery.data) {
      map[selectedSymbol] = detailQuery.data;
    }
    return map;
  }, [prefetchedIntel, selectedSymbol, detailQuery.data]);

  const companyNames = useMemo(() => {
    const map: Record<string, string> = {};
    const name = nameQuery.data;
    if (selectedSymbol && name) map[selectedSymbol] = name;
    return map;
  }, [nameQuery.data, selectedSymbol]);

  const inPortfolio = selectedSymbol
    ? query.data?.portfolioSymbols.has(selectedSymbol) ?? false
    : false;

  if (query.isLoading && !query.data) {
    return (
      <PageShell className={appStackClass}>
        <TopMoversHeader hasMlMetrics />
        <SkeletonList rows={8} />
      </PageShell>
    );
  }

  if (query.isError) {
    return (
      <PageShell className={appStackClass}>
        <TopMoversHeader hasMlMetrics={hasMlMetrics} />
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
        <TopMoversHeader hasMlMetrics={hasMlMetrics} />
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
      <TopMoversHeader hasMlMetrics={hasMlMetrics} />
      <MarketRegimeCard
        regimeId={regimeId}
        asOfDate={query.data?.rankings.as_of_date}
        updatedAt={updatedAt}
        systemStatus={query.data?.health.system_status}
      />
      {!hasMlMetrics ? <CompositeModelBanner /> : null}
      <PageSplit
        splitClassName={cn(pageSplitClass, "lg:items-start")}
        main={
          <TopMoversTable
            items={items}
            selectedSymbol={selectedSymbol}
            onSelect={setSelectedSymbol}
            companyNames={companyNames}
            intelligenceBySymbol={intelligenceBySymbol}
          />
        }
        aside={
          <StockDetailPanel
            item={selectedItem}
            items={items}
            regimeId={regimeId}
            hasMlMetrics={hasMlMetrics}
            inPortfolio={inPortfolio}
            className={moversDetailAsideStickyClass}
          />
        }
      />
    </PageShell>
  );
}
