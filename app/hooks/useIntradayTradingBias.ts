"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchIntradayTradingBias } from "@/lib/apiClient";

export const intradayTradingBiasQueryKey = (
  accessToken: string,
  symbol: string,
) => ["intraday-trading-bias", accessToken, symbol.toUpperCase()] as const;

type Options = {
  enabled?: boolean;
};

export function useIntradayTradingBias(
  symbol: string | undefined,
  accessToken: string | undefined,
  options: Options = {},
) {
  const { enabled = true } = options;
  const symbolUpper = symbol?.toUpperCase().trim() ?? "";

  const query = useQuery({
    queryKey: intradayTradingBiasQueryKey(accessToken ?? "", symbolUpper),
    queryFn: () => {
      if (!accessToken) throw new Error("Missing access token");
      return fetchIntradayTradingBias(accessToken, symbolUpper);
    },
    enabled: Boolean(accessToken && symbolUpper && enabled),
    staleTime: 60_000,
    retry: false,
  });

  return {
    intradayTradingBias: query.data ?? null,
    isLoading: query.isLoading,
    isRefreshing: query.isFetching && !query.isLoading,
    error: query.isError ? "Delayed intraday bias is unavailable." : null,
    refetch: query.refetch,
  };
}
