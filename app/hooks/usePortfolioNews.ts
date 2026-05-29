"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPortfolioNews } from "@/lib/apiClient";
import type { PortfolioHoldingsNewsItem } from "@/app/types/portfolioNews";

export const portfolioNewsQueryKey = (accessToken: string) =>
  ["portfolio-news", accessToken] as const;

type Options = {
  enabled?: boolean;
};

export function usePortfolioNews(
  accessToken: string | undefined,
  options: Options = {},
) {
  const { enabled = true } = options;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: portfolioNewsQueryKey(accessToken ?? ""),
    queryFn: () => fetchPortfolioNews(accessToken!),
    enabled: Boolean(accessToken && enabled),
    staleTime: 5 * 60_000,
  });

  const error = query.isError
    ? query.error instanceof Error &&
      "status" in query.error &&
      (query.error as Error & { status?: number }).status === 404
      ? "Portfolio news is not available yet."
      : "Could not load portfolio news."
    : null;

  const refetch = useCallback(async () => {
    if (!accessToken) return;
    await queryClient.fetchQuery({
      queryKey: portfolioNewsQueryKey(accessToken),
      queryFn: () => fetchPortfolioNews(accessToken),
    });
  }, [accessToken, queryClient]);

  return {
    items: query.data?.items ?? ([] as PortfolioHoldingsNewsItem[]),
    loading: query.isLoading || query.isFetching,
    error,
    lastUpdated: query.dataUpdatedAt > 0 ? query.dataUpdatedAt : null,
    refetch,
  };
}
