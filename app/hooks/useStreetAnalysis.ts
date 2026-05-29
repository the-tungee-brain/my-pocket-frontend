"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import { useResearchOverviewBundle } from "@/app/research/ResearchOverviewContext";
import type { StreetAnalysisSnapshot } from "@/app/hooks/streetAnalysisTypes";

type StreetAnalysisResponse = {
  streetAnalysis: StreetAnalysisSnapshot | null;
};

const streetCache = new Map<string, StreetAnalysisSnapshot | null>();

type UseStreetAnalysisOptions = {
  accessToken?: string | null;
  enabled?: boolean;
};

export function useStreetAnalysis(
  symbol: string | null,
  { accessToken, enabled = true }: UseStreetAnalysisOptions = {},
) {
  const overviewBundle = useResearchOverviewBundle();
  const [street, setStreet] = useState<StreetAnalysisSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const key = symbol?.toUpperCase().trim();

  useEffect(() => {
    if (!key || !accessToken || !enabled) {
      setStreet(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (overviewBundle?.symbol === key && overviewBundle.streetAnalysis !== undefined) {
      streetCache.set(key, overviewBundle.streetAnalysis);
      setStreet(overviewBundle.streetAnalysis);
      setIsLoading(false);
      setError(null);
      return;
    }

    const cached = streetCache.get(key);
    if (cached !== undefined) {
      setStreet(cached);
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
          `/research/street-analysis?symbol=${encodeURIComponent(key!)}`,
          { method: "GET", accessToken: accessToken! },
        );
        if (!res.ok) throw new Error("Failed to fetch street consensus");

        const data: StreetAnalysisResponse = await res.json();
        if (cancelled) return;

        const snapshot = data.streetAnalysis ?? null;
        streetCache.set(key!, snapshot);
        setStreet(snapshot);
      } catch (e: unknown) {
        if (cancelled) return;
        const msg =
          e instanceof Error ? e.message : "Error fetching street consensus";
        setError(msg);
        setStreet(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [key, accessToken, enabled, overviewBundle]);

  return { street, isLoading, error };
}
