"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTraderPlaybook } from "@/lib/apiClient";

export const traderPlaybookQueryKey = (accessToken: string, symbol: string) =>
  ["trader-playbook", accessToken, symbol.toUpperCase()] as const;

type Options = {
  enabled?: boolean;
};

export function useTraderPlaybook(
  symbol: string | undefined,
  accessToken: string | undefined,
  options: Options = {},
) {
  const { enabled = true } = options;
  const symbolUpper = symbol?.toUpperCase().trim() ?? "";

  const query = useQuery({
    queryKey: traderPlaybookQueryKey(accessToken ?? "", symbolUpper),
    queryFn: () => {
      if (!accessToken) throw new Error("Missing access token");
      return fetchTraderPlaybook(accessToken, symbolUpper);
    },
    enabled: Boolean(accessToken && symbolUpper && enabled),
    staleTime: 5 * 60_000,
    retry: false,
  });

  return {
    traderPlaybook: query.data ?? null,
    isLoading: query.isLoading,
    isRefreshing: query.isFetching && !query.isLoading,
    error: query.isError ? "Trader playbook is unavailable." : null,
    refetch: query.refetch,
  };
}
