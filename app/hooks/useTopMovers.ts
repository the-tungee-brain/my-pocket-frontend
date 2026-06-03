"use client";

import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import type { PatternIntelligence } from "@/app/types/intelligence";
import {
  fetchPatternIntelligence,
  fetchPortfolioLatest,
  fetchRankingsTop,
  fetchSymbolLookupName,
  fetchSystemHealth,
} from "@/lib/apiClient";

export const topMoversQueryKey = ["top-movers"] as const;

export function useTopMoversBundle() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;

  return useQuery({
    queryKey: [...topMoversQueryKey, accessToken ?? "anon"],
    enabled: Boolean(accessToken),
    queryFn: async () => {
      const token = accessToken!;
      const [rankings, health, portfolio] = await Promise.all([
        fetchRankingsTop(token, 20),
        fetchSystemHealth(token),
        fetchPortfolioLatest(token).catch(() => null),
      ]);
      const portfolioSymbols = new Set(
        (portfolio?.holdings ?? []).map((h) => h.symbol.toUpperCase()),
      );
      return { rankings, health, portfolio, portfolioSymbols };
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useSymbolCompanyName(symbol: string | null) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const key = symbol?.toUpperCase() ?? "";

  return useQuery({
    queryKey: ["symbol-company-name", accessToken ?? "anon", key],
    enabled: Boolean(accessToken && key),
    queryFn: () => fetchSymbolLookupName(accessToken!, key),
    staleTime: 300_000,
  });
}

/** Pattern scores for “Why it ranks” — uses `/pattern/intelligence`, not overview bundle. */
const patternIntelQueryOptions = (
  accessToken: string,
  symbol: string,
) => ({
  queryKey: ["top-mover-pattern-intel", accessToken, symbol] as const,
  queryFn: () => fetchPatternIntelligence(accessToken, symbol),
  staleTime: 120_000,
  retry: (failureCount: number, error: Error) => {
    const status = (error as Error & { status?: number }).status;
    if (status === 404 || status === 503) return false;
    return failureCount < 1;
  },
});

/** Warm pattern intelligence for the top of the list (trend chips + faster detail). */
export function useTopMoversIntelPrefetch(symbols: string[]) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const keys = useMemo(
    () =>
      [...new Set(symbols.map((s) => s.toUpperCase()).filter(Boolean))].slice(
        0,
        5,
      ),
    [symbols],
  );

  const results = useQueries({
    queries: keys.map((key) => ({
      ...patternIntelQueryOptions(accessToken ?? "", key),
      enabled: Boolean(accessToken && key),
    })),
  });

  return useMemo(() => {
    const map: Record<string, PatternIntelligence> = {};
    for (let i = 0; i < keys.length; i += 1) {
      const data = results[i]?.data;
      if (data) map[keys[i]] = data;
    }
    return map;
  }, [keys, results]);
}

export function useTopMoverDetail(symbol: string | null) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const key = symbol?.toUpperCase() ?? "";

  return useQuery({
    ...patternIntelQueryOptions(accessToken ?? "anon", key),
    enabled: Boolean(accessToken && key),
  });
}
