"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchPortfolioBrief } from "@/lib/apiClient";
import type { PortfolioIntelligence } from "@/app/types/intelligence";

type Options = {
  enabled?: boolean;
  initialBrief?: PortfolioIntelligence | null;
};

export function usePortfolioBrief(
  accessToken: string | undefined,
  options: Options = {},
) {
  const { enabled = true, initialBrief = null } = options;
  const [brief, setBrief] = useState<PortfolioIntelligence | null>(initialBrief);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(
    initialBrief ? Date.now() : null,
  );

  useEffect(() => {
    setBrief(initialBrief);
    if (initialBrief) {
      setLastUpdated(Date.now());
      setError(null);
    }
  }, [initialBrief]);

  const load = useCallback(
    async (forceRefresh = false) => {
      if (!accessToken || !enabled) return;

      if (!forceRefresh && initialBrief) {
        setBrief(initialBrief);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const data = await fetchPortfolioBrief(accessToken, {
          refresh: forceRefresh,
        });
        setBrief(data);
        setLastUpdated(Date.now());
      } catch (err) {
        const status =
          err instanceof Error && "status" in err
            ? (err as Error & { status?: number }).status
            : undefined;

        if (status === 404 && initialBrief) {
          setBrief(initialBrief);
          setError(null);
          return;
        }

        if (initialBrief) {
          setBrief(initialBrief);
          setError(null);
          return;
        }

        setError("Portfolio brief is not available yet.");
      } finally {
        setLoading(false);
      }
    },
    [accessToken, enabled, initialBrief],
  );

  return {
    brief,
    loading,
    error,
    lastUpdated,
    refetch: () => load(true),
  };
}
