"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import type { EtfFundsSnapshot } from "@/app/hooks/etfFundsTypes";
import type { StreetAnalysisSnapshot } from "@/app/hooks/streetAnalysisTypes";

export type FundamentalMetric = {
  label: string;
  value: string;
  note?: string | null;
};

export type YFinanceFinancialLineItem = {
  label: string;
  values: Record<string, number | null>;
};

export type YFinanceFinancialStatements = {
  periods: string[];
  incomeStatement: YFinanceFinancialLineItem[];
  balanceSheet: YFinanceFinancialLineItem[];
  cashFlow: YFinanceFinancialLineItem[];
};

export type FinancialStrengthRating = "strong" | "solid" | "mixed" | "weak";

export type FinancialStrength = {
  rating: FinancialStrengthRating;
  score: number;
  headline: string;
  strengths: string[];
  risks: string[];
  highlights: string[];
};

export type FundamentalsOverview = {
  atAGlance: string;
  valuationTake: string;
  strengths: string[];
  concerns: string[];
  assumptions: string;
};

export type FundamentalsBlock = {
  overview?: FundamentalsOverview | null;
  overviewNote?: string;
  metrics: FundamentalMetric[];
  quarterlyFinancials?: YFinanceFinancialStatements | null;
  annualFinancials?: YFinanceFinancialStatements | null;
  strength?: FinancialStrength | null;
  streetAnalysis?: StreetAnalysisSnapshot | null;
  etfFunds?: EtfFundsSnapshot | null;
};

const fundamentalsCache = new Map<string, FundamentalsBlock>();

type UseFundamentalsOptions = {
  accessToken?: string | null;
  /** When false, client still loads fundamentals but should not request AI overview. */
  proFinancialAnalysis?: boolean;
  /** LLM fundamentals overview (Pro). Defaults to false for faster initial page load. */
  includeAiOverview?: boolean;
  /** Wall Street estimates / ownership bundle. Off on Financials tab. */
  includeStreetAnalysis?: boolean;
};

export function useFundamentals(
  symbol: string | null,
  {
    accessToken,
    proFinancialAnalysis = true,
    includeAiOverview = false,
    includeStreetAnalysis = false,
  }: UseFundamentalsOptions = {},
) {
  const [fundamentals, setFundamentals] = useState<FundamentalsBlock | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState<boolean>(!!symbol);
  const [error, setError] = useState<string | null>(null);
  const wantsAiOverview = proFinancialAnalysis && includeAiOverview;

  useEffect(() => {
    const key = symbol?.toUpperCase().trim();

    if (!key) {
      setFundamentals(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (!accessToken) {
      setFundamentals(null);
      setIsLoading(false);
      setError("Missing access token");
      return;
    }

    const cacheId = `${key}:${proFinancialAnalysis ? "pro" : "free"}:ai${wantsAiOverview ? "1" : "0"}:street${includeStreetAnalysis ? "1" : "0"}`;
    const cached = fundamentalsCache.get(cacheId);
    if (cached) {
      setFundamentals(cached);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          symbol: key!,
          include_ai_overview: wantsAiOverview ? "true" : "false",
          include_street_analysis: includeStreetAnalysis ? "true" : "false",
        });
        const res = await apiFetch(`/research/fundamentals?${params}`, {
          method: "GET",
          accessToken: accessToken!,
        });

        if (!res.ok) {
          throw new Error("Failed to fetch fundamentals");
        }

        const data: FundamentalsBlock = await res.json();
        if (cancelled) return;

        fundamentalsCache.set(cacheId, data);
        setFundamentals(data);
        setError(null);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Error fetching fundamentals");
        setFundamentals(null);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [
    symbol,
    accessToken,
    proFinancialAnalysis,
    wantsAiOverview,
    includeStreetAnalysis,
  ]);

  return { fundamentals, isLoading, error };
}
