"use client";

import { useQuery } from "@tanstack/react-query";
import type { PortfolioOptimizationResponse } from "@/app/types/portfolioOptimization";
import { apiFetch } from "@/lib/apiClient";

export const portfolioOptimizationQueryKey = (accessToken: string) =>
  ["portfolio-optimization", accessToken] as const;

type Options = {
  enabled?: boolean;
};

async function fetchPortfolioOptimization(
  accessToken: string,
): Promise<PortfolioOptimizationResponse> {
  const res = await apiFetch("/portfolio/optimization", {
    method: "GET",
    accessToken,
  });

  if (!res.ok) {
    throw new Error(`Failed to load portfolio optimization (${res.status})`);
  }

  return res.json() as Promise<PortfolioOptimizationResponse>;
}

export function usePortfolioOptimization(
  accessToken: string | undefined,
  options: Options = {},
) {
  const { enabled = true } = options;
  const query = useQuery({
    queryKey: portfolioOptimizationQueryKey(accessToken ?? ""),
    queryFn: () => {
      if (!accessToken) throw new Error("Missing access token");
      return fetchPortfolioOptimization(accessToken);
    },
    enabled: Boolean(accessToken && enabled),
    staleTime: 5 * 60_000,
    retry: false,
  });

  return {
    optimization: query.data ?? null,
    loading: query.isLoading,
    error: query.isError ? "Could not load portfolio optimization." : null,
  };
}
