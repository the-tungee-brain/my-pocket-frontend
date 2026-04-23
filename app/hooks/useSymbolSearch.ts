"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";

export type TickerSymbolItem = {
  symbol: string;
  created_at: string;
};

type UseSymbolSearchOptions = {
  accessToken?: string | null;
  limit?: number;
};

export function useSymbolSearch(
  keyword: string | null,
  { accessToken, limit = 20 }: UseSymbolSearchOptions = {},
) {
  const [results, setResults] = useState<TickerSymbolItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(!!keyword);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = keyword?.toUpperCase().trim();

    if (!q) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (!accessToken) {
      setResults([]);
      setIsLoading(false);
      setError("Missing access token");
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set("q", q!);
        params.set("limit", String(limit));

        const res = await apiFetch(`/symbols/search?${params.toString()}`, {
          method: "GET",
          accessToken: accessToken!,
        });

        if (!res.ok) {
          throw new Error("Failed to search symbols");
        }

        const data: TickerSymbolItem[] = await res.json();
        if (cancelled) return;

        setResults(data);
        setError(null);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Error searching symbols");
        setResults([]);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [keyword, accessToken, limit]);

  return { results, isLoading, error };
}