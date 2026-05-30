"use client";

import { useEffect, useState } from "react";
import type { ResearchSnapshot } from "@/lib/researchSnapshot";
import { useOverviewBundleGate } from "@/app/research/ResearchOverviewContext";
import {
  fetchResearchSnapshot,
  snapshotMissingKeyStats,
} from "@/lib/researchSnapshot";

type UseResearchSnapshotOptions = {
  accessToken?: string | null;
};

export function useResearchSnapshot(
  symbol: string | null,
  { accessToken }: UseResearchSnapshotOptions = {},
) {
  const { bundle: overviewBundle, waitForBundle } = useOverviewBundleGate(symbol);
  const [snapshot, setSnapshot] = useState<ResearchSnapshot | null>(() => {
    const key = symbol?.toUpperCase().trim();
    if (key && overviewBundle?.snapshot) {
      if (!snapshotMissingKeyStats(overviewBundle.snapshot)) {
        return overviewBundle.snapshot;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const key = symbol?.toUpperCase().trim();
    if (key && overviewBundle?.symbol === key && overviewBundle.snapshot) {
      return false;
    }
    return !!symbol;
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = symbol?.toUpperCase().trim();
    if (waitForBundle) {
      setIsLoading(true);
      setError(null);
      return;
    }
    if (key && overviewBundle?.snapshot) {
      if (!snapshotMissingKeyStats(overviewBundle.snapshot)) {
        setSnapshot(overviewBundle.snapshot);
        setIsLoading(false);
        setError(null);
        return;
      }
    }
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
  }, [symbol, accessToken, overviewBundle, waitForBundle]);

  return { snapshot, isLoading, error };
}

export type { ResearchSnapshot };
