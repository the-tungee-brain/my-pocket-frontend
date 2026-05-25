"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchMorningBrief } from "@/lib/apiClient";
import type { MorningBrief, PortfolioIntelligence } from "@/app/types/intelligence";

type Options = {
  enabled?: boolean;
  initialBrief?: PortfolioIntelligence | null;
};

export function useMorningBrief(
  accessToken: string | undefined,
  options: Options = {},
) {
  const { enabled = true, initialBrief = null } = options;
  const [morningBrief, setMorningBrief] = useState<MorningBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const initialBriefRef = useRef(initialBrief);
  initialBriefRef.current = initialBrief;

  const portfolioBrief = useMemo<PortfolioIntelligence | null>(() => {
    if (morningBrief) {
      return {
        signals: morningBrief.signals ?? [],
        digest: morningBrief.digest ?? null,
        alerts: morningBrief.topAlerts ?? [],
      };
    }
    return initialBrief;
  }, [initialBrief, morningBrief]);

  const load = useCallback(
    async (forceRefresh = false) => {
      if (!accessToken || !enabled) return;

      setLoading(true);
      setError(null);

      try {
        const data = await fetchMorningBrief(accessToken, {
          refresh: forceRefresh,
        });
        setMorningBrief(data);
        setLastUpdated(Date.now());
      } catch (err) {
        const status =
          err instanceof Error && "status" in err
            ? (err as Error & { status?: number }).status
            : undefined;

        if ((status === 404 || status === 401) && initialBriefRef.current) {
          setMorningBrief(null);
          setError(null);
          return;
        }

        setError("Morning brief is not available yet.");
      } finally {
        setLoading(false);
      }
    },
    [accessToken, enabled],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  return {
    morningBrief,
    portfolioBrief,
    loading,
    error,
    lastUpdated,
    refetch: () => load(true),
  };
}
