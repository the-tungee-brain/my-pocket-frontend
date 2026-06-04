"use client";

import { useEffect, useState } from "react";
import { fetchEquityExitGuidance } from "@/lib/apiClient";
import type { EquityExitGuidance } from "@/app/types/equityExitGuidance";
import { isAbortError } from "@/lib/isAbortError";

type Options = {
  accessToken?: string | null;
  enabled?: boolean;
};

export function useEquityExitGuidance(
  symbol: string | null,
  { accessToken, enabled = true }: Options = {},
) {
  const [guidance, setGuidance] = useState<EquityExitGuidance | null>(null);
  const [isLoading, setIsLoading] = useState(!!symbol);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = symbol?.toUpperCase().trim();
    if (!key || !enabled) {
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

    const controller = new AbortController();
    const token = accessToken;

    async function load() {
      try {
        const data = await fetchEquityExitGuidance(key, {
          accessToken: token,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setGuidance(data);
        setError(null);
      } catch (e: unknown) {
        if (controller.signal.aborted || isAbortError(e)) return;
        setError(e instanceof Error ? e.message : "Exit guidance unavailable");
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
