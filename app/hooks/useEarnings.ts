"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import type { StreetAnalysisSnapshot } from "@/app/hooks/streetAnalysisTypes";
import type { BeatLabel, EarningsTiming } from "@/lib/earningsUtils";

export type EarningsEvent = {
  symbol: string;
  reportDate: string;
  fiscalPeriod: string;
  quarter: number | null;
  year: number | null;
  timing: EarningsTiming | null;
  epsActual: number | null;
  epsEstimate: number | null;
  epsSurprisePct: number | null;
  revenueActual: number | null;
  revenueEstimate: number | null;
  revenueSurprisePct: number | null;
  beatLabel: BeatLabel | null;
  transcriptId: string | null;
  isUpcoming: boolean;
};

export type EarningsListResponse = {
  symbol: string;
  upcoming: EarningsEvent | null;
  history: EarningsEvent[];
  streetAnalysis?: StreetAnalysisSnapshot | null;
};

export type TranscriptSegment = {
  speaker: string;
  role: string | null;
  text: string;
};

export type EarningsAnalysis = {
  headline: string;
  summary: string;
  context: string;
  keyHighlights: string[];
  guidanceAndOutlook: string;
  whatSurprised: string;
  investorTakeaway: string;
};

export type EarningsNewsHeadline = {
  headline: string;
  summary: string | null;
  source: string;
  datetime: string;
};

export type EarningsDetailResponse = {
  symbol: string;
  event: EarningsEvent;
  relatedNews: EarningsNewsHeadline[];
  transcriptAvailable: boolean;
  transcript: TranscriptSegment[];
  analysis: EarningsAnalysis | null;
};

type AccessOptions = {
  accessToken?: string | null;
};

const listCache = new Map<string, EarningsListResponse>();
const detailCache = new Map<string, EarningsDetailResponse>();

function listKey(symbol: string, limit: number) {
  return `${symbol}:${limit}`;
}

function detailKey(symbol: string, reportDate: string) {
  return `${symbol}:${reportDate}`;
}

export function useEarningsList(
  symbol: string | null,
  { accessToken, limit = 8 }: AccessOptions & { limit?: number } = {},
) {
  const [data, setData] = useState<EarningsListResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!symbol);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = symbol?.toUpperCase().trim();

    if (!key) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (!accessToken) {
      setData(null);
      setIsLoading(false);
      setError("Missing access token");
      return;
    }

    const cacheKey = listKey(key, limit);
    const cached = listCache.get(cacheKey);
    if (cached) {
      setData(cached);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await apiFetch(
          `/research/earnings?symbol=${encodeURIComponent(key!)}&limit=${limit}`,
          { method: "GET", accessToken: accessToken! },
        );

        if (!res.ok) {
          throw new Error("Failed to fetch earnings");
        }

        const json: EarningsListResponse = await res.json();
        if (cancelled) return;

        listCache.set(cacheKey, json);
        setData(json);
      } catch (e: unknown) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Error fetching earnings");
        setData(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [symbol, accessToken, limit]);

  return { data, isLoading, error };
}

export function useEarningsDetail(
  symbol: string | null,
  reportDate: string | null,
  { accessToken, enabled = true }: AccessOptions & { enabled?: boolean } = {},
) {
  const [data, setData] = useState<EarningsDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(
    !!symbol && !!reportDate && enabled,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = symbol?.toUpperCase().trim();

    if (!enabled || !key || !reportDate) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (!accessToken) {
      setData(null);
      setIsLoading(false);
      setError("Missing access token");
      return;
    }

    const cacheKey = detailKey(key, reportDate);
    const cached = detailCache.get(cacheKey);
    if (cached) {
      setData(cached);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setData(null);
    setError(null);
    setIsLoading(true);

    async function load() {
      try {
        const params = new URLSearchParams({
          symbol: key!,
          report_date: reportDate!,
          include_transcript: "true",
          include_analysis: "true",
        });
        const res = await apiFetch(`/research/earnings/detail?${params}`, {
          method: "GET",
          accessToken: accessToken!,
        });

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Earnings detail not found for this date");
          }
          throw new Error("Failed to fetch earnings detail");
        }

        const json: EarningsDetailResponse = await res.json();
        if (cancelled) return;

        detailCache.set(cacheKey, json);
        setData(json);
      } catch (e: unknown) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Error fetching earnings detail");
        setData(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [symbol, reportDate, accessToken, enabled]);

  return { data, isLoading, error };
}
