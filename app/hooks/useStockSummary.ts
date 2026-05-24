"use client";

import { useEffect, useState } from "react";
import { apiFetch, streamGet } from "@/lib/apiClient";
import { isAbortError } from "@/lib/isAbortError";

export type Sentiment = "Bullish" | "Neutral" | "Bearish";

export type StockSummary = {
  short: string;
  long: string;
  sentiment: Sentiment;
  investmentThesis: string;
  keyStrengths: string[];
  keyRisks: string[];
  whatToWatch: string[];
  valuationContext: string;
};

const stockSummaryCache = new Map<string, StockSummary>();

type UseStockSummaryOptions = {
  accessToken?: string | null;
};

export function useStockSummary(
  symbol: string | null,
  { accessToken }: UseStockSummaryOptions = {},
) {
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [streamMarkdown, setStreamMarkdown] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(!!symbol);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = symbol?.toUpperCase().trim();

    if (!key) {
      setSummary(null);
      setStreamMarkdown("");
      setIsStreaming(false);
      setIsLoading(false);
      setError(null);
      return;
    }

    const symbolKey = key;

    if (!accessToken) {
      setSummary(null);
      setStreamMarkdown("");
      setIsStreaming(false);
      setIsLoading(false);
      setError("Missing access token");
      return;
    }

    const cached = stockSummaryCache.get(symbolKey);
    if (cached) {
      setSummary(cached);
      setStreamMarkdown("");
      setIsStreaming(false);
      setIsLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;
    const token = accessToken;

    async function loadJson() {
      try {
        const res = await apiFetch(
          `/research/summary?symbol=${encodeURIComponent(symbolKey)}`,
          {
            method: "GET",
            accessToken: token,
            signal,
          },
        );

        if (!res.ok) {
          throw new Error("Failed to fetch stock summary");
        }

        const data: StockSummary = await res.json();
        if (signal.aborted) return;

        stockSummaryCache.set(symbolKey, data);
        setSummary(data);
        setStreamMarkdown("");
        setError(null);
      } catch (e: unknown) {
        if (signal.aborted || isAbortError(e)) return;
        const message =
          e instanceof Error ? e.message : "Error fetching stock summary";
        setError((prev) => prev ?? message);
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
          setIsStreaming(false);
        }
      }
    }

    async function loadStream() {
      setIsStreaming(true);
      let buffer = "";

      try {
        await streamGet(
          `/research/summary?symbol=${encodeURIComponent(symbolKey)}&stream=true`,
          token,
          (chunk) => {
            if (signal.aborted) return;
            buffer += chunk;
            setStreamMarkdown(buffer);
          },
          { signal },
        );
        if (signal.aborted) return;
        setError(null);
      } catch (e: unknown) {
        if (signal.aborted || isAbortError(e)) return;
        const message =
          e instanceof Error ? e.message : "Error streaming stock summary";
        setError((prev) => prev ?? message);
      } finally {
        if (!signal.aborted) {
          setIsStreaming(false);
          setIsLoading((loading) => loading && !stockSummaryCache.has(symbolKey));
        }
      }
    }

    setSummary(null);
    setStreamMarkdown("");
    setIsLoading(true);
    setError(null);

    void loadStream();
    void loadJson();

    return () => {
      controller.abort();
    };
  }, [symbol, accessToken]);

  return { summary, streamMarkdown, isStreaming, isLoading, error };
}
