"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import { isAbortError } from "@/lib/isAbortError";

export type TradeEnvironment = "FAVORABLE" | "NEUTRAL" | "AVOID";
export type ScoreBucket = "TRADE" | "SETUP" | "WATCHLIST" | "NO_TRADE";
export type TradeVerdict = "TRADE" | "WATCHLIST" | "NO_TRADE";
export type TradeAction = "ENTER" | "WAIT_FOR_SETUP" | "AVOID";

export type TradeDecisionReasonBreakdown = {
  hardBlockers: string[];
  primaryWeakness?: string | null;
  secondaryFactors: string[];
};

export type TradeDecision = {
  symbol: string;
  asOfDate?: string | null;
  regime: {
    regimeId?: string | null;
    tradeEnvironment: TradeEnvironment;
  };
  tradeQualityScore: number;
  scoreBucket: ScoreBucket;
  verdict: TradeVerdict;
  action: TradeAction;
  reasonBreakdown: TradeDecisionReasonBreakdown;
};

type Options = {
  accessToken?: string | null;
  enabled?: boolean;
};

export function useTradeDecision(
  symbol: string | null,
  { accessToken, enabled = true }: Options = {},
) {
  const [decision, setDecision] = useState<TradeDecision | null>(null);
  const [isLoading, setIsLoading] = useState(!!symbol);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = symbol?.toUpperCase().trim();
    if (!key || !enabled) {
      setDecision(null);
      setIsLoading(false);
      setError(null);
      return;
    }
    if (!accessToken) {
      setDecision(null);
      setIsLoading(false);
      setError("Missing access token");
      return;
    }

    const controller = new AbortController();
    const token = accessToken;

    async function load() {
      try {
        const res = await apiFetch(
          `/research/trade-decision?symbol=${encodeURIComponent(key)}`,
          { method: "GET", accessToken: token, signal: controller.signal },
        );
        if (!res.ok) throw new Error("Failed to load trade decision");
        const data = (await res.json()) as TradeDecision;
        if (controller.signal.aborted) return;
        setDecision(data);
        setError(null);
      } catch (e: unknown) {
        if (controller.signal.aborted || isAbortError(e)) return;
        setError(e instanceof Error ? e.message : "Trade decision unavailable");
        setDecision(null);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    setIsLoading(true);
    setError(null);
    void load();
    return () => controller.abort();
  }, [symbol, accessToken, enabled]);

  return { decision, isLoading, error };
}
