"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";

export type FundamentalMetric = {
  label: string;
  value: string;
  note?: string | null;
};

export type FundamentalsBlock = {
  overviewNote: string;
  metrics: FundamentalMetric[];
};

const fundamentalsCache = new Map<string, FundamentalsBlock>();

type UseFundamentalsOptions = {
  accessToken?: string | null;
};

export function useFundamentals(
  symbol: string | null,
  { accessToken }: UseFundamentalsOptions = {},
) {
  const [fundamentals, setFundamentals] = useState<FundamentalsBlock | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState<boolean>(!!symbol);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = symbol?.toUpperCase().trim();

    if (!key) {
      setFundamentals(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (!accessToken) {
      setFundamentals(null);
      setIsLoading(false);
      setError("Missing access token");
      return;
    }

    const cached = fundamentalsCache.get(key);
    if (cached) {
      setFundamentals(cached);
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
          `/research/fundamentals?symbol=${encodeURIComponent(key!)}`,
          {
            method: "GET",
            accessToken: accessToken!,
          },
        );

        if (!res.ok) {
          throw new Error("Failed to fetch fundamentals");
        }

        const data: FundamentalsBlock = await res.json();
        if (cancelled) return;

        fundamentalsCache.set(key!, data);
        setFundamentals(data);
        setError(null);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Error fetching fundamentals");
        setFundamentals(null);
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

  return { fundamentals, isLoading, error };
}
