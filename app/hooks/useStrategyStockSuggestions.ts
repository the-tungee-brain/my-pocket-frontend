"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchStrategyStockSuggestions } from "@/lib/apiClient";
import type {
  InvestmentStrategy,
  StrategyStockSuggestions,
} from "@/app/types/strategy";

type UseStrategyStockSuggestionsOptions = {
  accessToken: string | undefined;
  strategy: InvestmentStrategy | null;
  enabled?: boolean;
  /** Sync profile to the server before fetching. Used on manual refresh. */
  prepareProfile?: () => Promise<void>;
  /** Sync profile on the initial auto-fetch (e.g. onboarding draft). */
  prepareOnAutoFetch?: boolean;
  /** Preferences fingerprint — changes mark suggestions stale without auto-refetch. */
  contextKey?: string;
};

const cache = new Map<string, StrategyStockSuggestions>();

function getCacheKey(strategy: InvestmentStrategy, contextKey: string) {
  return `${strategy}:${contextKey}`;
}

export function useStrategyStockSuggestions({
  accessToken,
  strategy,
  enabled = true,
  prepareProfile,
  prepareOnAutoFetch = false,
  contextKey = "",
}: UseStrategyStockSuggestionsOptions) {
  const [suggestions, setSuggestions] = useState<StrategyStockSuggestions | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchedKey, setFetchedKey] = useState<string | null>(null);
  const prepareRef = useRef(prepareProfile);
  prepareRef.current = prepareProfile;
  const contextKeyRef = useRef(contextKey);
  contextKeyRef.current = contextKey;

  const runFetch = useCallback(
    async (opts: { syncProfile: boolean; key: string }) => {
      if (!accessToken || !strategy) return;

      const cacheKey = getCacheKey(strategy, opts.key);
      if (!opts.syncProfile) {
        const cached = cache.get(cacheKey);
        if (cached) {
          setSuggestions(cached);
          setFetchedKey(opts.key);
          setError(null);
          return;
        }
      }

      setLoading(true);
      setError(null);

      try {
        if (opts.syncProfile && prepareRef.current) {
          await prepareRef.current();
        }
        const data = await fetchStrategyStockSuggestions(accessToken, strategy);
        cache.set(cacheKey, data);
        setSuggestions(data);
        setFetchedKey(opts.key);
      } catch (err) {
        setSuggestions(null);
        setError(
          err instanceof Error ? err.message : "Could not load AI suggestions.",
        );
      } finally {
        setLoading(false);
      }
    },
    [accessToken, strategy],
  );

  useEffect(() => {
    if (!accessToken || !strategy || !enabled) {
      setSuggestions(null);
      setFetchedKey(null);
      setError(null);
      return;
    }

    void runFetch({
      syncProfile: prepareOnAutoFetch,
      key: contextKeyRef.current,
    });
  }, [accessToken, strategy, enabled, prepareOnAutoFetch, runFetch]);

  const refetch = useCallback(async () => {
    if (!accessToken || !strategy || !enabled) return;
    await runFetch({ syncProfile: true, key: contextKeyRef.current });
  }, [accessToken, strategy, enabled, runFetch]);

  const stale =
    fetchedKey !== null && contextKey !== fetchedKey && !loading;

  return {
    suggestions,
    loading,
    error,
    refetch,
    stale,
  };
}
