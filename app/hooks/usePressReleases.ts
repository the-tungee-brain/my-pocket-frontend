"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPressReleases } from "@/lib/apiClient";
import type { PressReleaseHeadline } from "@/app/types/pressReleases";

export const pressReleasesQueryKey = (
  accessToken: string,
  symbol: string,
  lookbackDays: number,
) => ["press-releases", accessToken, symbol.toUpperCase(), lookbackDays] as const;

type Options = {
  enabled?: boolean;
  lookbackDays?: number;
};

export function usePressReleases(
  symbol: string | undefined,
  accessToken: string | undefined,
  options: Options = {},
) {
  const { enabled = true, lookbackDays = 90 } = options;
  const symbolUpper = symbol?.toUpperCase().trim() ?? "";
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: pressReleasesQueryKey(accessToken ?? "", symbolUpper, lookbackDays),
    queryFn: () => {
      if (!accessToken) throw new Error("Missing access token");
      return fetchPressReleases(accessToken, symbolUpper, { lookbackDays });
    },
    enabled: Boolean(accessToken && symbolUpper && enabled),
    staleTime: 10 * 60_000,
    retry: false,
  });

  const error = query.isError ? "Could not load official announcements." : null;

  const refetch = useCallback(async () => {
    if (!accessToken || !symbolUpper) return;
    await queryClient.fetchQuery({
      queryKey: pressReleasesQueryKey(accessToken, symbolUpper, lookbackDays),
      queryFn: () =>
        fetchPressReleases(accessToken, symbolUpper, { lookbackDays }),
      retry: false,
    });
  }, [accessToken, lookbackDays, queryClient, symbolUpper]);

  return {
    items: query.data?.items ?? ([] as PressReleaseHeadline[]),
    isLoading: query.isLoading,
    isRefreshing: query.isFetching && !query.isLoading,
    error,
    lastUpdated: query.dataUpdatedAt > 0 ? query.dataUpdatedAt : null,
    refetch,
  };
}
