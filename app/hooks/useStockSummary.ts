"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";

export type Sentiment = "Bullish" | "Neutral" | "Bearish";

export type StockSummary = {
  short: string;
  long: string;
  sentiment: Sentiment;
};

const stockSummaryCache = new Map<string, StockSummary>();

type UseStockSummaryOptions = {
  accessToken?: string | null;
};

export function useStockSummary(
  symbol: string | null,
  { accessToken }: UseStockSummaryOptions = {},
) {
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!symbol);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = symbol?.toUpperCase().trim();

    if (!key) {
      setSummary(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (!accessToken) {
      setSummary(null);
      setIsLoading(false);
      setError("Missing access token");
      return;
    }

    const cached = stockSummaryCache.get(key);
    if (cached) {
      setSummary(cached);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await apiFetch(
          `/research/summary?symbol=${encodeURIComponent(key!)}`,
          {
            method: "GET",
            accessToken: accessToken!,
          },
        );

        if (!res.ok) {
          throw new Error("Failed to fetch stock summary");
        }

        const data: StockSummary = await res.json();
        if (cancelled) return;

        stockSummaryCache.set(key!, data);
        setSummary(data);
        setError(null);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Error fetching stock summary");
        setSummary(null);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [symbol, accessToken]);

  return { summary, isLoading, error };
}