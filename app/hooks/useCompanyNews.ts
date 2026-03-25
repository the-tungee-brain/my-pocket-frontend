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
  items: EnrichedNewsItem[];
};

type UseCompanyNewsResult = {
  analytics: StockNewsView | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

const newsCache = new Map<string, StockNewsView>();

type Listener = (data?: StockNewsView, error?: string) => void;

type InFlightNewsEntry = {
  listeners: Set<Listener>;
};

const inFlightNews = new Map<string, InFlightNewsEntry>();

export function useCompanyNews(
  symbol: string | undefined,
  accessToken?: string,
  activeTab?: TabId,
): UseCompanyNewsResult {
  const [analytics, setAnalytics] = useState<StockNewsView | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const key = symbol?.toUpperCase();

  useEffect(() => {
    if (!key || !accessToken || activeTab !== "news") return;

    const cached = newsCache.get(key);
    if (cached) {
      setAnalytics(cached);
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
          return;
        }
        if (data) {
          setAnalytics(data);
          setError(null);
          setIsLoading(false);
        }
      };
      entry.listeners.add(listener);

      return () => {
        cancelled = true;
        entry?.listeners.delete(listener);
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
        return;
      }
      if (data) {
        setAnalytics(data);
        setError(null);
        setIsLoading(false);
      }
    };

    entry.listeners.add(listener);

    (async () => {
      try {
        const res = await apiFetch(
          `/get-company-news?symbol=${encodeURIComponent(key!)}`,
          {
            method: "GET",
            accessToken,
          },
        );

        if (!res.ok) throw new Error("Failed to fetch news analytics");

        const data: StockNewsView = await res.json();
        newsCache.set(key!, data);

        for (const l of entry!.listeners) {
          l(data);
        }
      } catch (e: any) {
        const msg = e?.message ?? "Error fetching news analytics";
        for (const l of entry!.listeners) {
          l(undefined, msg);
        }
      } finally {
        inFlightNews.delete(key!);
      }
    })();

    return () => {
      cancelled = true;
      entry.listeners.delete(listener);
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
        newsCache.set(key, data);
        setAnalytics(data);
      } catch (e: any) {
        setError(e?.message ?? "Error fetching news analytics");
      } finally {
        setIsLoading(false);
      }
    })();
  };

  return { analytics, isLoading, error, refetch };
}
