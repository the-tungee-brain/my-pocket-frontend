"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  fetchPortfolioLatest,
  fetchRankingsTop,
  fetchResearchOverviewBundle,
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

export function useTopMoverDetail(symbol: string | null) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const key = symbol?.toUpperCase() ?? "";

  return useQuery({
    queryKey: ["top-mover-detail", accessToken ?? "anon", key],
    enabled: Boolean(accessToken && key),
    queryFn: async () => {
      const result = await fetchResearchOverviewBundle(accessToken!, key, {
        includeSummary: true,
        skipEtag: true,
      });
      if (result.status === "not_modified") return null;
      return result.bundle;
    },
    staleTime: 120_000,
  });
}
