"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchSymbolIntelligence } from "@/lib/apiClient";
import type { SymbolIntelligence } from "@/app/types/intelligence";

export function seedSymbolIntelligenceCache(
  symbol: string,
  intelligence: SymbolIntelligence,
) {
  void symbol;
  void intelligence;
}

type Options = {
  accessToken?: string | null;
  enabled?: boolean;
  includeOptions?: boolean;
};

export function useSymbolIntelligence(
  symbol: string | null,
  options: Options = {},
) {
  const { accessToken, enabled = true, includeOptions = true } = options;
  const key = symbol?.toUpperCase().trim() ?? "";

  const [intelligence, setIntelligence] = useState<SymbolIntelligence | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (forceRefresh = false) => {
      if (!key || !accessToken || !enabled) return;

      void forceRefresh;

      setLoading(true);
      setError(null);

      try {
        const data = await fetchSymbolIntelligence(accessToken, key, {
          includeOptions,
        });
        setIntelligence(data);
      } catch (err) {
        const status =
          err instanceof Error && "status" in err
            ? (err as Error & { status?: number }).status
            : undefined;

        if (status === 404) {
          setError(null);
          setIntelligence({ symbol: key, signals: [], eventTimeline: [] });
          return;
        }

        setError("Could not load symbol intelligence.");
        setIntelligence(null);
      } finally {
        setLoading(false);
      }
    },
    [accessToken, enabled, includeOptions, key],
  );

  useEffect(() => {
    if (!key || !accessToken || !enabled) {
      setIntelligence(null);
      setLoading(false);
      setError(null);
      return;
    }

    void load(false);
  }, [accessToken, enabled, key, load]);

  return {
    intelligence,
    loading,
    error,
    refetch: () => load(true),
  };
}
