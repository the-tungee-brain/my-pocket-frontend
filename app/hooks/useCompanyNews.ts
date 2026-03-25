"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";

export type NewsItem = {
  category: string;
  datetime: string;
  headline: string;
  id: number;
  image: string | null;
  related: string;
  source: string;
  summary: string;
  url: string;
};

type UseCompanyNewsResult = {
  news: NewsItem[] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useCompanyNews(symbol: string | undefined, accessToken?: string): UseCompanyNewsResult {
  const [news, setNews] = useState<NewsItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async () => {
    if (!accessToken) return;
    if (!symbol) return;
    try {
      setIsLoading(true);
      setError(null);

      const res = await apiFetch(
        `/get-company-news?symbol=${encodeURIComponent(symbol)}`,
        {
          method: "GET",
          accessToken,
        },
      );
      
      if (!res.ok) throw new Error("Failed to fetch news");
      
      const data: NewsItem[] = await res.json();
      setNews(data);
    } catch (e: any) {
      setError(e?.message ?? "Error fetching news");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [symbol, accessToken]);

  return { news, isLoading, error, refetch: fetchNews };
}
