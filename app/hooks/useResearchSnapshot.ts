"use client";

import { useEffect, useState } from "react";
import type { ResearchSnapshot } from "@/lib/researchSnapshot";
import { fetchResearchSnapshot } from "@/lib/researchSnapshot";

type UseResearchSnapshotOptions = {
  accessToken?: string | null;
};

export function useResearchSnapshot(
  symbol: string | null,
  { accessToken }: UseResearchSnapshotOptions = {},
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

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchResearchSnapshot(key!, accessToken!);
        if (cancelled) return;

        if (!data) {
          throw new Error("Failed to fetch research snapshot");
        }

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

    void load();

    return () => {
      cancelled = true;
    };
  }, [symbol, accessToken]);

  return { snapshot, isLoading, error };
}

export type { ResearchSnapshot };
