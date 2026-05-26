"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { StockChart } from "@/components/StockChart";
import { useStockData } from "@/app/hooks/useStockData";
import { pageSectionClass } from "@/lib/pageLayout";

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
      className={pageSectionClass}
    />
  );
}
