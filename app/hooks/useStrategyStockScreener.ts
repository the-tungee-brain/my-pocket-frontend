"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDebouncedValue } from "@/app/hooks/useDebouncedValue";
import { fetchStrategyStockScreener } from "@/lib/apiClient";
import type {
  InvestmentStrategy,
  StrategyScreenerFilters,
  StrategyStockScreenerResult,
} from "@/app/types/strategy";
import {
  DEFAULT_PAGE_SIZE,
  screenerFiltersFingerprint,
} from "@/lib/strategyScreener";

type UseStrategyStockScreenerOptions = {
  accessToken: string | undefined;
  strategy: InvestmentStrategy | null;
  enabled?: boolean;
  filters?: StrategyScreenerFilters;
  pageSize?: number;
  autoRun?: boolean;
  prepareProfile?: () => Promise<void>;
  prepareOnAutoFetch?: boolean;
};

const cache = new Map<string, StrategyStockScreenerResult>();

function getCacheKey(
  strategy: InvestmentStrategy,
  filters: StrategyScreenerFilters,
  page: number,
  pageSize: number,
) {
  return `${strategy}:${screenerFiltersFingerprint(filters, page)}:${pageSize}`;
}

function filtersOnlyKey(
  strategy: InvestmentStrategy,
  filters: StrategyScreenerFilters,
) {
  return `${strategy}:${screenerFiltersFingerprint(filters, 1)}`;
}

export function useStrategyStockScreener({
  accessToken,
  strategy,
  enabled = true,
  filters,
  pageSize = DEFAULT_PAGE_SIZE,
  autoRun = true,
  prepareProfile,
  prepareOnAutoFetch = false,
}: UseStrategyStockScreenerOptions) {
  const [result, setResult] = useState<StrategyStockScreenerResult | null>(null);
  const [initialLoading, setInitialLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const [page, setPage] = useState(1);
  const [fetchedFilterKey, setFetchedFilterKey] = useState<string | null>(null);

  const debouncedFilters = useDebouncedValue(filters, 400);
  const filtersRef = useRef(debouncedFilters);
  filtersRef.current = debouncedFilters;

  const pageRef = useRef(page);
  pageRef.current = page;

  const prepareRef = useRef(prepareProfile);
  prepareRef.current = prepareProfile;

  const requestSeqRef = useRef(0);
  const syncedStrategyRef = useRef<string | null>(null);
  const filtersKeyRef = useRef<string | null>(null);
  const resultRef = useRef(result);
  resultRef.current = result;

  const runScreen = useCallback(
    async (opts?: { force?: boolean; syncProfile?: boolean; page?: number }) => {
      if (!accessToken || !strategy || !enabled || !filtersRef.current) return;

      const activeFilters = filtersRef.current;
      const activePage = opts?.page ?? pageRef.current;
      const cacheKey = getCacheKey(strategy, activeFilters, activePage, pageSize);
      const requestSeq = ++requestSeqRef.current;

      if (!opts?.force) {
        const cached = cache.get(cacheKey);
        if (cached) {
          setResult(cached);
          setPage(cached.page);
          setFetchedFilterKey(screenerFiltersFingerprint(activeFilters, cached.page));
          setHasRun(true);
          setError(null);
          return;
        }
      }

      const showInitialLoader = resultRef.current === null;
      if (showInitialLoader) {
        setInitialLoading(true);
      } else {
        setIsFetching(true);
      }
      setError(null);

      try {
        if (opts?.syncProfile && prepareRef.current) {
          await prepareRef.current();
        }

        const data = await fetchStrategyStockScreener(
          accessToken,
          strategy,
          activeFilters,
          activePage,
          pageSize,
        );

        if (requestSeq !== requestSeqRef.current) {
          return;
        }

        cache.set(cacheKey, data);
        setResult(data);
        setPage(data.page);
        setFetchedFilterKey(screenerFiltersFingerprint(activeFilters, data.page));
        setHasRun(true);
      } catch (err) {
        if (requestSeq !== requestSeqRef.current) {
          return;
        }
        if (showInitialLoader) {
          setResult(null);
          setFetchedFilterKey(null);
        }
        setError(
          err instanceof Error ? err.message : "Could not run stock screener.",
        );
      } finally {
        if (requestSeq === requestSeqRef.current) {
          setInitialLoading(false);
          setIsFetching(false);
        }
      }
    },
    [accessToken, strategy, enabled, pageSize],
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedFilters, strategy]);

  useEffect(() => {
    if (!accessToken || !strategy || !enabled || !autoRun || !debouncedFilters) {
      requestSeqRef.current += 1;
      setResult(null);
      setFetchedFilterKey(null);
      setHasRun(false);
      setError(null);
      setInitialLoading(false);
      setIsFetching(false);
      setPage(1);
      syncedStrategyRef.current = null;
      filtersKeyRef.current = null;
      return;
    }

    const currentFiltersKey = filtersOnlyKey(strategy, debouncedFilters);
    const filtersChanged = filtersKeyRef.current !== currentFiltersKey;
    if (filtersChanged) {
      filtersKeyRef.current = currentFiltersKey;
    }

    const targetPage = filtersChanged ? 1 : page;
    if (filtersChanged && page !== 1) {
      setPage(1);
      return;
    }

    const shouldSyncProfile =
      prepareOnAutoFetch &&
      prepareRef.current != null &&
      syncedStrategyRef.current !== strategy;

    void runScreen({
      force: filtersChanged,
      syncProfile: shouldSyncProfile,
      page: targetPage,
    }).then(() => {
      if (shouldSyncProfile) {
        syncedStrategyRef.current = strategy;
      }
    });
  }, [
    accessToken,
    strategy,
    enabled,
    autoRun,
    debouncedFilters,
    page,
    pageSize,
    prepareOnAutoFetch,
    runScreen,
  ]);

  const stale = useMemo(() => {
    if (fetchedFilterKey === null || !filters) return false;
    return fetchedFilterKey !== screenerFiltersFingerprint(filters, page);
  }, [fetchedFilterKey, filters, page]);

  const setPageAndFetch = useCallback((nextPage: number) => {
    setPage(nextPage);
  }, []);

  return {
    result,
    loading: initialLoading || isFetching,
    initialLoading,
    isFetching,
    error,
    hasRun,
    stale,
    page,
    pageSize,
    setPage: setPageAndFetch,
    runScreen,
  };
}
