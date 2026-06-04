"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  PaperTradeBucket,
  PaperTradePerformanceMeta,
  PaperTradeRecord,
  PaperTradeSummary,
} from "@/app/types/momentumBreakoutPaperPerformance";
import {
  fetchMomentumBreakoutPaperByRegime,
  fetchMomentumBreakoutPaperBySymbol,
  fetchMomentumBreakoutPaperSummary,
  fetchMomentumBreakoutPaperTrades,
} from "@/lib/momentumBreakoutPaperPerformance";

export function useMomentumBreakoutPaperPerformance(accessToken: string) {
  const [meta, setMeta] = useState<PaperTradePerformanceMeta | null>(null);
  const [summary, setSummary] = useState<PaperTradeSummary | null>(null);
  const [bySymbol, setBySymbol] = useState<PaperTradeBucket[]>([]);
  const [byRegime, setByRegime] = useState<PaperTradeBucket[]>([]);
  const [recentTrades, setRecentTrades] = useState<PaperTradeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, tradesRes, symbolRes, regimeRes] = await Promise.all([
        fetchMomentumBreakoutPaperSummary(accessToken),
        fetchMomentumBreakoutPaperTrades(accessToken, 12),
        fetchMomentumBreakoutPaperBySymbol(accessToken),
        fetchMomentumBreakoutPaperByRegime(accessToken),
      ]);
      setMeta(summaryRes.meta);
      setSummary(summaryRes.summary);
      setBySymbol(symbolRes.buckets);
      setByRegime(regimeRes.buckets);
      const completed = tradesRes.trades.filter((t) =>
        ["TARGET_HIT", "STOP_HIT", "EXPIRED"].includes(t.status),
      );
      setRecentTrades(completed.slice(0, 8));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load performance");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return {
    meta,
    summary,
    bySymbol,
    byRegime,
    recentTrades,
    loading,
    error,
    reload,
  };
}
