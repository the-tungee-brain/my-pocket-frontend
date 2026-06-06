"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTradingBias } from "@/lib/apiClient";

export const tradingBiasQueryKey = (accessToken: string, symbol: string) =>
  ["trading-bias", accessToken, symbol.toUpperCase()] as const;

type Options = {
  enabled?: boolean;
};

export function useTradingBias(
  symbol: string | undefined,
  accessToken: string | undefined,
  options: Options = {},
) {
  const { enabled = true } = options;
  const symbolUpper = symbol?.toUpperCase().trim() ?? "";

  const query = useQuery({
    queryKey: tradingBiasQueryKey(accessToken ?? "", symbolUpper),
    queryFn: () => {
      if (!accessToken) throw new Error("Missing access token");
      return fetchTradingBias(accessToken, symbolUpper);
    },
    enabled: Boolean(accessToken && symbolUpper && enabled),
    staleTime: 5 * 60_000,
    retry: false,
  });

  return {
    tradingBias: query.data ?? null,
    isLoading: query.isLoading,
    isRefreshing: query.isFetching && !query.isLoading,
    error: query.isError ? "Trading bias is unavailable." : null,
    refetch: query.refetch,
  };
}
