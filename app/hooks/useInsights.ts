"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { streamAnalysis } from "@/lib/apiClient";
import {
  buildInsightsCacheKey,
  clearInsightsCache,
  readInsightsCache,
  writeInsightsCache,
  type InsightsCacheEntry,
} from "@/lib/insightsCache";
import { parseStructuredAnalysis } from "@/lib/parseStructuredAnalysis";
import {
  buildStructuredAnalyzeRequest,
  structuredAnalyzeDisplayMessage,
} from "@/lib/structuredAnalysis";
import type { StructuredAnalysis } from "@/app/types/analysis";
import type { Position, SchwabAccounts } from "@/app/types/schwab";

type InsightState = {
  loading: boolean;
  error: string | null;
  content: string | null;
  structuredAnalysis: StructuredAnalysis | null;
  analyzedAt: number | null;
  hasCachedInsights: boolean;
  refetch: () => void;
};

type Listener = (done: boolean, error?: string) => void;

type InFlightEntry = {
  buffer: string;
  listeners: Set<Listener>;
};

const memoryCache = new Map<string, InsightsCacheEntry>();
const inFlight = new Map<string, InFlightEntry>();

function getCachedEntry(
  cacheKey: string,
  label: string,
): InsightsCacheEntry | null {
  const inMemory = memoryCache.get(cacheKey);
  if (inMemory) return inMemory;
  const stored = readInsightsCache(cacheKey, label);
  if (stored) {
    memoryCache.set(cacheKey, stored);
  }
  return stored;
}

export function useInsights(
  opts: {
    label: string | null;
    positions: Position[] | null;
    account: SchwabAccounts | null;
    accessToken: string | null;
    enabled?: boolean;
    /** @deprecated Use structuredAnalyze for Analyze button flows. */
    prompt?: string | null;
    structuredAnalyze?: boolean;
    userDisplayMessage?: string | null;
  },
  model: string = "gpt-5.4",
): InsightState {
  const {
    label,
    positions,
    account,
    accessToken,
    enabled = false,
    prompt = null,
    structuredAnalyze = false,
    userDisplayMessage = null,
  } = opts;

  const cacheKey = useMemo(() => {
    if (!label || !positions?.length) return null;
    return buildInsightsCacheKey(label, positions, structuredAnalyze);
  }, [label, positions, structuredAnalyze]);

  const bypassCacheRef = useRef(false);
  const [fetchGeneration, setFetchGeneration] = useState(0);
  const [state, setState] = useState<Omit<InsightState, "refetch" | "structuredAnalysis">>({
    loading: false,
    error: null,
    content: null,
    analyzedAt: null,
    hasCachedInsights: false,
  });

  const structuredAnalysis = useMemo(
    () =>
      structuredAnalyze ? parseStructuredAnalysis(state.content) : null,
    [structuredAnalyze, state.content],
  );

  const refetch = useCallback(() => {
    if (!cacheKey) return;
    memoryCache.delete(cacheKey);
    clearInsightsCache(cacheKey);
    bypassCacheRef.current = true;
    setState((previous) => ({
      ...previous,
      error: null,
    }));
    setFetchGeneration((generation) => generation + 1);
  }, [cacheKey]);

  useEffect(() => {
    if (!cacheKey || !label) {
      setState({
        loading: false,
        error: null,
        content: null,
        analyzedAt: null,
        hasCachedInsights: false,
      });
      return;
    }

    const cached = getCachedEntry(cacheKey, label);
    if (cached) {
      setState((previous) => ({
        ...previous,
        content: cached.content,
        analyzedAt: cached.fetchedAt,
        hasCachedInsights: true,
        error: null,
      }));
      return;
    }

    setState((previous) => ({
      ...previous,
      hasCachedInsights: false,
      analyzedAt: null,
      content: enabled ? previous.content : null,
    }));
  }, [cacheKey, enabled, label]);

  useEffect(() => {
    if (
      !enabled ||
      !label ||
      !positions?.length ||
      !cacheKey
    ) {
      if (!enabled) {
        setState((previous) => ({
          ...previous,
          loading: false,
        }));
      }
      return;
    }

    if (!account || !accessToken) {
      setState((previous) => ({
        ...previous,
        loading: true,
        error: null,
      }));
      return;
    }

    const shouldBypassCache = bypassCacheRef.current;
    bypassCacheRef.current = false;

    const cached = shouldBypassCache ? null : getCachedEntry(cacheKey, label);
    if (cached) {
      setState({
        loading: false,
        error: null,
        content: cached.content,
        analyzedAt: cached.fetchedAt,
        hasCachedInsights: true,
      });
      return;
    }

    let cancelled = false;

    let entry = inFlight.get(cacheKey);
    if (entry) {
      setState((previous) => ({
        ...previous,
        loading: true,
        error: null,
        content: entry!.buffer || previous.content,
      }));

      const listener: Listener = (done, error) => {
        if (cancelled) return;
        if (error) {
          setState((previous) => ({
            ...previous,
            loading: false,
            error,
          }));
          return;
        }

        setState((previous) => ({
          ...previous,
          loading: !done,
          error: null,
          content: entry!.buffer || previous.content,
        }));
      };

      entry.listeners.add(listener);

      return () => {
        cancelled = true;
        entry?.listeners.delete(listener);
      };
    }

    entry = {
      buffer: "",
      listeners: new Set<Listener>(),
    };
    inFlight.set(cacheKey, entry);
    setState((previous) => ({
      ...previous,
      loading: true,
      error: null,
    }));

    const listener: Listener = (done, error) => {
      if (cancelled) return;
      if (error) {
        setState((previous) => ({
          ...previous,
          loading: false,
          error,
        }));
        return;
      }

      setState((previous) => ({
        ...previous,
        loading: !done,
        error: null,
        content: entry!.buffer || previous.content,
      }));
    };

    entry.listeners.add(listener);

    (async () => {
      try {
        const displayMessage =
          userDisplayMessage ??
          structuredAnalyzeDisplayMessage({
            symbol: label === "PORTFOLIO" ? null : label,
            portfolio: label === "PORTFOLIO",
          });

        const body = structuredAnalyze
          ? buildStructuredAnalyzeRequest({
              account: account!,
              positions,
              symbol: label === "PORTFOLIO" ? null : label,
              userDisplayMessage: displayMessage,
              model,
            })
          : {
              account,
              positions,
              symbol: label === "PORTFOLIO" ? null : label,
              action: "free-form" as const,
              prompt,
              model,
            };

        await streamAnalysis(body, accessToken, (chunk) => {
          if (!chunk) return;
          entry!.buffer += chunk;
          for (const activeListener of entry!.listeners) {
            activeListener(false);
          }
        });

        if (!entry!.buffer.trim()) {
          throw new Error("Empty analysis response");
        }

        const stored = writeInsightsCache(cacheKey, entry!.buffer);
        if (stored) {
          memoryCache.set(cacheKey, stored);
        }

        setState({
          loading: false,
          error: null,
          content: entry!.buffer,
          analyzedAt: stored?.fetchedAt ?? Date.now(),
          hasCachedInsights: !!stored,
        });

        for (const activeListener of entry!.listeners) {
          activeListener(true);
        }
      } catch {
        for (const activeListener of entry!.listeners) {
          activeListener(true, "Failed to load insights.");
        }
      } finally {
        inFlight.delete(cacheKey);
      }
    })();

    return () => {
      cancelled = true;
      entry!.listeners.delete(listener);
    };
  }, [
    label,
    positions,
    account,
    accessToken,
    model,
    prompt,
    structuredAnalyze,
    userDisplayMessage,
    fetchGeneration,
    enabled,
    cacheKey,
  ]);

  return { ...state, structuredAnalysis, refetch };
}
