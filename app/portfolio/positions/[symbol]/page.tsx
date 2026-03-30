"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePositionsContext } from "@/app/Providers";
import { AccountPositionList } from "@/components/AccountPositionList";
import { Insights } from "@/components/Insights";
import { useCompanyNews } from "@/app/hooks/useCompanyNews";
import { CompanyNews } from "@/components/CompanyNews";
import { useTabs } from "@/app/contexts/TabContext";
import { StockChart } from "@/components/StockChart";
import { useStockData } from "@/app/hooks/useStockData";

export default function SymbolPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const { activeTab } = useTabs();
  const { error, positionMap, setSelectedView, setSelectedSymbol } =
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
    refetch,
  } = useCompanyNews(symbol, accessToken, activeTab);

  const {
    data: stockData,
    loading: stockLoading,
    error: stockError,
  } = useStockData({
    symbol: symbol ?? null,
    accessToken: accessToken ?? null,
    enabled: !!symbol && !!accessToken && activeTab === "assistant",
    period,
    interval,
  });

  const positionsForSelectedSymbol =
    symbol && positionMap[symbol] ? positionMap[symbol] : null;

  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
  };

  const handleIntervalChange = (newInterval: string) => {
    setInterval(newInterval);
  };

  return (
    <>
      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      {activeTab === "assistant" && symbol && (
        <div className="mb-6">
          {stockError && (
            <p className="mb-3 text-sm text-red-400">
              Failed to load chart: {stockError.message}
            </p>
          )}

          <StockChart
            data={stockData?.data ?? []}
            loading={isLoading}
            symbol={stockData?.symbol ?? symbol}
            period={period}
            interval={interval}
            onPeriodChange={handlePeriodChange}
            onIntervalChange={handleIntervalChange}
          />
        </div>
      )}

      {activeTab === "assistant" && (
        <>
          <AccountPositionList
            positionsForSelectedSymbol={positionsForSelectedSymbol}
            selectedSymbol={symbol}
          />
          <Insights
            symbol={symbol}
            positions={positionsForSelectedSymbol}
            thinkingMessage={
              symbol ? `Analyzing your ${symbol} positions` : "Analyzing"
            }
          />
        </>
      )}

      {activeTab === "news" && (
        <CompanyNews
          symbol={symbol}
          analytics={analytics}
          isLoading={isLoading}
          error={newsError}
          onRetry={refetch}
        />
      )}
    </>
  );
}
