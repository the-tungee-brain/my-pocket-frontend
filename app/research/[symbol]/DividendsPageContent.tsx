"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { History, LineChart, TrendingUp } from "lucide-react";
import { useSession } from "next-auth/react";
import { useAccountPlan } from "@/app/hooks/useAccountPlan";
import { useDividendHistory } from "@/app/hooks/useDividendHistory";
import { ProFeatureGate } from "@/components/ProFeatureGate";
import { useDebouncedValue } from "@/app/hooks/useDebouncedValue";
import { useEtfHoldings } from "@/app/hooks/useEtfHoldings";
import { useStockData } from "@/app/hooks/useStockData";
import { usePositionsContext } from "@/app/Providers";
import { useResearchAssetTypeContext } from "./ResearchAssetTypeContext";
import type { Position } from "@/app/types/schwab";
import type { DividendScenarioParams } from "@/app/types/research";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { PageSplit } from "@/components/PageShell";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  defaultDividendInvestmentUsd,
  resolveEffectiveScenarioParams,
  resolveSnowballAdvancedMetrics,
  resolveSnowballPriceCagrPct,
} from "@/lib/dividendHistory";
import {
  DividendHistoryCharts,
  DividendRecentPaymentsTable,
  DividendSnowballScenarioCard,
  DividendSnowballSkeleton,
  DividendSnowballStats,
  DividendSummaryStats,
} from "./DividendSnowballSections";
import { hasProFeature } from "@/lib/planFeatures";

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

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
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
  return roundToTwo(equity.marketValue / shares);
}

function buildInitialScenarioParams(
  heldShares: number,
  sharePrice: number | null,
): DividendScenarioParams {
  const price =
    sharePrice != null && sharePrice > 0 ? roundToTwo(sharePrice) : null;

  if (heldShares > 0 && price != null) {
    const shares = roundToTwo(heldShares);
    return {
      investmentUsd: roundToTwo(shares * price),
      sharePrice: price,
      shares,
      projectYears: 10,
      reinvestDividends: false,
      priceCagrPct: null,
    };
  }

  const investmentUsd = defaultDividendInvestmentUsd(heldShares, price);
  return {
    investmentUsd,
    sharePrice: price,
    shares:
      price != null && investmentUsd > 0
        ? roundToTwo(investmentUsd / price)
        : null,
    projectYears: 10,
    reinvestDividends: false,
    priceCagrPct: null,
  };
}

export function DividendsPageContent({ symbol }: Props) {
  const { data: session } = useSession();
  const { isPaid, plan } = useAccountPlan(session?.accessToken);
  const snowballAllowed = hasProFeature(isPaid, "dividendSnowball", plan);
  const { isEtf } = useResearchAssetTypeContext();
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

  const { holdings: etfHoldings } = useEtfHoldings(symbol, {
    accessToken: session?.accessToken,
    enabled: isEtf && !!session?.accessToken,
    limit: 25,
  });

  const marketSharePrice = useMemo(() => {
    if (heldSharePrice != null && heldSharePrice > 0) {
      return heldSharePrice;
    }
    const closes = stockData?.data ?? [];
    const lastClose = closes[closes.length - 1]?.close;
    return lastClose != null && lastClose > 0 ? roundToTwo(lastClose) : null;
  }, [heldSharePrice, stockData?.data]);

  const [scenarioParams, setScenarioParams] = useState<DividendScenarioParams>(() =>
    buildInitialScenarioParams(heldShares, heldSharePrice),
  );

  useEffect(() => {
    setScenarioParams((current) => {
      const next = resolveEffectiveScenarioParams(current, {
        marketSharePrice,
        heldShares,
      });
      if (
        next.sharePrice === current.sharePrice &&
        next.investmentUsd === current.investmentUsd &&
        next.shares === current.shares
      ) {
        return current;
      }
      return next;
    });
  }, [heldShares, marketSharePrice]);

  const debouncedInvestmentInputs = useDebouncedValue(
    {
      investmentUsd: scenarioParams.investmentUsd,
      shares: scenarioParams.shares,
    },
    400,
  );

  const fetchScenarioParams = useMemo(
    () =>
      resolveEffectiveScenarioParams(
        {
          ...scenarioParams,
          investmentUsd: debouncedInvestmentInputs.investmentUsd,
          shares: debouncedInvestmentInputs.shares,
        },
        {
          marketSharePrice,
          heldShares,
        },
      ),
    [scenarioParams, debouncedInvestmentInputs, marketSharePrice, heldShares],
  );

  const snowballFetchParams = snowballAllowed ? fetchScenarioParams : {};

  const { history, isLoading, isFetching, error, refetch } = useDividendHistory(symbol, {
    accessToken: session?.accessToken,
    ...snowballFetchParams,
  });

  const displayScenarioParams = useMemo(
    () =>
      resolveEffectiveScenarioParams(scenarioParams, {
        marketSharePrice,
        heldShares,
        scenario: history?.scenario ?? null,
      }),
    [scenarioParams, marketSharePrice, heldShares, history?.scenario],
  );

  const advancedMetrics = useMemo(() => {
    if (!history || !snowballAllowed) return null;
    const sharePrice = displayScenarioParams.sharePrice ?? marketSharePrice ?? null;
    if (sharePrice == null || sharePrice <= 0) return null;

    const shares =
      displayScenarioParams.shares != null && displayScenarioParams.shares > 0
        ? displayScenarioParams.shares
        : (history.scenario?.shares ?? displayScenarioParams.shares ?? 0);
    return resolveSnowballAdvancedMetrics(history, {
      shares,
      sharePrice,
      reinvestDividends: displayScenarioParams.reinvestDividends ?? false,
      projectYears: displayScenarioParams.projectYears ?? 10,
      priceCagrPct: resolveSnowballPriceCagrPct(
        history,
        displayScenarioParams.priceCagrPct,
      ),
      annualContributionUsd: displayScenarioParams.annualContributionUsd ?? 0,
    });
  }, [history, displayScenarioParams, marketSharePrice, snowballAllowed]);

  const marketPriceReadyRef = useRef(false);
  useEffect(() => {
    marketPriceReadyRef.current = false;
  }, [symbolUpper]);

  useEffect(() => {
    if (marketSharePrice == null || marketSharePrice <= 0) return;
    if (marketPriceReadyRef.current) return;
    marketPriceReadyRef.current = true;
    refetch();
  }, [marketSharePrice, refetch]);

  const showInitialLoading = isLoading && !history;
  const showUnavailable = !showInitialLoading && !history;

  const unavailableState = (
    <EmptyState
      icon={TrendingUp}
      title="Dividend data unavailable"
      description={
        error ??
        "Historic dividend data is not available for this symbol right now."
      }
      variant="solid"
      className="py-4"
    />
  );

  return (
    <PageSplit
      main={
        showInitialLoading ? (
          <DividendSnowballSkeleton />
        ) : showUnavailable ? (
          unavailableState
        ) : history ? (
          <>
            <ResearchSectionCard
              title="Dividend history"
              description="How annual totals and each payout per share have changed over time"
              icon={LineChart}
            >
              <DividendHistoryCharts history={history} />
            </ResearchSectionCard>

            <ResearchSectionCard
              title="Dividend snowball"
              description="Historic payout growth and cash income on your share count"
              icon={TrendingUp}
            >
              <div
                className={
                  isFetching ? "space-y-4 opacity-60 transition-opacity" : "space-y-4"
                }
              >
                {isFetching ? (
                  <p className="text-xs text-muted" aria-live="polite">
                    Updating projections…
                  </p>
                ) : null}
                <DividendSummaryStats
                  history={history}
                  sharePrice={scenarioParams.sharePrice ?? marketSharePrice}
                  isEtf={isEtf}
                  expenseRatio={etfHoldings?.expense_ratio}
                />
                <ProFeatureGate
                  feature="dividendSnowball"
                  allowed={snowballAllowed}
                >
                  <div className="space-y-4">
                    <DividendSnowballStats
                      history={history}
                      sharePrice={scenarioParams.sharePrice ?? marketSharePrice}
                    />
                    <DividendSnowballScenarioCard
                      history={history}
                      scenarioParams={displayScenarioParams}
                      advancedMetrics={advancedMetrics}
                      onScenarioChange={setScenarioParams}
                    />
                  </div>
                </ProFeatureGate>
              </div>
            </ResearchSectionCard>
          </>
        ) : null
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
