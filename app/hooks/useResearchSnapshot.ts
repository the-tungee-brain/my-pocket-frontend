"use client";

import { apiFetch } from "@/lib/apiClient";
import { useEffect, useState } from "react";

export type ResearchSnapshot = {
  symbol: string;
  name: string;
  sector: string;
  country: string;
  price: number;
  changePct: number;
  marketCap: string;
  range52w: string;
  logo?: string;
  weburl?: string;
};

const snapshotCache = new Map<string, ResearchSnapshot>();

type UseResearchSnapshotOptions = {
  accessToken?: string | null;
};

export function useResearchSnapshot(
  symbol: string | null,
  { accessToken }: UseResearchSnapshotOptions = {}
) {
  const [snapshot, setSnapshot] = useState<ResearchSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!symbol);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = symbol?.toUpperCase().trim();
    if (!key || !accessToken) {
      setSnapshot(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const cached = snapshotCache.get(key);
    if (cached) {
      setSnapshot(cached);
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
          `/research/snapshot?symbol=${encodeURIComponent(key!)}`,
          {
            method: "GET",
            accessToken: accessToken!,
          }
        );

        if (!res.ok) {
          throw new Error("Failed to fetch research snapshot");
        }

        const data: ResearchSnapshot = await res.json();

        if (cancelled) return;

        snapshotCache.set(key!, data);
        setSnapshot(data);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Error fetching research snapshot");
        setSnapshot(null);
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

  return { snapshot, isLoading, error };
}