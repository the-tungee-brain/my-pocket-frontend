"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";

export type BusinessBlock = {
  whatTheyDo: string;
  segments: string[];
  revenueNotes: string;
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
  const [isLoading, setIsLoading] = useState<boolean>(!!symbol);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = symbol?.toUpperCase().trim();

    if (!key) {
      setBusiness(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (!accessToken) {
      setBusiness(null);
      setIsLoading(false);
      setError("Missing access token");
      return;
    }

    const cached = businessDetailsCache.get(key);
    if (cached) {
      setBusiness(cached);
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
          `/research/business?symbol=${encodeURIComponent(key!)}`,
          {
            method: "GET",
            accessToken: accessToken!,
          },
        );

        if (!res.ok) {
          throw new Error("Failed to fetch business details");
        }

        const data: BusinessBlock = await res.json();
        if (cancelled) return;

        businessDetailsCache.set(key!, data);
        setBusiness(data);
        setError(null);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? "Error fetching business details");
        setBusiness(null);
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
  }, [symbol, accessToken]);

  return { business, isLoading, error };
}