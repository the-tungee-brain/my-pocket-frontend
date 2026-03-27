"use client";

import { apiFetch } from "@/lib/apiClient";
import { useEffect, useState } from "react";

export type StockPoint = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type StockResponse = {
  symbol: string;
  name: string;
  currency: string;
  data: StockPoint[];
};

type UseStockDataOptions = {
  symbol?: string | null;
  accessToken?: string | null;
  enabled?: boolean;
  period?: string;   // "1d" | "5d" | "1mo" | "3mo" | ...
  interval?: string; // "1m" | "15m" | "1d" | ...
};

// Shared in-memory cache across hook instances
const stockCache = new Map<string, StockResponse>();

export function useStockData({
  symbol,
  accessToken,
  enabled = true,
  period = "3mo",
  interval = "1d",
}: UseStockDataOptions) {
  const [data, setData] = useState<StockResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !symbol || !accessToken) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    const key = `${symbol}:${period}:${interval}`;

    const cached = stockCache.get(key);
    if (cached) {
      setData(cached);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const controller = new AbortController();

    async function fetchStock() {
        if (!symbol || !accessToken) return
        try {
            const params = new URLSearchParams({
            symbol,
            period,
            interval,
            });

            const res = await apiFetch(`/get-stock-data?${params.toString()}`, {
            method: "GET",
            accessToken,
            signal: controller.signal,
            cache: "no-store",
            });

            if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`Failed to fetch stock data: ${res.status} ${text}`);
            }

            const json: StockResponse = await res.json();

            if (!cancelled) {
            stockCache.set(key, json);
            setData(json);
            setError(null);
            }
        } catch (e) {
            if (e instanceof Error && e.name === "AbortError") return;
            if (!cancelled) {
            setError(e instanceof Error ? e : new Error("Unknown error"));
            setData(null);
            }
        } finally {
            if (!cancelled) {
            setLoading(false);
            }
        }
        }

        fetchStock();

        return () => {
        cancelled = true;
        controller.abort();
        };
    }, [symbol, accessToken, enabled, period, interval]);

    return { data, loading, error };
}