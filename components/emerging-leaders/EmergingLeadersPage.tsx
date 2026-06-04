"use client";

import { useEffect, useMemo, useState } from "react";
import { Sprout } from "lucide-react";
import { EmergingLeaderDetailPanel } from "@/components/emerging-leaders/EmergingLeaderDetailPanel";
import { EmergingLeadersHeader } from "@/components/emerging-leaders/EmergingLeadersHeader";
import { EmergingLeadersScanCard } from "@/components/emerging-leaders/EmergingLeadersScanCard";
import { EmergingLeadersTable } from "@/components/emerging-leaders/EmergingLeadersTable";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import { PageShell, PageSplit } from "@/components/PageShell";
import { useEmergingLeaders } from "@/app/hooks/useEmergingLeaders";
import { useSymbolCompanyName } from "@/app/hooks/useTopMovers";
import { appStackClass } from "@/lib/appUi";
import { moversDetailAsideStickyClass } from "@/lib/moversUi";
import { pageSplitClass } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

export function EmergingLeadersPage() {
  const query = useEmergingLeaders(20);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const items = query.data?.items ?? [];

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
    () => items.find((i) => i.symbol.toUpperCase() === selectedSymbol) ?? null,
    [items, selectedSymbol],
  );

  const nameQuery = useSymbolCompanyName(selectedSymbol);

  const companyNames = useMemo(() => {
    const map: Record<string, string> = {};
    const name = nameQuery.data;
    if (selectedSymbol && name) map[selectedSymbol] = name;
    return map;
  }, [nameQuery.data, selectedSymbol]);

  if (query.isLoading && !query.data) {
    return (
      <PageShell className={appStackClass}>
        <EmergingLeadersHeader />
        <SkeletonList rows={8} />
      </PageShell>
    );
  }

  if (query.isError) {
    return (
      <PageShell className={appStackClass}>
        <EmergingLeadersHeader />
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
    const stats = query.data;
    const emptyDescription = stats
      ? stats.symbolsWithData === 0
        ? "No OHLCV history is available on the server for the ranked universe yet. Run the daily ranking OHLCV job, then refresh."
        : stats.evaluationsComputed === 0
          ? `Found OHLCV for ${stats.symbolsWithData} symbols but none passed setup scoring. Check data freshness or try again after the daily pipeline.`
          : `Scanned ${stats.universeScanned} candidates with data; none met the setup filter for this list.`
      : "The setup scan did not return candidates. Try again after market data updates.";

    return (
      <PageShell className={appStackClass}>
        <EmergingLeadersHeader />
        {stats ? <EmergingLeadersScanCard data={stats} /> : null}
        <EmptyState
          icon={Sprout}
          title="No emerging leaders yet"
          description={emptyDescription}
        />
      </PageShell>
    );
  }

  const data = query.data!;

  return (
    <PageShell className={appStackClass}>
      <EmergingLeadersHeader />
      <EmergingLeadersScanCard data={data} />
      <PageSplit
        splitClassName={cn(pageSplitClass, "lg:items-start")}
        main={
          <EmergingLeadersTable
            items={items}
            selectedSymbol={selectedSymbol}
            onSelect={setSelectedSymbol}
            companyNames={companyNames}
          />
        }
        aside={
          <EmergingLeaderDetailPanel
            item={selectedItem}
            companyName={nameQuery.data}
            className={moversDetailAsideStickyClass}
          />
        }
      />
    </PageShell>
  );
}
