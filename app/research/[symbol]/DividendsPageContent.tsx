"use client";

import { useEffect, useMemo, useState } from "react";
import { History, LineChart, TrendingUp } from "lucide-react";
import { useSession } from "next-auth/react";
import { useDividendHistory } from "@/app/hooks/useDividendHistory";
import { useStockData } from "@/app/hooks/useStockData";
import { usePositionsContext } from "@/app/Providers";
import type { Position } from "@/app/types/schwab";
import type { DividendScenarioParams } from "@/app/types/research";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { PageSplit } from "@/components/PageShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { defaultDividendInvestmentUsd } from "@/lib/dividendHistory";
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

function equitySharePrice(positions: Position[] | undefined): number | null {
  if (!positions?.length) return null;
  const equity = positions.find(
    (position) =>
      position.instrument.assetType === "EQUITY" &&
      position.longQuantity - position.shortQuantity > 0,
  );
  if (!equity) return null;
  const shares = equity.longQuantity - equity.shortQuantity;
  if (shares <= 0) return null;
  return equity.marketValue / shares;
}

export function DividendsPageContent({ symbol }: Props) {
  const { data: session } = useSession();
  const { positionMap } = usePositionsContext();
  const symbolUpper = symbol.toUpperCase();
  const heldShares = useMemo(
    () => equityShareCount(positionMap[symbolUpper]),
    [positionMap, symbolUpper],
  );
  const heldSharePrice = useMemo(
    () => equitySharePrice(positionMap[symbolUpper]),
    [positionMap, symbolUpper],
  );

  const { data: stockData } = useStockData({
    symbol,
    accessToken: session?.accessToken,
    enabled: !!symbol && !!session?.accessToken,
    period: "5d",
    interval: "1d",
  });

  const marketSharePrice = useMemo(() => {
    if (heldSharePrice != null && heldSharePrice > 0) {
      return heldSharePrice;
    }
    const closes = stockData?.data ?? [];
    const lastClose = closes[closes.length - 1]?.close;
    return lastClose != null && lastClose > 0 ? lastClose : null;
  }, [heldSharePrice, stockData?.data]);

  const [scenarioParams, setScenarioParams] = useState<DividendScenarioParams>(() => ({
    investmentUsd: defaultDividendInvestmentUsd(heldShares, heldSharePrice),
    sharePrice: heldSharePrice,
    reinvestDividends: false,
    priceCagrPct: null,
  }));

  useEffect(() => {
    if (marketSharePrice == null) return;
    setScenarioParams((current) => {
      if (current.sharePrice != null && current.sharePrice > 0) {
        return current;
      }
      return { ...current, sharePrice: marketSharePrice };
    });
  }, [marketSharePrice]);

  useEffect(() => {
    setScenarioParams((current) => {
      if (current.investmentUsd != null && current.investmentUsd > 0) {
        return current;
      }
      return {
        ...current,
        investmentUsd: defaultDividendInvestmentUsd(
          heldShares,
          current.sharePrice ?? marketSharePrice,
        ),
      };
    });
  }, [heldShares, marketSharePrice]);

  const { history, isLoading, error } = useDividendHistory(symbol, {
    accessToken: session?.accessToken,
    ...scenarioParams,
    shares: heldShares > 0 ? heldShares : undefined,
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
                  scenarioParams={scenarioParams}
                  onScenarioChange={setScenarioParams}
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
