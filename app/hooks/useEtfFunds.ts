"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import { useOverviewBundleGate } from "@/app/research/ResearchOverviewContext";
import type { EtfFundsSnapshot } from "@/app/hooks/etfFundsTypes";

type EtfFundsResponse = {
  etfFunds: EtfFundsSnapshot | null;
};

const etfFundsCache = new Map<string, EtfFundsSnapshot | null>();

export function seedEtfFundsCache(symbol: string, funds: EtfFundsSnapshot | null) {
  const key = symbol.toUpperCase().trim();
  if (key) etfFundsCache.set(key, funds);
}

type UseEtfFundsOptions = {
  accessToken?: string | null;
  enabled?: boolean;
};

export function useEtfFunds(
  symbol: string | null,
  { accessToken, enabled = true }: UseEtfFundsOptions = {},
) {
  const { bundle: overviewBundle, waitForBundle } = useOverviewBundleGate(symbol);
  const [funds, setFunds] = useState<EtfFundsSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const key = symbol?.toUpperCase().trim();

  useEffect(() => {
    if (!key || !accessToken || !enabled) {
      setFunds(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (waitForBundle) {
      setIsLoading(true);
      setError(null);
      return;
    }

    if (overviewBundle?.etfFunds !== undefined) {
      etfFundsCache.set(key, overviewBundle.etfFunds);
      setFunds(overviewBundle.etfFunds);
      setIsLoading(false);
      setError(null);
      return;
    }

    const cached = etfFundsCache.get(key);
    if (cached !== undefined) {
      setFunds(cached);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await apiFetch(
          `/research/etf-funds?symbol=${encodeURIComponent(key!)}`,
          { method: "GET", accessToken: accessToken! },
        );
        if (!res.ok) throw new Error("Failed to fetch ETF fund profile");

        const data: EtfFundsResponse = await res.json();
        if (cancelled) return;

        const snapshot = data.etfFunds ?? null;
        etfFundsCache.set(key!, snapshot);
        setFunds(snapshot);
      } catch (e: unknown) {
        if (cancelled) return;
        const msg =
          e instanceof Error ? e.message : "Error fetching ETF fund profile";
        setError(msg);
        setFunds(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [key, accessToken, enabled, overviewBundle, waitForBundle]);

  return { funds, isLoading, error };
}
