"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchPortfolioBrief } from "@/lib/apiClient";
import type { PortfolioIntelligence } from "@/app/types/intelligence";

type Options = {
  enabled?: boolean;
  refresh?: boolean;
};

export function usePortfolioBrief(
  accessToken: string | undefined,
  options: Options = {},
) {
  const { enabled = true, refresh = false } = options;
  const [brief, setBrief] = useState<PortfolioIntelligence | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const load = useCallback(
    async (forceRefresh = false) => {
      if (!accessToken || !enabled) return;

      setLoading(true);
      setError(null);

      try {
        const data = await fetchPortfolioBrief(accessToken, {
          refresh: forceRefresh || refresh,
        });
        setBrief(data);
        setLastUpdated(Date.now());
      } catch {
        setError("Could not load portfolio brief.");
      } finally {
        setLoading(false);
      }
    },
    [accessToken, enabled, refresh],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  return {
    brief,
    loading,
    error,
    lastUpdated,
    refetch: () => load(true),
  };
}
