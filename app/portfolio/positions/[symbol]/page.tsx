"use client";

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePositionsContext } from "@/app/Providers";
import { AccountPositionList } from "@/components/AccountPositionList";
import { Insights } from "@/components/Insights";
import { useCompanyNews } from "@/app/hooks/useCompanyNews";
import { CompanyNews } from "@/components/CompanyNews";
import { useTabs } from "@/app/contexts/TabContext";
import { StockChart } from "@/components/StockChart";
import { useStockData } from "@/app/hooks/useStockData";
import { ThinkingSpinner } from "@/components/ui/ThinkingSpinner";

export default function SymbolPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const { activeTab } = useTabs();
  const { error, positionMap, setSelectedView, setSelectedSymbol } =
    usePositionsContext();
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;

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
    enabled: !!symbol && !!accessToken,
  });

  const positionsForSelectedSymbol =
    symbol && positionMap[symbol] ? positionMap[symbol] : null;

  return (
    <>
      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      {symbol && (
        <div className="mb-6">
          {stockError && (
            <p className="mb-3 text-sm text-red-400">
              Failed to load chart: {stockError.message}
            </p>
          )}

          {stockLoading ? (
            <ThinkingSpinner message={`Loading ${symbol} chart`} />
          ) : stockData ? (
            <StockChart data={stockData.data} symbol={stockData.symbol} />
          ) : null}
        </div>
      )}

      {activeTab === "assistant" ? (
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
      ) : null}

      {activeTab === "news" ? (
        <CompanyNews
          symbol={symbol}
          analytics={analytics}
          isLoading={isLoading}
          error={newsError}
          onRetry={refetch}
        />
      ) : null}
    </>
  );
}
