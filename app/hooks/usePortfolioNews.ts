"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchPortfolioNews } from "@/lib/apiClient";
import type { PortfolioHoldingsNewsItem } from "@/app/types/portfolioNews";

type Options = {
  enabled?: boolean;
};

export function usePortfolioNews(
  accessToken: string | undefined,
  options: Options = {},
) {
  const { enabled = true } = options;
  const [items, setItems] = useState<PortfolioHoldingsNewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const load = useCallback(
    async (forceRefresh = false) => {
      if (!accessToken || !enabled) return;

      setLoading(true);
      setError(null);

      try {
        const data = await fetchPortfolioNews(accessToken);
        setItems(data.items);
        setLastUpdated(Date.now());
      } catch (err) {
        const status =
          err instanceof Error && "status" in err
            ? (err as Error & { status?: number }).status
            : undefined;

        if (status === 404) {
          setError("Portfolio news is not available yet.");
        } else {
          setError("Could not load portfolio news.");
        }
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
    items,
    loading,
    error,
    lastUpdated,
    refetch: () => load(true),
  };
}
