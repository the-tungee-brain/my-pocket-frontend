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
  baseUrl?: string;
  enabled?: boolean;
};

export function useStockData({
  symbol,
  accessToken,
  enabled = true,
}: UseStockDataOptions) {
  const [data, setData] = useState<StockResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !symbol) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const controller = new AbortController();

    async function fetchStock() {
        if (!accessToken) return;
        try {
            const res = await apiFetch(`/get-stock-data?symbol=${symbol}`,
            {
                method: "GET",
                accessToken: accessToken,
                signal: controller.signal,
                cache: "no-store",
            }
            );

            if (!res.ok) {
            const text = await res.text().catch(() => "");
            throw new Error(`Failed to fetch stock data: ${res.status} ${text}`);
            }

            const json: StockResponse = await res.json();

            if (!cancelled) {
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
    }, [symbol, accessToken, enabled]);

    return { data, loading, error };
}