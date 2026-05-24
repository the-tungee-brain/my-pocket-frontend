"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { CandlestickChart } from "lucide-react";
import { StockChart } from "@/components/StockChart";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { useStockData } from "@/app/hooks/useStockData";

type Props = {
  symbol: string;
};

export function ResearchStockChart({ symbol }: Props) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken ?? null;

  const [period, setPeriod] = useState("3mo");
  const [interval, setInterval] = useState("1d");

  const {
    data: stockData,
    loading,
    error,
    refetch,
  } = useStockData({
    symbol,
    accessToken,
    enabled: !!symbol && !!accessToken,
    period,
    interval,
  });

  return (
    <ResearchSectionCard
      title="Price chart"
      description={`${period.toUpperCase()} · ${interval.toUpperCase()}`}
      icon={CandlestickChart}
    >
      <div className="-mx-4 -mb-4">
        <StockChart
          data={stockData?.data ?? []}
          loading={loading}
          error={error?.message ?? null}
          onRetry={error ? refetch : undefined}
          symbol={stockData?.symbol ?? symbol.toUpperCase()}
          period={period}
          interval={interval}
          onPeriodChange={setPeriod}
          onIntervalChange={setInterval}
          hideHeader
          className="mt-0 max-w-none"
        />
      </div>
    </ResearchSectionCard>
  );
}
