"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchStrategyStockScreener } from "@/lib/apiClient";
import type {
  InvestmentStrategy,
  StrategyScreenerFilters,
  StrategyStockScreenerResult,
} from "@/app/types/strategy";
import {
  defaultWheelScreenerFilters,
  screenerFiltersFingerprint,
} from "@/lib/strategyScreener";

type UseStrategyStockScreenerOptions = {
  accessToken: string | undefined;
  strategy: InvestmentStrategy | null;
  enabled?: boolean;
  filters?: StrategyScreenerFilters;
  limit?: number;
  autoRun?: boolean;
  prepareProfile?: () => Promise<void>;
  prepareOnAutoFetch?: boolean;
};

const cache = new Map<string, StrategyStockScreenerResult>();

function getCacheKey(
  strategy: InvestmentStrategy,
  filters: StrategyScreenerFilters,
  limit: number,
) {
  return `${strategy}:${screenerFiltersFingerprint(filters)}:${limit}`;
}

export function useStrategyStockScreener({
  accessToken,
  strategy,
  enabled = true,
  filters = defaultWheelScreenerFilters(),
  limit = 50,
  autoRun = true,
  prepareProfile,
  prepareOnAutoFetch = false,
}: UseStrategyStockScreenerOptions) {
  const [result, setResult] = useState<StrategyStockScreenerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const [fetchedFilterKey, setFetchedFilterKey] = useState<string | null>(null);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const prepareRef = useRef(prepareProfile);
  prepareRef.current = prepareProfile;

  const runScreen = useCallback(
    async (opts?: { force?: boolean; syncProfile?: boolean }) => {
      if (!accessToken || !strategy || !enabled) return;

      const activeFilters = filtersRef.current;
      const cacheKey = getCacheKey(strategy, activeFilters, limit);

      if (!opts?.force) {
        const cached = cache.get(cacheKey);
        if (cached) {
          setResult(cached);
          setFetchedFilterKey(screenerFiltersFingerprint(activeFilters));
          setHasRun(true);
          setError(null);
          return;
        }
      }

      setLoading(true);
      setError(null);

      try {
        if (opts?.syncProfile && prepareRef.current) {
          await prepareRef.current();
        }
        const data = await fetchStrategyStockScreener(
          accessToken,
          strategy,
          activeFilters,
          limit,
        );
        cache.set(cacheKey, data);
        setResult(data);
        setFetchedFilterKey(screenerFiltersFingerprint(activeFilters));
        setHasRun(true);
      } catch (err) {
        setResult(null);
        setFetchedFilterKey(null);
        setError(
          err instanceof Error ? err.message : "Could not run stock screener.",
        );
      } finally {
        setLoading(false);
      }
    },
    [accessToken, strategy, enabled, limit],
  );

  useEffect(() => {
    if (!accessToken || !strategy || !enabled || !autoRun) {
      setResult(null);
      setFetchedFilterKey(null);
      setHasRun(false);
      setError(null);
      return;
    }

    void runScreen({ syncProfile: prepareOnAutoFetch });
  }, [accessToken, strategy, enabled, autoRun, prepareOnAutoFetch, runScreen, filters, limit]);

  const stale = useMemo(() => {
    if (fetchedFilterKey === null) return false;
    return fetchedFilterKey !== screenerFiltersFingerprint(filters);
  }, [fetchedFilterKey, filters]);

  return {
    result,
    loading,
    error,
    hasRun,
    stale,
    runScreen,
  };
}
