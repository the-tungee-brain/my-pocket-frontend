"use client";

import { useEffect, useMemo, useState } from "react";
import type { DividendHistoryContext } from "@/app/types/research";
import {
  fetchDividendHistory,
  getCachedDividendHistory,
  resolveDividendScenarioShares,
  scenarioCacheKey,
  type DividendFetchParams,
} from "@/lib/dividendHistory";

type UseDividendHistoryOptions = DividendFetchParams & {
  accessToken?: string | null;
};

export function useDividendHistory(
  symbol: string | null,
  options: UseDividendHistoryOptions = {},
) {
  const {
    accessToken,
    investmentUsd,
    sharePrice,
    reinvestDividends,
    priceCagrPct,
    shares,
  } = options;

  const fetchParams = useMemo<DividendFetchParams>(
    () => ({
      investmentUsd,
      sharePrice,
      reinvestDividends,
      priceCagrPct,
      shares,
    }),
    [investmentUsd, sharePrice, reinvestDividends, priceCagrPct, shares],
  );

  const resolvedShares = resolveDividendScenarioShares(fetchParams);
  const cacheKey = symbol ? scenarioCacheKey(symbol, fetchParams) : "";

  const [history, setHistory] = useState<DividendHistoryContext | null>(() => {
    if (!symbol) return null;
    return getCachedDividendHistory(symbol, fetchParams);
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (!symbol) return false;
    return getCachedDividendHistory(symbol, fetchParams) === null;
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

    const cached = getCachedDividendHistory(key, fetchParams);
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
        const data = await fetchDividendHistory(key!, accessToken!, fetchParams);
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
  }, [symbol, accessToken, cacheKey, fetchParams]);

  return { history, isLoading, error, shares: resolvedShares };
}
