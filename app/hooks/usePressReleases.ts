"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchPressReleases } from "@/lib/apiClient";
import type { PressReleaseHeadline } from "@/app/types/pressReleases";

type Options = {
  enabled?: boolean;
  lookbackDays?: number;
};

export function usePressReleases(
  symbol: string | undefined,
  accessToken: string | undefined,
  options: Options = {},
) {
  const { enabled = true, lookbackDays = 90 } = options;
  const [items, setItems] = useState<PressReleaseHeadline[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!symbol || !accessToken || !enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchPressReleases(accessToken, symbol, {
        lookbackDays,
      });
      setItems(data.items);
      setLastUpdated(Date.now());
    } catch {
      setError("Could not load official announcements.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, enabled, lookbackDays, symbol]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    items,
    isLoading,
    error,
    lastUpdated,
    refetch: load,
  };
}
