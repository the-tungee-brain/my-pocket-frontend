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
  useTopMoversMetadata,
  useTopMoversRankings,
  useTopMoversIntelPrefetch,
} from "@/app/hooks/useTopMovers";
import { rankingsHaveMlMetrics } from "@/lib/topMovers";
import { appStackClass } from "@/lib/appUi";
import { moversDetailAsideStickyClass } from "@/lib/moversUi";
import { pageSplitClass } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

export function TopMoversPage() {
  const rankingsQuery = useTopMoversRankings();
  const metadataQuery = useTopMoversMetadata();
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [hoveredSymbol, setHoveredSymbol] = useState<string | null>(null);

  const rankings = rankingsQuery.data ?? null;
  const health = metadataQuery.data?.health ?? null;
  const portfolioSymbols = metadataQuery.data?.portfolioSymbols;
  const items = rankings?.items ?? [];
  const regimeId =
    health?.regime_id ?? rankings?.regime_id ?? null;
  const updatedAt =
    health?.last_ranking_run_at ??
    rankings?.timestamp ??
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
  const prefetchedIntel = useTopMoversIntelPrefetch({
    visibleSymbols: prefetchSymbols,
    selectedSymbol,
    hoveredSymbol,
  });
  const nameQuery = useSymbolCompanyName(selectedSymbol);

  const intelligenceBySymbol = useMemo(() => {
    return { ...prefetchedIntel };
  }, [prefetchedIntel]);

  const companyNames = useMemo(() => {
    const map: Record<string, string> = {};
    const name = nameQuery.data;
    if (selectedSymbol && name) map[selectedSymbol] = name;
    return map;
  }, [nameQuery.data, selectedSymbol]);

  const inPortfolio = selectedSymbol
    ? portfolioSymbols?.has(selectedSymbol) ?? false
    : false;

  if (rankingsQuery.isLoading && !rankings) {
    return (
      <PageShell className={appStackClass}>
        <TopMoversHeader hasMlMetrics />
        <SkeletonList rows={8} />
      </PageShell>
    );
  }

  if (rankingsQuery.isError) {
    return (
      <PageShell className={appStackClass}>
        <TopMoversHeader hasMlMetrics={hasMlMetrics} />
        <ErrorBanner
          message={
            rankingsQuery.error instanceof Error
              ? rankingsQuery.error.message
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
        asOfDate={rankings?.as_of_date}
        updatedAt={updatedAt}
        systemStatus={health?.system_status}
      />
      {!hasMlMetrics ? <CompositeModelBanner /> : null}
      <PageSplit
        splitClassName={cn(pageSplitClass, "lg:items-start")}
        main={
          <TopMoversTable
            items={items}
            selectedSymbol={selectedSymbol}
            onSelect={setSelectedSymbol}
            onHoverSymbol={setHoveredSymbol}
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
