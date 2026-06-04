"use client";

import { useEffect, useState } from "react";
import { fetchPositionGuidance } from "@/lib/apiClient";
import type { SymbolPositionGuidance } from "@/app/types/positionGuidance";
import { isAbortError } from "@/lib/isAbortError";

type Options = {
  accessToken?: string | null;
  enabled?: boolean;
};

export function usePositionGuidance(
  symbol: string | null,
  { accessToken, enabled = true }: Options = {},
) {
  const [guidance, setGuidance] = useState<SymbolPositionGuidance | null>(null);
  const [isLoading, setIsLoading] = useState(!!symbol);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const symbolKey = symbol?.toUpperCase().trim();
    if (!symbolKey || !enabled) {
      setGuidance(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    if (!accessToken) {
      setGuidance(null);
      setIsLoading(false);
      setError("Missing access token");
      return;
    }

    const resolvedSymbol: string = symbolKey;
    const controller = new AbortController();
    const token = accessToken;

    async function load() {
      try {
        const data = await fetchPositionGuidance(resolvedSymbol, {
          accessToken: token,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setGuidance(data);
        setError(null);
      } catch (e: unknown) {
        if (controller.signal.aborted || isAbortError(e)) return;
        setError(e instanceof Error ? e.message : "Position guidance unavailable");
        setGuidance(null);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    setIsLoading(true);
    setError(null);
    void load();
    return () => controller.abort();
  }, [symbol, accessToken, enabled]);

  return { guidance, isLoading, error };
}
