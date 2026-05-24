"use client";

import { useEffect, useState } from "react";
import { apiFetch, streamGet } from "@/lib/apiClient";
import { isAbortError } from "@/lib/isAbortError";

export type BusinessBlock = {
  whatTheyDo: string;
  segments: string[];
  revenueNotes: string;
  customersAndMarkets: string;
  competitiveLandscape: string;
  moatAndDifferentiators: string;
  growthDrivers: string[];
  keyRisks: string[];
};

const businessDetailsCache = new Map<string, BusinessBlock>();

type UseBusinessDetailsOptions = {
  accessToken?: string | null;
};

export function useBusinessDetails(
  symbol: string | null,
  { accessToken }: UseBusinessDetailsOptions = {},
) {
  const [business, setBusiness] = useState<BusinessBlock | null>(null);
  const [streamMarkdown, setStreamMarkdown] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(!!symbol);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = symbol?.toUpperCase().trim();

    if (!key) {
      setBusiness(null);
      setStreamMarkdown("");
      setIsStreaming(false);
      setIsLoading(false);
      setError(null);
      return;
    }

    const symbolKey = key;

    if (!accessToken) {
      setBusiness(null);
      setStreamMarkdown("");
      setIsStreaming(false);
      setIsLoading(false);
      setError("Missing access token");
      return;
    }

    const cached = businessDetailsCache.get(symbolKey);
    if (cached) {
      setBusiness(cached);
      setStreamMarkdown("");
      setIsStreaming(false);
      setIsLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;
    const token = accessToken;

    async function loadJson() {
      try {
        const res = await apiFetch(
          `/research/business?symbol=${encodeURIComponent(symbolKey)}`,
          {
            method: "GET",
            accessToken: token,
            signal,
          },
        );

        if (!res.ok) {
          throw new Error("Failed to fetch business details");
        }

        const data: BusinessBlock = await res.json();
        if (signal.aborted) return;

        businessDetailsCache.set(symbolKey, data);
        setBusiness(data);
        setStreamMarkdown("");
        setError(null);
      } catch (e: unknown) {
        if (signal.aborted || isAbortError(e)) return;
        const message =
          e instanceof Error ? e.message : "Error fetching business details";
        setError((prev) => prev ?? message);
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
          setIsStreaming(false);
        }
      }
    }

    async function loadStream() {
      setIsStreaming(true);
      let buffer = "";

      try {
        await streamGet(
          `/research/business?symbol=${encodeURIComponent(symbolKey)}&stream=true`,
          token,
          (chunk) => {
            if (signal.aborted) return;
            buffer += chunk;
            setStreamMarkdown(buffer);
          },
          { signal },
        );
        if (signal.aborted) return;
        setError(null);
      } catch (e: unknown) {
        if (signal.aborted || isAbortError(e)) return;
        const message =
          e instanceof Error ? e.message : "Error streaming business details";
        setError((prev) => prev ?? message);
      } finally {
        if (!signal.aborted) {
          setIsStreaming(false);
          setIsLoading((loading) => loading && !businessDetailsCache.has(symbolKey));
        }
      }
    }

    setBusiness(null);
    setStreamMarkdown("");
    setIsLoading(true);
    setError(null);

    void loadStream();
    void loadJson();

    return () => {
      controller.abort();
    };
  }, [symbol, accessToken]);

  return { business, streamMarkdown, isStreaming, isLoading, error };
}
