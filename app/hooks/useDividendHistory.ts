"use client";

import { useEffect, useState } from "react";
import type { DividendHistoryContext } from "@/app/types/research";
import {
  defaultDividendScenarioShares,
  fetchDividendHistory,
  getCachedDividendHistory,
} from "@/lib/dividendHistory";

type UseDividendHistoryOptions = {
  accessToken?: string | null;
  shares?: number | null;
};

export function useDividendHistory(
  symbol: string | null,
  { accessToken, shares }: UseDividendHistoryOptions = {},
) {
  const resolvedShares = defaultDividendScenarioShares(shares);
  const [history, setHistory] = useState<DividendHistoryContext | null>(() => {
    if (!symbol) return null;
    return getCachedDividendHistory(symbol, resolvedShares);
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (!symbol) return false;
    return getCachedDividendHistory(symbol, resolvedShares) === null;
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = symbol?.toUpperCase().trim();
    if (!key) {
      setHistory(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (!accessToken) {
      setHistory(null);
      setIsLoading(false);
      setError("Missing access token");
      return;
    }

    const cached = getCachedDividendHistory(key, resolvedShares);
    if (cached) {
      setHistory(cached);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchDividendHistory(key!, accessToken!, resolvedShares);
        if (cancelled) return;

        if (!data) {
          setHistory(null);
          setError("Dividend history is not available for this symbol.");
          return;
        }

        setHistory(data);
        setError(null);
      } catch (e: unknown) {
        if (cancelled) return;
        setHistory(null);
        setError(
          e instanceof Error ? e.message : "Error fetching dividend history",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [symbol, accessToken, resolvedShares]);

  return { history, isLoading, error, shares: resolvedShares };
}
