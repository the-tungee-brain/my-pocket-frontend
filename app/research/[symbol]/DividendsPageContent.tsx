"use client";

import { useMemo, useState } from "react";
import { History, LineChart, TrendingUp } from "lucide-react";
import { useSession } from "next-auth/react";
import { useDividendHistory } from "@/app/hooks/useDividendHistory";
import { usePositionsContext } from "@/app/Providers";
import type { Position } from "@/app/types/schwab";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { PageSplit } from "@/components/PageShell";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  DividendHistoryCharts,
  DividendRecentPaymentsTable,
  DividendSnowballScenarioCard,
  DividendSnowballSkeleton,
  DividendSnowballStats,
} from "./DividendSnowballSections";

type Props = {
  symbol: string;
};

function equityShareCount(positions: Position[] | undefined): number {
  if (!positions?.length) return 0;
  return positions
    .filter((position) => position.instrument.assetType === "EQUITY")
    .reduce(
      (sum, position) =>
        sum + Math.max(position.longQuantity - position.shortQuantity, 0),
      0,
    );
}

export function DividendsPageContent({ symbol }: Props) {
  const { data: session } = useSession();
  const { positionMap } = usePositionsContext();
  const symbolUpper = symbol.toUpperCase();
  const heldShares = useMemo(
    () => equityShareCount(positionMap[symbolUpper]),
    [positionMap, symbolUpper],
  );
  const [scenarioShares, setScenarioShares] = useState<number | null>(
    heldShares > 0 ? Math.round(heldShares) : null,
  );
  const resolvedShares = scenarioShares ?? (heldShares > 0 ? Math.round(heldShares) : 100);

  const { history, isLoading, error } = useDividendHistory(symbol, {
    accessToken: session?.accessToken,
    shares: resolvedShares,
  });

  return (
    <PageSplit
      main={
        <>
          <ResearchSectionCard
            title="Dividend history"
            description="How annual totals and each payout per share have changed over time"
            icon={LineChart}
          >
            {isLoading ? (
              <DividendSnowballSkeleton />
            ) : history ? (
              <DividendHistoryCharts history={history} />
            ) : (
              <EmptyState
                icon={LineChart}
                title="Dividend history unavailable"
                description={
                  error ??
                  "Historic dividend data is not available for this symbol right now."
                }
                variant="solid"
                className="py-4"
              />
            )}
          </ResearchSectionCard>

          <ResearchSectionCard
            title="Dividend snowball"
            description="Historic payout growth and cash income on your share count"
            icon={TrendingUp}
          >
            {isLoading ? (
              <DividendSnowballSkeleton />
            ) : history ? (
              <div className="space-y-4">
                <DividendSnowballStats history={history} />
                <DividendSnowballScenarioCard
                  history={history}
                  onSharesChange={setScenarioShares}
                />
              </div>
            ) : null}
          </ResearchSectionCard>
        </>
      }
      aside={
        history ? (
          <ResearchSectionCard
            title="Recent payments"
            description={
              history.dataAsOf
                ? `Data as of ${new Date(history.dataAsOf).toLocaleDateString()}`
                : "Latest dividend payments per share"
            }
            icon={History}
          >
            <DividendRecentPaymentsTable payments={history.recentPayments} />
            {history.cagr10yPct != null ? (
              <p className="mt-3 text-[11px] text-muted">
                10-year dividend CAGR: {history.cagr10yPct.toFixed(1)}%
              </p>
            ) : null}
          </ResearchSectionCard>
        ) : null
      }
    />
  );
}
