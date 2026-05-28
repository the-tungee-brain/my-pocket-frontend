"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import { isAbortError } from "@/lib/isAbortError";

export type Sentiment = "Bullish" | "Neutral" | "Bearish";

export type StockSummary = {
  short: string;
  long: string;
  sentiment: Sentiment;
  investmentThesis: string;
  keyStrengths: string[];
  keyRisks: string[];
  whatToWatch: string[];
  valuationContext: string;
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

    const symbolKey = key;

    if (!accessToken) {
      setSummary(null);
      setIsLoading(false);
      setError("Missing access token");
      return;
    }

    const cached = stockSummaryCache.get(symbolKey);
    if (cached) {
      setSummary(cached);
      setIsLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;
    const token = accessToken;

    async function load() {
      try {
        const res = await apiFetch(
          `/research/summary?symbol=${encodeURIComponent(symbolKey)}`,
          {
            method: "GET",
            accessToken: token,
            signal,
          },
        );

        if (!res.ok) {
          throw new Error("Failed to fetch stock summary");
        }

        const data: StockSummary = await res.json();
        if (signal.aborted) return;

        stockSummaryCache.set(symbolKey, data);
        setSummary(data);
        setError(null);
      } catch (e: unknown) {
        if (signal.aborted || isAbortError(e)) return;
        const message =
          e instanceof Error ? e.message : "Error fetching stock summary";
        setError(message);
        setSummary(null);
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    setSummary(null);
    setIsLoading(true);
    setError(null);
    void load();

    return () => {
      controller.abort();
    };
  }, [symbol, accessToken]);

  return { summary, isLoading, error };
}
