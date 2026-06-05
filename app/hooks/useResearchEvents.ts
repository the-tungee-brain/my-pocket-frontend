"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchResearchEvents } from "@/lib/apiClient";
import type { EventTimelineEntry } from "@/app/types/intelligence";

export const researchEventsQueryKey = (
  accessToken: string,
  symbol: string,
) => ["research-events", accessToken, symbol.toUpperCase()] as const;

type Options = {
  enabled?: boolean;
};

export function useResearchEvents(
  symbol: string | undefined,
  accessToken: string | undefined,
  options: Options = {},
) {
  const { enabled = true } = options;
  const symbolUpper = symbol?.toUpperCase().trim() ?? "";

  const query = useQuery({
    queryKey: researchEventsQueryKey(accessToken ?? "", symbolUpper),
    queryFn: () => {
      if (!accessToken) throw new Error("Missing access token");
      return fetchResearchEvents(accessToken, symbolUpper);
    },
    enabled: Boolean(accessToken && symbolUpper && enabled),
    staleTime: 10 * 60_000,
    retry: false,
  });

  return {
    events: query.data?.events ?? ([] as EventTimelineEntry[]),
    isLoading: query.isLoading,
    isRefreshing: query.isFetching && !query.isLoading,
    error: query.isError ? "Recent events are unavailable." : null,
    refetch: query.refetch,
  };
}
