"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import { TabId } from "../contexts/TabContext";

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
  dominant_driver?: string | null;
  market_impact_horizon?: string | null;
  actionability_score?: number | null;
  investorTakeaway?: string | null;
  deepAnalysis?: string | null;
  items: EnrichedNewsItem[];
};

type CachedNews = {
  data: StockNewsView;
  fetchedAt: number;
};

type UseCompanyNewsResult = {
  analytics: StockNewsView | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
  refetch: () => void;
};

const newsCache = new Map<string, CachedNews>();

type Listener = (data?: StockNewsView, error?: string) => void;

type InFlightNewsEntry = {
  listeners: Set<Listener>;
};

const inFlightNews = new Map<string, InFlightNewsEntry>();

function cacheNews(key: string, data: StockNewsView): number {
  const fetchedAt = Date.now();
  newsCache.set(key, { data, fetchedAt });
  return fetchedAt;
}

export function useCompanyNews(
  symbol: string | undefined,
  accessToken?: string,
  activeTab?: TabId,
): UseCompanyNewsResult {
  const [analytics, setAnalytics] = useState<StockNewsView | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const key = symbol?.toUpperCase();

  useEffect(() => {
    if (!key || !accessToken || activeTab !== "news") return;

    const cached = newsCache.get(key);
    if (cached) {
      setAnalytics(cached.data);
      setLastUpdated(cached.fetchedAt);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    let entry = inFlightNews.get(key);
    if (entry) {
      setIsLoading(true);

      const listener: Listener = (data, err) => {
        if (cancelled) return;
        if (err) {
          setError(err);
          setIsLoading(false);
        } else if (data) {
          setAnalytics(data);
          setLastUpdated(newsCache.get(key)?.fetchedAt ?? null);
          setError(null);
          setIsLoading(false);
        }
      };

      entry.listeners.add(listener);

      return () => {
        cancelled = true;
        entry!.listeners.delete(listener);
      };
    }

    entry = { listeners: new Set<Listener>() };
    inFlightNews.set(key, entry);

    setIsLoading(true);
    setError(null);

    const listener: Listener = (data, err) => {
      if (cancelled) return;
      if (err) {
        setError(err);
        setIsLoading(false);
      } else if (data) {
        setAnalytics(data);
        setLastUpdated(newsCache.get(key)?.fetchedAt ?? null);
        setError(null);
        setIsLoading(false);
      }
    };

    entry.listeners.add(listener);

    (async () => {
      try {
        const res = await apiFetch(
          `/get-company-news?symbol=${encodeURIComponent(key)}`,
          {
            method: "GET",
            accessToken,
          },
        );

        if (!res.ok) throw new Error("Failed to fetch news analytics");

        const data: StockNewsView = await res.json();
        cacheNews(key, data);

        for (const l of entry!.listeners) {
          l(data);
        }
      } catch (e: any) {
        const msg = e?.message ?? "Error fetching news analytics";
        for (const l of entry!.listeners) {
          l(undefined, msg);
        }
      } finally {
        inFlightNews.delete(key);
      }
    })();

    return () => {
      cancelled = true;
      entry!.listeners.delete(listener);
    };
  }, [key, accessToken, activeTab]);

  const refetch = () => {
    if (!key || !accessToken) return;

    newsCache.delete(key);
    inFlightNews.delete(key);

    (async () => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await apiFetch(
          `/get-company-news?symbol=${encodeURIComponent(key)}`,
          {
            method: "GET",
            accessToken,
          },
        );

        if (!res.ok) throw new Error("Failed to fetch news analytics");

        const data: StockNewsView = await res.json();
        const fetchedAt = cacheNews(key, data);
        setAnalytics(data);
        setLastUpdated(fetchedAt);
      } catch (e: any) {
        setError(e?.message ?? "Error fetching news analytics");
      } finally {
        setIsLoading(false);
      }
    })();
  };

  return { analytics, isLoading, error, lastUpdated, refetch };
}
