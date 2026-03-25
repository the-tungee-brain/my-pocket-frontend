"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";

export type Sentiment = "bullish" | "bearish" | "neutral";
export type OverallSentiment =
  | "strongly_bullish"
  | "bullish"
  | "neutral"
  | "bearish"
  | "strongly_bearish";

export type EnrichedNewsItem = {
  id: number;
  datetime: string;
  headline: string;
  source: string;
  original_summary: string;
  sentiment: Sentiment;
  confidence: number;
  summary: string;
  topics: string[];
  url?: string | null;
  image?: string | null;
};

export type StockNewsView = {
  symbol: string;
  overall_sentiment: OverallSentiment;
  summary: string;
  insights: string[];
  risks: string[];
  items: EnrichedNewsItem[];
};

type UseCompanyNewsResult = {
  analytics: StockNewsView | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

const newsCache = new Map<string, StockNewsView>();

export function useCompanyNews(
  symbol: string | undefined,
  accessToken?: string,
): UseCompanyNewsResult {
  const [analytics, setAnalytics] = useState<StockNewsView | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async () => {
    if (!accessToken || !symbol) return;

    setIsLoading(true);

    const key = symbol.toUpperCase();

    const cached = newsCache.get(key);
    if (cached) {
      setAnalytics(cached);
      setError(null);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);

      const res = await apiFetch(
        `/get-company-news?symbol=${encodeURIComponent(key)}`,
        {
        method: "GET",
        accessToken,
        },
      );

      if (!res.ok) throw new Error("Failed to fetch news analytics");

      const data: StockNewsView = await res.json();
      newsCache.set(key, data);
      setAnalytics(data);
    } catch (e: any) {
      setError(e?.message ?? "Error fetching news analytics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!symbol || !accessToken) return;
    void fetchNews();
  }, [symbol, accessToken]);

  const refetch = () => {
    if (!symbol) return;
    const key = symbol.toUpperCase();
    newsCache.delete(key);
    void fetchNews();
  };

  return { analytics, isLoading, error, refetch };
}
