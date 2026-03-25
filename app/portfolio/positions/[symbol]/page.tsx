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
  } = useCompanyNews(symbol, accessToken);

  const positionsForSelectedSymbol =
    symbol && positionMap[symbol] ? positionMap[symbol] : null;

  return (
    <>
      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

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
