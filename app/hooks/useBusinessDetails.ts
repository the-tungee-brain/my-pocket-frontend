"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import { isAbortError } from "@/lib/isAbortError";

export type BusinessBlock = {
  industry: string;
  primaryProduct: string;
  revenueModel: string;
  primaryCustomers: string[];
  howTheyMakeMoney: string[];
  revenueVisibility: string[];
  advantages: string[];
  challenges: string[];
  revenueDrivers: string[];
  constraints: string[];
  businessRisks: string[];
  dependencies: string[];
};

/** API should use camelCase; accept snake_case from older responses. */
function normalizeBusinessBlock(raw: Record<string, unknown>): BusinessBlock {
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const arr = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);

  return {
    industry: str(raw.industry),
    primaryProduct: str(raw.primaryProduct ?? raw.primary_product),
    revenueModel: str(raw.revenueModel ?? raw.revenue_model),
    primaryCustomers: arr(raw.primaryCustomers ?? raw.primary_customers),
    howTheyMakeMoney: arr(raw.howTheyMakeMoney ?? raw.how_they_make_money),
    revenueVisibility: arr(raw.revenueVisibility ?? raw.revenue_visibility),
    advantages: arr(raw.advantages),
    challenges: arr(raw.challenges),
    revenueDrivers: arr(
      raw.revenueDrivers ?? raw.revenue_drivers ?? raw.growthDrivers ?? raw.growth_drivers,
    ),
    constraints: arr(raw.constraints),
    businessRisks: arr(raw.businessRisks ?? raw.business_risks),
    dependencies: arr(raw.dependencies),
  };
}

const businessDetailsCache = new Map<string, BusinessBlock>();
const BUSINESS_CACHE_VERSION = "v4";

type UseBusinessDetailsOptions = {
  accessToken?: string | null;
  enabled?: boolean;
};

export function useBusinessDetails(
  symbol: string | null,
  { accessToken, enabled = true }: UseBusinessDetailsOptions = {},
) {
  const [business, setBusiness] = useState<BusinessBlock | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(!!symbol);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const symbolKey = symbol?.toUpperCase().trim();

    if (!symbolKey) {
      setBusiness(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const resolvedSymbol: string = symbolKey;
    const cacheKey = `${resolvedSymbol}:${BUSINESS_CACHE_VERSION}`;
    const businessPath = `/research/business?symbol=${encodeURIComponent(resolvedSymbol)}`;

    if (!enabled) {
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

    const cached = businessDetailsCache.get(cacheKey);
    if (cached) {
      setBusiness(cached);
      setIsLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;
    const token = accessToken;

    async function load() {
      try {
        const res = await apiFetch(businessPath, {
            method: "GET",
            accessToken: token,
            signal,
          },
        );

        if (!res.ok) {
          throw new Error("Failed to fetch business details");
        }

        const data = normalizeBusinessBlock(
          (await res.json()) as Record<string, unknown>,
        );
        if (signal.aborted) return;

        businessDetailsCache.set(cacheKey, data);
        setBusiness(data);
        setError(null);
      } catch (e: unknown) {
        if (signal.aborted || isAbortError(e)) return;
        const message =
          e instanceof Error ? e.message : "Error fetching business details";
        setError(message);
        setBusiness(null);
      } finally {
        if (!signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    setBusiness(null);
    setIsLoading(true);
    setError(null);
    void load();

    return () => {
      controller.abort();
    };
  }, [symbol, accessToken, enabled]);

  return { business, isLoading, error };
}
