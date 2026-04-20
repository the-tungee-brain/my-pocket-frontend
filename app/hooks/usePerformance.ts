"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";

export type PerformanceSnapshot = {
  oneMonth: string;
  threeMonth: string;
  oneYear: string;
  trendLabel: string;
  volatilityNote: string;
};

const performanceCache = new Map<string, PerformanceSnapshot>();

type UsePerformanceSnapshotOptions = {
  accessToken?: string | null;
};

export function usePerformanceSnapshot(
  symbol: string | null,
  { accessToken }: UsePerformanceSnapshotOptions = {},
) {
  const [performance, setPerformance] = useState<PerformanceSnapshot | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState<boolean>(!!symbol);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = symbol?.toUpperCase().trim();

    if (!key) {
      setPerformance(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (!accessToken) {
      setPerformance(null);
      setIsLoading(false);
      setError("Missing access token");
      return;
    }

    const cached = performanceCache.get(key);
    if (cached) {
      setPerformance(cached);
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
          `/research/performance?symbol=${encodeURIComponent(key!)}`,
          {
            method: "GET",
            accessToken: accessToken!,
          },
        );

        if (!res.ok) {
          throw new Error("Failed to fetch performance snapshot");
        }

        const data: PerformanceSnapshot = await res.json();
        if (cancelled) return;

        performanceCache.set(key!, data);
        setPerformance(data);
        setError(null);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Error fetching performance snapshot");
        setPerformance(null);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [symbol, accessToken]);

  return { performance, isLoading, error };
}