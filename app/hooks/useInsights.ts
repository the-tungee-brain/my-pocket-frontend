"use client";

import { useEffect, useState } from "react";
import { streamAnalysis } from "@/lib/apiClient";
import type { Position, SchwabAccounts } from "@/app/types/schwab";

type InsightState = {
  loading: boolean;
  error: string | null;
  content: string | null;
};

const cache = new Map<string, { content: string }>();

function makeKey(label: string, positions: Position[]): string {
  return JSON.stringify({
    label,
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
  },
  model: string = "gpt-4.1-mini",
): InsightState {
  const { label, positions, account, accessToken } = opts;
  const [state, setState] = useState<InsightState>({
    loading: false,
    error: null,
    content: null,
  });

  useEffect(() => {
    if (!label || !positions?.length || !account || !accessToken) {
      setState({ loading: false, error: null, content: null });
      return;
    }

    const key = makeKey(label, positions);

    const cached = cache.get(key);
    if (cached) {
      setState({ loading: false, error: null, content: cached.content });
      return;
    }

    let cancelled = false;
    let buffer = "";

    setState({ loading: true, error: null, content: null });

    (async () => {
      try {
        await streamAnalysis(
          {
            account,
            positions,
            symbol: label === "PORTFOLIO" ? null : label,
            action: "free-form",
            prompt: null,
            model,
          },
          accessToken,
          (chunk) => {
            if (cancelled) return;
            buffer += chunk;
            setState({ loading: true, error: null, content: buffer });
          },
        );

        if (!cancelled) {
          cache.set(key, { content: buffer });
          setState({ loading: false, error: null, content: buffer });
        }
      } catch {
        if (!cancelled) {
          setState({
            loading: false,
            error: "Failed to load insights.",
            content: null,
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [label, positions, account, accessToken, model]);

  return state;
}
