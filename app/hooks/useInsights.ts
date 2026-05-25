"use client";

import { useCallback, useEffect, useState } from "react";
import { streamAnalysis } from "@/lib/apiClient";
import {
  buildStructuredAnalyzeRequest,
  structuredAnalyzeDisplayMessage,
} from "@/lib/structuredAnalysis";
import type { Position, SchwabAccounts } from "@/app/types/schwab";

type InsightState = {
  loading: boolean;
  error: string | null;
  content: string | null;
  refetch: () => void;
};

type Listener = (done: boolean, error?: string) => void;

type InFlightEntry = {
  buffer: string;
  listeners: Set<Listener>;
};

const cache = new Map<string, { content: string }>();
const inFlight = new Map<string, InFlightEntry>();

function makeKey(
  label: string,
  positions: Position[],
  structuredAnalyze?: boolean,
): string {
  return JSON.stringify({
    label,
    structuredAnalyze: !!structuredAnalyze,
    positions: positions.map((p) => ({
      symbol: p.instrument.symbol,
      longQuantity: p.longQuantity,
      shortQuantity: p.shortQuantity,
    })),
  });
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
  const [retryCount, setRetryCount] = useState(0);
  const [state, setState] = useState<Omit<InsightState, "refetch">>({
    loading: false,
    error: null,
    content: null,
  });

  const refetch = useCallback(() => {
    if (!label || !positions?.length) return;
    cache.delete(makeKey(label, positions, structuredAnalyze));
    setRetryCount((c) => c + 1);
  }, [label, positions, structuredAnalyze]);

  useEffect(() => {
    if (
      !enabled ||
      !label ||
      !positions?.length ||
      !account ||
      !accessToken
    ) {
      if (!enabled) {
        setState({ loading: false, error: null, content: null });
      }
      return;
    }

    const key = makeKey(label, positions, structuredAnalyze);

    const cached = cache.get(key);
    if (cached) {
      setState({ loading: false, error: null, content: cached.content });
      return;
    }

    let cancelled = false;

    let entry = inFlight.get(key);
    if (entry) {
      setState({
        loading: true,
        error: null,
        content: entry.buffer || null,
      });

      const listener: Listener = (done, error) => {
        if (cancelled) return;
        if (error) {
          setState({ loading: false, error, content: null });
        } else {
          setState({
            loading: !done,
            error: null,
            content: entry!.buffer || null,
          });
        }
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
    inFlight.set(key, entry);
    setState({ loading: true, error: null, content: null });

    const listener: Listener = (done, error) => {
      if (cancelled) return;
      if (error) {
        setState({ loading: false, error, content: null });
      } else {
        setState({
          loading: !done,
          error: null,
          content: entry!.buffer || null,
        });
      }
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
          entry!.buffer += chunk;

          for (const l of entry!.listeners) {
            l(false);
          }
        });

        cache.set(key, { content: entry!.buffer });

        for (const l of entry!.listeners) {
          l(true);
        }
      } catch {
        for (const l of entry!.listeners) {
          l(true, "Failed to load insights.");
        }
      } finally {
        inFlight.delete(key);
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
    retryCount,
    enabled,
  ]);

  return { ...state, refetch };
}