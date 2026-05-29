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
  isRefreshing: boolean;
  error: string | null;
  lastUpdated: number | null;
  refetch: () => void;
  refresh: () => void;
};

const newsCache = new Map<string, CachedNews>();
const SESSION_CACHE_TTL_MS = 60 * 60 * 1000;
/** In-memory hits younger than this skip a background refetch (server Redis may still be warm). */
const CLIENT_FRESH_MS = 15 * 60 * 1000;
const SESSION_STORAGE_PREFIX = "company-news:v1:";

type Listener = (data?: StockNewsView, error?: string) => void;

type InFlightNewsEntry = {
  listeners: Set<Listener>;
};

const inFlightNews = new Map<string, InFlightNewsEntry>();

function cacheNews(key: string, data: StockNewsView): number {
  const fetchedAt = Date.now();
  newsCache.set(key, { data, fetchedAt });
  persistSessionCache(key, data, fetchedAt);
  return fetchedAt;
}

function persistSessionCache(
  key: string,
  data: StockNewsView,
  fetchedAt: number,
): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      `${SESSION_STORAGE_PREFIX}${key}`,
      JSON.stringify({ data, fetchedAt } satisfies CachedNews),
    );
  } catch {
    // ignore quota / private mode
  }
}

function readSessionCache(key: string): CachedNews | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${SESSION_STORAGE_PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedNews;
    if (Date.now() - parsed.fetchedAt > SESSION_CACHE_TTL_MS) {
      sessionStorage.removeItem(`${SESSION_STORAGE_PREFIX}${key}`);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function buildCompanyNewsUrl(symbol: string, refresh = false): string {
  const params = new URLSearchParams({ symbol });
  if (refresh) {
    params.set("refresh", "true");
  }
  return `/get-company-news?${params.toString()}`;
}

async function fetchCompanyNews(
  symbol: string,
  accessToken: string,
  refresh = false,
): Promise<StockNewsView> {
  const res = await apiFetch(buildCompanyNewsUrl(symbol, refresh), {
    method: "GET",
    accessToken,
  });

  if (!res.ok) throw new Error("Failed to fetch news analytics");

  return res.json();
}

export function useCompanyNews(
  symbol: string | undefined,
  accessToken?: string,
  enabled = true,
): UseCompanyNewsResult {
  const [analytics, setAnalytics] = useState<StockNewsView | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const key = symbol?.toUpperCase();

  useEffect(() => {
    if (!key || !accessToken || !enabled) return;

    const memoryCached = newsCache.get(key);
    const cached = memoryCached ?? readSessionCache(key);
    const hasCached = cached != null;
    const cacheIsFresh =
      hasCached && Date.now() - cached.fetchedAt < CLIENT_FRESH_MS;

    if (cached) {
      if (!memoryCached) {
        newsCache.set(key, cached);
      }
      setAnalytics(cached.data);
      setLastUpdated(cached.fetchedAt);
      setError(null);
      setIsLoading(false);
    }

    // Fresh session or memory cache: no background refetch on tab mount.
    if (cacheIsFresh) {
      return;
    }

    let cancelled = false;
    const showInitialLoading = !hasCached;

    let entry = inFlightNews.get(key);
    if (entry) {
      if (showInitialLoading) {
        setIsLoading(true);
      }

      const listener: Listener = (data, err) => {
        if (cancelled) return;
        if (err) {
          setError(err);
          setIsLoading(false);
          setIsRefreshing(false);
        } else if (data) {
          setAnalytics(data);
          setLastUpdated(newsCache.get(key)?.fetchedAt ?? null);
          setError(null);
          setIsLoading(false);
          setIsRefreshing(false);
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

    if (showInitialLoading) {
      setIsLoading(true);
      setError(null);
    }

    const listener: Listener = (data, err) => {
      if (cancelled) return;
      if (err) {
        setError(err);
        setIsLoading(false);
        setIsRefreshing(false);
      } else if (data) {
        setAnalytics(data);
        setLastUpdated(newsCache.get(key)?.fetchedAt ?? null);
        setError(null);
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };

    entry.listeners.add(listener);

    // Stale cache: revalidate silently (no "Updating…" unless user taps refresh).
    (async () => {
      try {
        const data = await fetchCompanyNews(key, accessToken, false);
        cacheNews(key, data);

        for (const l of entry!.listeners) {
          l(data);
        }
      } catch (e: unknown) {
        const msg =
          e instanceof Error ? e.message : "Error fetching news analytics";
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
  }, [key, accessToken, enabled]);

  const refresh = () => {
    if (!key || !accessToken || isLoading || isRefreshing) return;

    newsCache.delete(key);
    inFlightNews.delete(key);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(`${SESSION_STORAGE_PREFIX}${key}`);
      } catch {
        // ignore
      }
    }

    void (async () => {
      setIsRefreshing(true);
      setError(null);

      try {
        const data = await fetchCompanyNews(key, accessToken, true);
        const fetchedAt = cacheNews(key, data);
        setAnalytics(data);
        setLastUpdated(fetchedAt);
        setIsLoading(false);
      } catch (e: unknown) {
        setError(
          e instanceof Error ? e.message : "Error fetching news analytics",
        );
      } finally {
        setIsRefreshing(false);
      }
    })();
  };

  return { analytics, isLoading, isRefreshing, error, lastUpdated, refetch: refresh, refresh };
}
