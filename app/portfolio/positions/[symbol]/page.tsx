"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePositionsContext } from "@/app/Providers";
import { AccountPositionList } from "@/components/AccountPositionList";
import { CashSecuredPutSummary } from "@/components/CashSecuredPutSummary";
import { AssignmentRiskSummary } from "@/components/AssignmentRiskSummary";
import { Insights } from "@/components/Insights";
import { RecentActivitySection } from "@/components/RecentActivitySection";
import { useCompanyNews } from "@/app/hooks/useCompanyNews";
import { CompanyNews } from "@/components/CompanyNews";
import { useTabs } from "@/app/contexts/TabContext";
import { StockChart } from "@/components/StockChart";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useStockData } from "@/app/hooks/useStockData";
import { summarizeCspCashReserves } from "@/lib/cspReservedCash";
import { filterAssignmentRiskSummary } from "@/lib/assignmentRiskSummary";

export default function SymbolPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const { activeTab } = useTabs();
  const { error, positionMap, setSelectedView, setSelectedSymbol, account, assignmentRiskSummary, sendQuickAction } =
    usePositionsContext();
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;

  const [period, setPeriod] = useState<string>("3mo");
  const [interval, setInterval] = useState<string>("1d");

  useEffect(() => {
    setSelectedView("symbol");
    setSelectedSymbol(symbol ?? null);
  }, [symbol, setSelectedView, setSelectedSymbol]);

  const {
    analytics,
    isLoading,
    error: newsError,
    lastUpdated: newsLastUpdated,
    refetch,
  } = useCompanyNews(symbol, accessToken, activeTab);

  const {
    data: stockData,
    loading: stockLoading,
    error: stockError,
    refetch: refetchStock,
  } = useStockData({
    symbol: symbol ?? null,
    accessToken: accessToken ?? null,
    enabled: !!symbol && !!accessToken && activeTab === "assistant",
    period,
    interval,
  });

  const positionsForSelectedSymbol =
    symbol && positionMap[symbol] ? positionMap[symbol] : null;

  const symbolCspSummary = positionsForSelectedSymbol
    ? summarizeCspCashReserves(
        positionsForSelectedSymbol,
        account?.securitiesAccount.currentBalances.cashBalance,
      )
    : null;

  const symbolAssignmentRiskSummary =
    assignmentRiskSummary && symbol
      ? filterAssignmentRiskSummary(assignmentRiskSummary, symbol)
      : null;

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
  };

  const handleIntervalChange = (newInterval: string) => {
    setInterval(newInterval);
  };

  const handleSuggestedAction = useCallback(
    (actionId: string) => {
      if (!symbol) return;
      void sendQuickAction({
        activeChatKey: symbol,
        selectedView: "symbol",
        selectedSymbol: symbol,
        positionsForSelectedSymbol: positionsForSelectedSymbol ?? [],
        actionId,
      });
    },
    [symbol, sendQuickAction, positionsForSelectedSymbol],
  );

  return (
    <>
      {error && <ErrorBanner message={error} className="mb-3" />}

      {activeTab === "assistant" && (
        <div
          id="panel-assistant"
          role="tabpanel"
          aria-labelledby="tab-assistant"
        >
          {symbol && (
            <div className="mb-6">
              <StockChart
                data={stockData?.data ?? []}
                loading={stockLoading}
                error={stockError?.message ?? null}
                onRetry={stockError ? refetchStock : undefined}
                symbol={stockData?.symbol ?? symbol}
                period={period}
                interval={interval}
                onPeriodChange={handlePeriodChange}
                onIntervalChange={handleIntervalChange}
              />
            </div>
          )}

          {symbolCspSummary && symbolCspSummary.totalReservedCash > 0 && (
            <div className="mb-4">
              <CashSecuredPutSummary
                summary={symbolCspSummary}
                cashBalance={account?.securitiesAccount.currentBalances.cashBalance}
                compact
              />
            </div>
          )}

          {symbolAssignmentRiskSummary && (
            <div className="mb-4">
              <AssignmentRiskSummary
                summary={symbolAssignmentRiskSummary}
                compact
              />
            </div>
          )}

          <AccountPositionList
            positionsForSelectedSymbol={positionsForSelectedSymbol}
            selectedSymbol={symbol}
          />

          {accessToken && symbol && (
            <RecentActivitySection
              className="mt-4"
              accessToken={accessToken}
              symbol={symbol}
              onRunSuggestedAction={handleSuggestedAction}
            />
          )}

          <Insights
            symbol={symbol}
            positions={positionsForSelectedSymbol}
            thinkingMessage={
              symbol ? `Analyzing your ${symbol} positions` : "Analyzing"
            }
          />
        </div>
      )}

      {activeTab === "news" && (
        <div
          id="panel-news"
          role="tabpanel"
          aria-labelledby="tab-news"
        >
          <CompanyNews
            symbol={symbol}
            analytics={analytics}
            isLoading={isLoading}
            error={newsError}
            lastUpdated={newsLastUpdated}
            onRetry={refetch}
          />
        </div>
      )}
    </>
  );
}
