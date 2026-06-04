"use client";

import { useEffect, useState } from "react";
import { fetchPortfolioExitAttention } from "@/lib/apiClient";
import type { PortfolioExitAttentionItem } from "@/app/types/equityExitGuidance";
import { isAbortError } from "@/lib/isAbortError";

type Options = {
  accessToken?: string | null;
  enabled?: boolean;
  limit?: number;
};

export function usePortfolioExitAttention({
  accessToken,
  enabled = true,
  limit = 10,
}: Options = {}) {
  const [items, setItems] = useState<PortfolioExitAttentionItem[]>([]);
  const [isLoading, setIsLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setIsLoading(false);
      return;
    }
    if (!accessToken) {
      setItems([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const token = accessToken;

    async function load() {
      try {
        const data = await fetchPortfolioExitAttention({
          accessToken: token,
          limit,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        setItems(data.items);
        setError(null);
      } catch (e: unknown) {
        if (controller.signal.aborted || isAbortError(e)) return;
        setError(e instanceof Error ? e.message : "Exit attention unavailable");
        setItems([]);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    setIsLoading(true);
    void load();
    return () => controller.abort();
  }, [accessToken, enabled, limit]);

  return { items, isLoading, error };
}
