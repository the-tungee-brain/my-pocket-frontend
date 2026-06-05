"use client";

import { useCallback, useEffect, useState } from "react";
import type { EtfHoldingsContext } from "@/app/types/research";
import { useOverviewBundleGate } from "@/app/research/ResearchOverviewContext";
import { fetchEtfHoldings, getCachedEtfHoldings } from "@/lib/etfHoldings";

type UseEtfHoldingsOptions = {
  accessToken?: string | null;
  limit?: number;
  enabled?: boolean;
};

export function useEtfHoldings(
  symbol: string | null,
  {
    accessToken,
    limit = 25,
    enabled = true,
  }: UseEtfHoldingsOptions = {},
) {
  const { bundle: overviewBundle, waitForBundle } = useOverviewBundleGate(symbol);
  const [holdings, setHoldings] = useState<EtfHoldingsContext | null>(() => {
    if (!symbol || !enabled) return null;
    return getCachedEtfHoldings(symbol, limit);
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (!symbol || !enabled) return false;
    return getCachedEtfHoldings(symbol, limit) === null;
  });
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const refetch = useCallback(() => {
    setRetryCount((count) => count + 1);
  }, []);

  useEffect(() => {
    const key = symbol?.trim().toUpperCase();
    if (!key || !enabled) {
      setHoldings(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (!accessToken) {
      setHoldings(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (waitForBundle) {
      setIsLoading(true);
      setError(null);
      return;
    }

    const requestKey = key;
    const requestToken = accessToken;

    if (overviewBundle?.etfHoldings) {
      setHoldings(overviewBundle.etfHoldings);
      setIsLoading(false);
      setError(null);
      return;
    }

    const cached = getCachedEtfHoldings(key, limit);
    if (cached && retryCount === 0) {
      setHoldings(cached);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchEtfHoldings(requestKey, requestToken, limit);
        if (cancelled) return;

        setHoldings(data);
        setError(
          data
            ? null
            : "ETF holdings are unavailable for this symbol right now.",
        );
      } catch {
        if (cancelled) return;
        setHoldings(null);
        setError("ETF holdings are unavailable for this symbol right now.");
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
  }, [symbol, accessToken, limit, enabled, retryCount, overviewBundle, waitForBundle]);

  return { holdings, isLoading, error, refetch };
}
