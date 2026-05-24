"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";

export type TickerSymbolItem = {
  symbol: string;
  created_at: string;
};

type UseSymbolSearchOptions = {
  accessToken?: string | null;
  limit?: number;
  debounceMs?: number;
};

export function useSymbolSearch(
  keyword: string | null,
  { accessToken, limit = 20, debounceMs = 300 }: UseSymbolSearchOptions = {},
) {
  const [debouncedKeyword, setDebouncedKeyword] = useState<string | null>(
    keyword,
  );
  const [results, setResults] = useState<TickerSymbolItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const refetch = useCallback(() => {
    setRetryCount((count) => count + 1);
  }, []);

  useEffect(() => {
    const trimmed = keyword?.trim() ?? "";

    if (!trimmed) {
      setDebouncedKeyword(null);
      return;
    }

    const timer = window.setTimeout(() => {
      setDebouncedKeyword(keyword);
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [keyword, debounceMs]);

  useEffect(() => {
    const q = debouncedKeyword?.toUpperCase().trim();

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

    void load();

    return () => {
      cancelled = true;
    };
  }, [debouncedKeyword, accessToken, limit, retryCount]);

  const isDebouncing =
    !!keyword?.trim() &&
    keyword.trim() !== (debouncedKeyword?.trim() ?? "");

  return { results, isLoading: isLoading || isDebouncing, error, refetch };
}
