"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
    projectYears,
    dividendCagrPct,
  } = options;

  const fetchParams = useMemo<DividendFetchParams>(
    () => ({
      investmentUsd,
      sharePrice,
      reinvestDividends,
      priceCagrPct,
      shares,
      projectYears,
      dividendCagrPct,
    }),
    [
      investmentUsd,
      sharePrice,
      reinvestDividends,
      priceCagrPct,
      shares,
      projectYears,
      dividendCagrPct,
    ],
  );

  const resolvedShares = resolveDividendScenarioShares(fetchParams);
  const cacheKey = symbol ? scenarioCacheKey(symbol, fetchParams) : "";
  const symbolKey = symbol?.toUpperCase().trim() ?? "";

  const [history, setHistory] = useState<DividendHistoryContext | null>(() => {
    if (!symbolKey) return null;
    return getCachedDividendHistory(symbolKey, fetchParams);
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (!symbolKey) return false;
    return getCachedDividendHistory(symbolKey, fetchParams) === null;
  });
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const historyRef = useRef(history);
  historyRef.current = history;

  const refetch = useCallback(() => {
    setRetryCount((count) => count + 1);
  }, []);

  useEffect(() => {
    if (!symbolKey) {
      setHistory(null);
      setIsLoading(false);
      setIsFetching(false);
      setError(null);
      return;
    }

    if (!accessToken) {
      setHistory(null);
      setIsLoading(false);
      setIsFetching(false);
      setError("Missing access token");
      return;
    }

    const cached = getCachedDividendHistory(symbolKey, fetchParams);
    if (cached && retryCount === 0) {
      setHistory(cached);
      setIsLoading(false);
      setIsFetching(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const keepStaleData = historyRef.current?.ticker === symbolKey;

    if (!keepStaleData) {
      setHistory(null);
      setIsLoading(true);
    }
    setIsFetching(true);

    async function load() {
      setError(null);

      try {
        const data = await fetchDividendHistory(symbolKey, accessToken!, fetchParams);
        if (cancelled) return;

        if (!data) {
          if (!keepStaleData) {
            setHistory(null);
          }
          setError("Dividend history is not available for this symbol.");
          return;
        }

        setHistory(data);
        setError(null);
      } catch (e: unknown) {
        if (cancelled) return;
        if (!keepStaleData) {
          setHistory(null);
        }
        setError(
          e instanceof Error ? e.message : "Error fetching dividend history",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setIsFetching(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [symbolKey, accessToken, cacheKey, fetchParams, retryCount]);

  return {
    history,
    isLoading,
    isFetching,
    error,
    refetch,
    shares: resolvedShares,
  };
}
