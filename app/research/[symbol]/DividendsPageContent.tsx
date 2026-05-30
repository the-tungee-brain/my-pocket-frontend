"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { History, LineChart, RotateCcw, TrendingUp } from "lucide-react";
import { useSession } from "next-auth/react";
import { useAccountPlan } from "@/app/hooks/useAccountPlan";
import { useDividendHistory } from "@/app/hooks/useDividendHistory";
import { ProFeatureGate } from "@/components/ProFeatureGate";
import { useEtfHoldings } from "@/app/hooks/useEtfHoldings";
import { useStockData } from "@/app/hooks/useStockData";
import { usePortfolioContext } from "@/app/contextSelectors";
import { useResearchAssetTypeContext } from "./ResearchAssetTypeContext";
import type { Position } from "@/app/types/schwab";
import type {
  DividendBacktestParams,
  DividendHistoryContext,
  DividendSnowballParams,
} from "@/app/types/research";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import {
  ResearchScrollSpy,
  ResearchScrollSpySection,
} from "@/components/ResearchScrollSpy";
import { EmptyState } from "@/components/ui/EmptyState";
import { FreshnessLabel } from "@/components/ui/FreshnessLabel";
import { appStackClass } from "@/lib/appUi";
import { pageSectionClass } from "@/lib/pageLayout";
import {
  backtestParamsMatch,
  completedDividendYears,
  defaultDividendInvestmentUsd,
  dividendScenarioInputsValid,
  resolveDraftBacktestDisplayParams,
  resolveEffectiveBacktestParams,
  resolveEffectiveSnowballParams,
  resolveSnowballAdvancedMetrics,
  resolveSnowballPriceCagrPct,
  snowballParamsMatch,
} from "@/lib/dividendHistory";
import {
  DividendHistoryCharts,
  DividendHistoricalBacktestCard,
  DividendRecentPaymentsTable,
  DividendSnowballScenarioCard,
  DividendsPageSkeleton,
  DividendSummaryStats,
} from "./DividendSnowballSections";
import { hasProFeature } from "@/lib/planFeatures";
import { cn } from "@/lib/utils";

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

function buildInitialPositionParams(
  heldShares: number,
  sharePrice: number | null,
): DividendSnowballParams {
  const price =
    sharePrice != null && sharePrice > 0 ? roundToTwo(sharePrice) : null;

  if (heldShares > 0 && price != null) {
    const shares = roundToTwo(heldShares);
    return {
      investmentUsd: roundToTwo(shares * price),
      sharePrice: price,
      shares,
      projectYears: 10,
      reinvestDividends: true,
      annualContributionUsd: 0,
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
    reinvestDividends: true,
    annualContributionUsd: 0,
    priceCagrPct: null,
  };
}

function mergeBacktestHistory(
  base: DividendHistoryContext,
  backtest: DividendHistoryContext | null,
): DividendHistoryContext {
  if (!backtest?.historicalBacktest) return base;
  return {
    ...base,
    historicalBacktest: backtest.historicalBacktest,
    annualIncome: backtest.annualIncome,
  };
}

function mergeSnowballHistory(
  base: DividendHistoryContext,
  snowball: DividendHistoryContext | null,
): DividendHistoryContext {
  if (!snowball) return base;
  return {
    ...base,
    scenario: snowball.scenario,
    priceCagrPct: snowball.priceCagrPct ?? base.priceCagrPct,
  };
}

export function DividendsPageContent({ symbol }: Props) {
  const { data: session } = useSession();
  const { isPaid, plan } = useAccountPlan(session?.accessToken);
  const snowballAllowed = hasProFeature(isPaid, "dividendSnowball", plan);
  const { isEtf } = useResearchAssetTypeContext();
  const { positionMap } = usePortfolioContext();
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

  const [snowballDraft, setSnowballDraft] = useState<DividendSnowballParams>(() =>
    buildInitialPositionParams(heldShares, heldSharePrice),
  );
  const [snowballApplied, setSnowballApplied] = useState<DividendSnowballParams>(() =>
    buildInitialPositionParams(heldShares, heldSharePrice),
  );
  const [backtestDraft, setBacktestDraft] = useState<DividendBacktestParams>(() => {
    const initial = buildInitialPositionParams(heldShares, heldSharePrice);
    const { projectYears: _projectYears, dividendCagrPct: _dividendCagrPct, ...rest } =
      initial;
    return rest;
  });
  const [backtestApplied, setBacktestApplied] = useState<DividendBacktestParams>(() => {
    const initial = buildInitialPositionParams(heldShares, heldSharePrice);
    const { projectYears: _projectYears, dividendCagrPct: _dividendCagrPct, ...rest } =
      initial;
    return rest;
  });

  useEffect(() => {
    setSnowballDraft((current) => {
      const next = resolveEffectiveSnowballParams(current, {
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
    setBacktestDraft((current) => {
      const next = resolveEffectiveBacktestParams(current, {
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

  const positionOptions = useMemo(
    () => ({ marketSharePrice, heldShares }),
    [marketSharePrice, heldShares],
  );

  const snowballFetchParams = useMemo(
    () => resolveEffectiveSnowballParams(snowballApplied, positionOptions),
    [snowballApplied, positionOptions],
  );

  const backtestFetchParams = useMemo(
    () =>
      resolveEffectiveBacktestParams(
        {
          ...backtestApplied,
          sharePrice: marketSharePrice ?? backtestApplied.sharePrice,
        },
        positionOptions,
      ),
    [backtestApplied, marketSharePrice, positionOptions],
  );

  const {
    history: baseHistory,
    isLoading,
    isFetching: baseFetching,
    error,
    refetch: refetchBase,
  } = useDividendHistory(symbol, {
    accessToken: session?.accessToken,
    variant: "base",
  });

  const {
    history: snowballHistory,
    isFetching: snowballFetching,
    refetch: refetchSnowball,
  } = useDividendHistory(symbol, {
    accessToken: session?.accessToken,
    enabled: snowballAllowed,
    variant: "snowball",
    ...snowballFetchParams,
  });

  const {
    history: backtestHistory,
    isFetching: backtestFetching,
    refetch: refetchBacktest,
  } = useDividendHistory(symbol, {
    accessToken: session?.accessToken,
    enabled: snowballAllowed,
    variant: "backtest",
    ...backtestFetchParams,
  });

  const history = baseHistory;
  const backtestDisplayHistory = useMemo(
    () => (history ? mergeBacktestHistory(history, backtestHistory) : null),
    [history, backtestHistory],
  );
  const snowballDisplayHistory = useMemo(
    () => (history ? mergeSnowballHistory(history, snowballHistory) : null),
    [history, snowballHistory],
  );

  const completedYears = useMemo(
    () => (history ? completedDividendYears(history) : []),
    [history],
  );

  const displayBacktestParams = useMemo(
    () =>
      resolveDraftBacktestDisplayParams(backtestDraft, {
        marketSharePrice,
        heldShares,
        priceCagrPct: backtestHistory
          ? resolveSnowballPriceCagrPct(
              backtestHistory,
              backtestDraft.priceCagrPct,
            )
          : backtestDraft.priceCagrPct,
        completedYears,
        appliedBacktest: backtestHistory?.historicalBacktest ?? null,
      }),
    [
      backtestDraft,
      backtestHistory,
      marketSharePrice,
      heldShares,
      completedYears,
    ],
  );

  const appliedDisplaySnowballParams = useMemo(
    () =>
      resolveEffectiveSnowballParams(snowballApplied, {
        marketSharePrice,
        heldShares,
        scenario: snowballHistory?.scenario ?? null,
      }),
    [snowballApplied, marketSharePrice, heldShares, snowballHistory?.scenario],
  );

  const hasPendingSnowballChanges = useMemo(
    () => !snowballParamsMatch(snowballDraft, snowballApplied, positionOptions),
    [snowballDraft, snowballApplied, positionOptions],
  );

  const hasPendingBacktestChanges = useMemo(
    () => !backtestParamsMatch(backtestDraft, backtestApplied, positionOptions),
    [backtestDraft, backtestApplied, positionOptions],
  );

  const applySnowball = useCallback(() => {
    setSnowballApplied(
      resolveEffectiveSnowballParams(snowballDraft, positionOptions),
    );
  }, [snowballDraft, positionOptions]);

  const applyBacktest = useCallback(() => {
    setBacktestApplied(
      resolveEffectiveBacktestParams(
        {
          ...backtestDraft,
          sharePrice: marketSharePrice ?? backtestDraft.sharePrice,
        },
        positionOptions,
      ),
    );
  }, [backtestDraft, marketSharePrice, positionOptions]);

  const advancedMetrics = useMemo(() => {
    if (!snowballDisplayHistory || !snowballAllowed) return null;
    const sharePrice =
      appliedDisplaySnowballParams.sharePrice ?? marketSharePrice ?? null;
    if (sharePrice == null || sharePrice <= 0) return null;

    const shares =
      appliedDisplaySnowballParams.shares != null &&
      appliedDisplaySnowballParams.shares > 0
        ? appliedDisplaySnowballParams.shares
        : (snowballDisplayHistory.scenario?.shares ??
          appliedDisplaySnowballParams.shares ??
          0);
    return resolveSnowballAdvancedMetrics(snowballDisplayHistory, {
      shares,
      sharePrice,
      reinvestDividends: appliedDisplaySnowballParams.reinvestDividends ?? true,
      projectYears: appliedDisplaySnowballParams.projectYears ?? 10,
      priceCagrPct: resolveSnowballPriceCagrPct(
        snowballDisplayHistory,
        appliedDisplaySnowballParams.priceCagrPct,
      ),
      annualContributionUsd: appliedDisplaySnowballParams.annualContributionUsd ?? 0,
    });
  }, [
    snowballDisplayHistory,
    appliedDisplaySnowballParams,
    marketSharePrice,
    snowballAllowed,
  ]);

  const isFetching = baseFetching || snowballFetching || backtestFetching;
  const snowballApplying = snowballFetching && !hasPendingSnowballChanges;
  const backtestApplying = backtestFetching && !hasPendingBacktestChanges;

  const marketPriceReadyRef = useRef(false);
  useEffect(() => {
    marketPriceReadyRef.current = false;
  }, [symbolUpper]);

  useEffect(() => {
    if (marketSharePrice == null || marketSharePrice <= 0) return;
    if (marketPriceReadyRef.current) return;
    marketPriceReadyRef.current = true;

    const nextSnowball = resolveEffectiveSnowballParams(
      snowballDraft,
      positionOptions,
    );
    const nextBacktest = resolveEffectiveBacktestParams(
      {
        ...backtestDraft,
        sharePrice: marketSharePrice,
      },
      positionOptions,
    );
    setSnowballApplied(nextSnowball);
    setBacktestApplied(nextBacktest);

    refetchBase();
    if (snowballAllowed) {
      refetchSnowball();
      refetchBacktest();
    }
  }, [
    marketSharePrice,
    refetchBase,
    refetchSnowball,
    refetchBacktest,
    snowballAllowed,
    snowballDraft,
    backtestDraft,
    positionOptions,
  ]);

  const showInitialLoading = isLoading && !history;
  const showUnavailable = !showInitialLoading && !history;

  if (showInitialLoading) {
    return <DividendsPageSkeleton />;
  }

  if (showUnavailable) {
    return (
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
  }

  if (!history || !backtestDisplayHistory || !snowballDisplayHistory) {
    return null;
  }

  return (
    <ResearchScrollSpy
      className={cn(pageSectionClass, appStackClass, "w-full max-w-none")}
    >
      <ResearchScrollSpySection id="dividend-history" label="History">
        <ResearchSectionCard
          title="Dividend history"
          description="How annual totals and each payout per share have changed over time"
          icon={LineChart}
        >
          <DividendHistoryCharts history={history} />
        </ResearchSectionCard>
      </ResearchScrollSpySection>

      <ResearchScrollSpySection id="dividend-payments" label="Payments">
        <ResearchSectionCard
          title="Recent payments"
          description="Latest dividend payments per share"
          icon={History}
          action={
            history.dataAsOf ? (
              <FreshnessLabel dataAsOf={history.dataAsOf} variant="badge" />
            ) : undefined
          }
        >
          <DividendRecentPaymentsTable payments={history.recentPayments} />
          {history.cagr10yPct != null ? (
            <p className="mt-3 shrink-0 text-[11px] text-muted">
              10-year dividend CAGR: {history.cagr10yPct.toFixed(1)}%
            </p>
          ) : null}
        </ResearchSectionCard>
      </ResearchScrollSpySection>

      <ResearchScrollSpySection id="dividend-backtest" label="Backtest">
        <ResearchSectionCard
          title="Dividend backtest"
          description="How much cash this position would have collected over past dividend history"
          icon={RotateCcw}
          className="w-full max-w-none"
        >
          <div
            className={cn(
              "space-y-4 transition-opacity",
              isFetching && "opacity-60",
            )}
            aria-busy={isFetching}
          >
            <ProFeatureGate
              feature="dividendSnowball"
              allowed={snowballAllowed}
              title="Dividend backtest"
              description="Replay actual dividend history — cash collected, annual totals, and DRIP simulation over a window you choose."
            >
              <DividendHistoricalBacktestCard
                history={backtestDisplayHistory}
                backtestParams={backtestDraft}
                displayParams={displayBacktestParams}
                onBacktestChange={setBacktestDraft}
                onApply={applyBacktest}
                canApply={dividendScenarioInputsValid(
                  backtestDraft,
                  marketSharePrice,
                )}
                hasPendingChanges={hasPendingBacktestChanges}
                isApplying={backtestApplying}
              />
            </ProFeatureGate>
          </div>
        </ResearchSectionCard>
      </ResearchScrollSpySection>

      <ResearchScrollSpySection id="dividend-snowball" label="Snowball">
        <ResearchSectionCard
          title="Dividend snowball"
          description="Historic payout growth and cash income on your share count"
          icon={TrendingUp}
          className="w-full max-w-none"
        >
          <div
            className={cn(
              "space-y-4 transition-opacity",
              isFetching && "opacity-60",
            )}
            aria-busy={isFetching}
          >
            <DividendSummaryStats
              history={snowballDisplayHistory}
              sharePrice={appliedDisplaySnowballParams.sharePrice ?? marketSharePrice}
              isEtf={isEtf}
              expenseRatio={etfHoldings?.expense_ratio}
              includeSnowball={snowballAllowed}
              advancedMetrics={advancedMetrics}
            />
            <ProFeatureGate
              feature="dividendSnowball"
              allowed={snowballAllowed}
            >
              <div className="app-stack w-full max-w-none">
                <DividendSnowballScenarioCard
                  history={snowballDisplayHistory}
                  snowballParams={snowballDraft}
                  advancedMetrics={advancedMetrics}
                  onSnowballChange={setSnowballDraft}
                  onApply={applySnowball}
                  canApply={dividendScenarioInputsValid(
                    snowballDraft,
                    marketSharePrice,
                  )}
                  hasPendingChanges={hasPendingSnowballChanges}
                  isApplying={snowballApplying}
                />
              </div>
            </ProFeatureGate>
          </div>
        </ResearchSectionCard>
      </ResearchScrollSpySection>
    </ResearchScrollSpy>
  );
}
