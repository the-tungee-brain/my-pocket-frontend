"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchStrategyStockSuggestions } from "@/lib/apiClient";
import type {
  InvestmentStrategy,
  StrategyStockSuggestions,
} from "@/app/types/strategy";

type UseStrategyStockSuggestionsOptions = {
  accessToken: string | undefined;
  strategy: InvestmentStrategy | null;
  enabled?: boolean;
  prepareProfile?: () => Promise<void>;
};

export function useStrategyStockSuggestions({
  accessToken,
  strategy,
  enabled = true,
  prepareProfile,
}: UseStrategyStockSuggestionsOptions) {
  const [suggestions, setSuggestions] = useState<StrategyStockSuggestions | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prepareRef = useRef(prepareProfile);
  prepareRef.current = prepareProfile;

  const load = useCallback(async () => {
    if (!accessToken || !strategy || !enabled) {
      setSuggestions(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (prepareRef.current) {
        await prepareRef.current();
      }
      const data = await fetchStrategyStockSuggestions(accessToken, strategy);
      setSuggestions(data);
    } catch (err) {
      setSuggestions(null);
      setError(
        err instanceof Error ? err.message : "Could not load AI suggestions.",
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, strategy, enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    suggestions,
    loading,
    error,
    refetch: load,
  };
}
