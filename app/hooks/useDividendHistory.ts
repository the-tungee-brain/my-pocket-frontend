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
  type DividendHistoryVariant,
} from "@/lib/dividendHistory";

type UseDividendHistoryOptions = DividendFetchParams & {
  accessToken?: string | null;
  enabled?: boolean;
  variant?: DividendHistoryVariant;
};

export function useDividendHistory(
  symbol: string | null,
  options: UseDividendHistoryOptions = {},
) {
  const {
    accessToken,
    enabled = true,
    variant = "snowball",
    investmentUsd,
    sharePrice,
    reinvestDividends,
    priceCagrPct,
    shares,
    projectYears,
    dividendCagrPct,
    annualContributionUsd,
    historyStartYear,
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
      historyStartYear,
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
      historyStartYear,
    ],
  );

  const resolvedShares = resolveDividendScenarioShares(fetchParams);
  const cacheKey = symbol ? scenarioCacheKey(symbol, fetchParams, variant) : "";
  const symbolKey = symbol?.toUpperCase().trim() ?? "";

  const [history, setHistory] = useState<DividendHistoryContext | null>(() => {
    if (!symbolKey || !enabled) return null;
    return getCachedDividendHistory(symbolKey, fetchParams, variant);
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (!symbolKey || !enabled) return false;
    return getCachedDividendHistory(symbolKey, fetchParams, variant) === null;
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

    if (!enabled) {
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

    const cached = getCachedDividendHistory(symbolKey, fetchParams, variant);
    const hasFetchSharePrice =
      fetchParams.sharePrice != null && fetchParams.sharePrice > 0;
    if (
      cached &&
      retryCount === 0 &&
      variant === "snowball" &&
      !hasFetchSharePrice &&
      !needsProjectionRefetch(cached, fetchParams)
    ) {
      setHistory(mergeHistory(cached, historyRef.current));
      setIsLoading(false);
      setIsFetching(false);
      setError(null);
      return;
    }

    if (cached && retryCount === 0 && variant !== "snowball") {
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
        const data = await fetchDividendHistory(
          symbolKey,
          accessToken!,
          fetchParams,
          variant,
        );
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
  }, [
    symbolKey,
    accessToken,
    cacheKey,
    fetchParams,
    retryCount,
    enabled,
    variant,
  ]);

  return {
    history,
    isLoading,
    isFetching,
    error,
    refetch,
    shares: resolvedShares,
  };
}
