"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DividendHistoryContext } from "@/app/types/research";
import {
  fetchDividendHistory,
  getCachedDividendHistory,
  mergeDividendHistoryContext,
  needsProjectionRefetch,
  resolveDividendScenarioShares,
  resolveSnowballPriceCagrPct,
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
    annualContributionUsd,
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
      annualContributionUsd,
    }),
    [
      investmentUsd,
      sharePrice,
      reinvestDividends,
      priceCagrPct,
      shares,
      projectYears,
      dividendCagrPct,
      annualContributionUsd,
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
  const priceCagrRef = useRef<number | null>(null);

  const refetch = useCallback(() => {
    setRetryCount((count) => count + 1);
  }, []);

  function mergeHistory(
    next: DividendHistoryContext,
    previous: DividendHistoryContext | null,
  ): DividendHistoryContext {
    const merged = mergeDividendHistoryContext(next, previous);
    const resolvedPriceCagr = resolveSnowballPriceCagrPct(merged);
    if (resolvedPriceCagr != null) {
      priceCagrRef.current = resolvedPriceCagr;
    } else if (priceCagrRef.current != null) {
      return { ...merged, priceCagrPct: priceCagrRef.current };
    }
    return merged;
  }

  useEffect(() => {
    if (!symbolKey) {
      setHistory(null);
      setIsLoading(false);
      setIsFetching(false);
      setError(null);
      priceCagrRef.current = null;
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
    const hasFetchSharePrice =
      fetchParams.sharePrice != null && fetchParams.sharePrice > 0;
    if (
      cached &&
      retryCount === 0 &&
      !hasFetchSharePrice &&
      !needsProjectionRefetch(cached, fetchParams)
    ) {
      setHistory(mergeHistory(cached, historyRef.current));
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

        setHistory(mergeHistory(data, historyRef.current));
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
