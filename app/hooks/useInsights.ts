"use client";

import { useEffect, useState } from "react";
import { streamAnalysis } from "@/lib/apiClient";
import type { Position, SchwabAccounts } from "@/app/types/schwab";

type InsightState = {
  loading: boolean;
  error: string | null;
  content: string | null;
};

type Listener = (done: boolean, error?: string) => void;

type InFlightEntry = {
  buffer: string;
  listeners: Set<Listener>;
};

const cache = new Map<string, { content: string }>();
const inFlight = new Map<string, InFlightEntry>();

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
            entry!.buffer += chunk;

            for (const l of entry!.listeners) {
              l(false);
            }
          },
        );

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
  }, [label, positions, account, accessToken, model]);

  return state;
}