"use client";

import { useCallback, useEffect, useState } from "react";
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
  direct_relevance?:
    | "direct_company_news"
    | "important_industry_read_through"
    | "weak_mention"
    | "irrelevant";
  thesis_impact?: "high" | "medium" | "low";
  thesis_horizon?: "near_term" | "medium_term" | "long_term";
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
  /** False until the user runs Analyze news (or a cached analysis is returned). */
  aiEnrichment?: boolean;
};

type CachedNews = {
  data: StockNewsView;
  fetchedAt: number;
  analyzedAt: number | null;
};

type UseCompanyNewsResult = {
  analytics: StockNewsView | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isAnalyzing: boolean;
  error: string | null;
  lastUpdated: number | null;
  lastAnalyzedAt: number | null;
  refetch: () => void;
  refresh: () => void;
  analyzeNews: (options?: { refresh?: boolean }) => void;
};

const newsCache = new Map<string, CachedNews>();
const SESSION_CACHE_TTL_MS = 60 * 60 * 1000;
/** In-memory hits younger than this skip a background refetch (server Redis may still be warm). */
const CLIENT_FRESH_MS = 15 * 60 * 1000;
const SESSION_STORAGE_PREFIX = "company-news:v2:";

type Listener = (data?: StockNewsView, error?: string) => void;

type InFlightNewsEntry = {
  listeners: Set<Listener>;
};

const inFlightNews = new Map<string, InFlightNewsEntry>();

function cacheNews(
  key: string,
  data: StockNewsView,
  analyzedAt: number | null,
): number {
  const fetchedAt = Date.now();
  newsCache.set(key, { data, fetchedAt, analyzedAt });
  persistSessionCache(key, data, fetchedAt, analyzedAt);
  return fetchedAt;
}

function persistSessionCache(
  key: string,
  data: StockNewsView,
  fetchedAt: number,
  analyzedAt: number | null,
): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      `${SESSION_STORAGE_PREFIX}${key}`,
      JSON.stringify({ data, fetchedAt, analyzedAt } satisfies CachedNews),
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

function buildAnalyzeNewsUrl(symbol: string, refresh = false): string {
  const params = new URLSearchParams({ symbol });
  if (refresh) {
    params.set("refresh", "true");
  }
  return `/analyze-company-news?${params.toString()}`;
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

  if (!res.ok) throw new Error("Failed to fetch news");

  return res.json();
}

async function analyzeCompanyNews(
  symbol: string,
  accessToken: string,
  refresh = false,
): Promise<StockNewsView> {
  const res = await apiFetch(buildAnalyzeNewsUrl(symbol, refresh), {
    method: "POST",
    accessToken,
  });

  if (!res.ok) throw new Error("Failed to analyze news");

  return res.json();
}

export function invalidateCompanyNewsCache(symbol?: string): void {
  if (symbol) {
    const key = symbol.trim().toUpperCase();
    newsCache.delete(key);
    inFlightNews.delete(key);
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem(`${SESSION_STORAGE_PREFIX}${key}`);
      } catch {
        // ignore
      }
    }
    return;
  }

  newsCache.clear();
  inFlightNews.clear();
  if (typeof window === "undefined") return;
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
      const storageKey = sessionStorage.key(i);
      if (storageKey?.startsWith(SESSION_STORAGE_PREFIX)) {
        sessionStorage.removeItem(storageKey);
      }
    }
  } catch {
    // ignore
  }
}

export function useCompanyNews(
  symbol: string | undefined,
  accessToken?: string,
  enabled = true,
): UseCompanyNewsResult {
  const [analytics, setAnalytics] = useState<StockNewsView | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [lastAnalyzedAt, setLastAnalyzedAt] = useState<number | null>(null);

  const key = symbol?.trim().toUpperCase();

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
      setLastAnalyzedAt(cached.analyzedAt);
      setError(null);
      setIsLoading(false);
    }

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
          const stored = newsCache.get(key);
          setAnalytics(data);
          setLastUpdated(stored?.fetchedAt ?? null);
          setLastAnalyzedAt(stored?.analyzedAt ?? null);
          setError(null);
          setIsLoading(false);
          setIsRefreshing(false);
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
        const stored = newsCache.get(key);
        setAnalytics(data);
        setLastUpdated(stored?.fetchedAt ?? null);
        setLastAnalyzedAt(stored?.analyzedAt ?? null);
        setError(null);
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };

    entry.listeners.add(listener);

    (async () => {
      try {
        const data = await fetchCompanyNews(key, accessToken, false);
        const analyzedAt = data.aiEnrichment ? Date.now() : null;
        cacheNews(key, data, analyzedAt);

        for (const l of entry?.listeners ?? []) {
          l(data);
        }
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Error fetching news";
        for (const l of entry?.listeners ?? []) {
          l(undefined, msg);
        }
      } finally {
        inFlightNews.delete(key);
      }
    })();

    return () => {
      cancelled = true;
      entry?.listeners.delete(listener);
    };
  }, [key, accessToken, enabled]);

  const refresh = useCallback(() => {
    if (!key || !accessToken || isLoading || isRefreshing || isAnalyzing)
      return;

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
        const analyzedAt = data.aiEnrichment ? Date.now() : null;
        const fetchedAt = cacheNews(key, data, analyzedAt);
        setAnalytics(data);
        setLastUpdated(fetchedAt);
        setLastAnalyzedAt(analyzedAt);
        setIsLoading(false);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Error fetching news");
      } finally {
        setIsRefreshing(false);
      }
    })();
  }, [accessToken, isAnalyzing, isLoading, isRefreshing, key]);

  const analyzeNews = useCallback(
    (options?: { refresh?: boolean }) => {
      if (!key || !accessToken || isAnalyzing) return;

      void (async () => {
        setIsAnalyzing(true);
        setError(null);

        try {
          const data = await analyzeCompanyNews(
            key,
            accessToken,
            options?.refresh ?? false,
          );
          const analyzedAt = Date.now();
          const fetchedAt = cacheNews(key, data, analyzedAt);
          setAnalytics(data);
          setLastUpdated(fetchedAt);
          setLastAnalyzedAt(analyzedAt);
        } catch (e: unknown) {
          setError(e instanceof Error ? e.message : "Error analyzing news");
        } finally {
          setIsAnalyzing(false);
        }
      })();
    },
    [accessToken, isAnalyzing, key],
  );

  return {
    analytics,
    isLoading,
    isRefreshing,
    isAnalyzing,
    error,
    lastUpdated,
    lastAnalyzedAt,
    refetch: refresh,
    refresh,
    analyzeNews,
  };
}
