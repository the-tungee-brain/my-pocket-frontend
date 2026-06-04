"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/apiClient";
import type { SecPeriod } from "@/lib/secUtils";

export type SecLookup = {
  symbol: string;
  cik: string;
  cik_int: number;
  name: string;
  tickers: string[];
  exchanges: string[];
  sic: string | null;
  sic_description: string | null;
  fiscal_year_end: string | null;
  state_of_incorporation: string | null;
  category: string | null;
  entity_type: string | null;
};

export type SecFilingSummary = {
  accession_number: string;
  filing_date: string;
  report_date: string;
  form: string;
  primary_document: string | null;
};

export type SecFilingsResponse = {
  symbol: string;
  cik: string;
  filings: SecFilingSummary[];
};

export type FinancialObservation = {
  end: string;
  start: string | null;
  value: number;
  fiscal_year: number | null;
  fiscal_period: string;
  form: string;
  filed: string;
};

export type FinancialLineItem = {
  tag: string;
  label: string;
  unit: string;
  observations: FinancialObservation[];
};

export type SecFinancialsResponse = {
  symbol: string;
  cik: string;
  entity_name: string;
  period: SecPeriod;
  currency: string;
  income_statement: FinancialLineItem[];
  balance_sheet: FinancialLineItem[];
  cash_flow: FinancialLineItem[];
};

export type RatioSnapshot = {
  end: string;
  fiscal_period: string;
  fiscal_year: number | null;
  gross_margin: number | null;
  operating_margin: number | null;
  net_margin: number | null;
  roe: number | null;
  roa: number | null;
  debt_to_equity: number | null;
  free_cash_flow: number | null;
  fcf_margin: number | null;
  revenue_growth_yoy: number | null;
  net_income_growth_yoy: number | null;
};

export type SecRatiosResponse = {
  symbol: string;
  cik: string;
  entity_name: string;
  period: SecPeriod;
  snapshots: RatioSnapshot[];
};

type AccessOptions = {
  accessToken?: string | null;
};

function cacheKey(parts: (string | number | undefined | null)[]) {
  return parts.filter(Boolean).join(":");
}

const lookupCache = new Map<string, SecLookup>();
const filingsCache = new Map<string, SecFilingsResponse>();
const financialsCache = new Map<string, SecFinancialsResponse>();
const ratiosCache = new Map<string, SecRatiosResponse>();

async function secFetch<T>(
  path: string,
  accessToken: string,
  cache: Map<string, T>,
  key: string,
): Promise<T> {
  const cached = cache.get(key);
  if (cached) return cached;

  const res = await apiFetch(path, { method: "GET", accessToken });
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("SEC data is not available for this symbol");
    }
    throw new Error("Failed to fetch SEC research data");
  }
  const data: T = await res.json();
  cache.set(key, data);
  return data;
}

export function useSecLookup(
  symbol: string | null,
  { accessToken }: AccessOptions = {},
) {
  const [lookup, setLookup] = useState<SecLookup | null>(null);
  const [isLoading, setIsLoading] = useState(!!symbol);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = symbol?.toUpperCase().trim();
    if (!key || !accessToken) {
      setLookup(null);
      setIsLoading(false);
      setError(key && !accessToken ? "Missing access token" : null);
      return;
    }

    const resolvedSymbol: string = key;
    const cached = lookupCache.get(resolvedSymbol);
    if (cached) {
      setLookup(cached);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await secFetch<SecLookup>(
          `/research/sec/lookup?symbol=${encodeURIComponent(resolvedSymbol)}`,
          accessToken,
          lookupCache,
          resolvedSymbol,
        );
        if (!cancelled) setLookup(data);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? "Error fetching SEC lookup");
          setLookup(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [symbol, accessToken]);

  return { lookup, isLoading, error };
}

export function useSecFilings(
  symbol: string | null,
  limit = 12,
  { accessToken }: AccessOptions = {},
) {
  const [filings, setFilings] = useState<SecFilingsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(!!symbol);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = symbol?.toUpperCase().trim();
    if (!key || !accessToken) {
      setFilings(null);
      setIsLoading(false);
      setError(key && !accessToken ? "Missing access token" : null);
      return;
    }

    const resolvedSymbol: string = key;
    const cacheId = cacheKey([resolvedSymbol, "filings", limit]);
    const cached = filingsCache.get(cacheId);
    if (cached) {
      setFilings(cached);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await secFetch<SecFilingsResponse>(
          `/research/sec/filings?symbol=${encodeURIComponent(resolvedSymbol)}&limit=${limit}`,
          accessToken,
          filingsCache,
          cacheId,
        );
        if (!cancelled) setFilings(data);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? "Error fetching SEC filings");
          setFilings(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [symbol, limit, accessToken]);

  return { filings, isLoading, error };
}

export function useSecFinancials(
  symbol: string | null,
  period: SecPeriod,
  limit = 12,
  { accessToken }: AccessOptions = {},
) {
  const [financials, setFinancials] = useState<SecFinancialsResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(!!symbol);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = symbol?.toUpperCase().trim();
    if (!key || !accessToken) {
      setFinancials(null);
      setIsLoading(false);
      setError(key && !accessToken ? "Missing access token" : null);
      return;
    }

    const resolvedSymbol: string = key;
    const cacheId = cacheKey([resolvedSymbol, "financials", period, limit]);
    const cached = financialsCache.get(cacheId);
    if (cached) {
      setFinancials(cached);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await secFetch<SecFinancialsResponse>(
          `/research/sec/financials?symbol=${encodeURIComponent(resolvedSymbol)}&period=${period}&limit=${limit}`,
          accessToken,
          financialsCache,
          cacheId,
        );
        if (!cancelled) setFinancials(data);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? "Error fetching SEC financials");
          setFinancials(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [symbol, period, limit, accessToken]);

  return { financials, isLoading, error };
}

export function useSecRatios(
  symbol: string | null,
  period: SecPeriod,
  limit = 12,
  { accessToken }: AccessOptions = {},
) {
  const [ratios, setRatios] = useState<SecRatiosResponse | null>(null);
  const [isLoading, setIsLoading] = useState(!!symbol);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = symbol?.toUpperCase().trim();
    if (!key || !accessToken) {
      setRatios(null);
      setIsLoading(false);
      setError(key && !accessToken ? "Missing access token" : null);
      return;
    }

    const resolvedSymbol: string = key;
    const cacheId = cacheKey([resolvedSymbol, "ratios", period, limit]);
    const cached = ratiosCache.get(cacheId);
    if (cached) {
      setRatios(cached);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await secFetch<SecRatiosResponse>(
          `/research/sec/ratios?symbol=${encodeURIComponent(resolvedSymbol)}&period=${period}&limit=${limit}`,
          accessToken,
          ratiosCache,
          cacheId,
        );
        if (!cancelled) setRatios(data);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? "Error fetching SEC ratios");
          setRatios(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [symbol, period, limit, accessToken]);

  return { ratios, isLoading, error };
}
