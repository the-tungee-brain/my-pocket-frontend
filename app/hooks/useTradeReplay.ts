"use client";

import { useQuery } from "@tanstack/react-query";
import type { TradeReplayWorkflow } from "@/app/types/tradeReplay";
import { fetchTradeReplay, refreshTradeReplay } from "@/lib/apiClient";
import { normalizeTradeReplayResponse } from "@/lib/tradeReplay";

export const tradeReplayQueryKey = (
  accessToken: string,
  symbol: string,
  workflow: TradeReplayWorkflow,
  date: string,
) =>
  [
    "trade-replay",
    accessToken,
    symbol.toUpperCase(),
    workflow,
    date,
  ] as const;

type Options = {
  enabled?: boolean;
  refreshOnLoad?: boolean;
};

function todayLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function useTradeReplay(
  symbol: string | undefined,
  accessToken: string | undefined,
  workflow: TradeReplayWorkflow,
  options: Options = {},
) {
  const { enabled = true, refreshOnLoad = true } = options;
  const symbolUpper = symbol?.toUpperCase().trim() ?? "";
  const date = todayLocalDate();

  const query = useQuery({
    queryKey: tradeReplayQueryKey(
      accessToken ?? "",
      symbolUpper,
      workflow,
      date,
    ),
    queryFn: async () => {
      if (!accessToken) throw new Error("Missing access token");
      const request = { symbol: symbolUpper, workflow, date };
      if (refreshOnLoad) {
        await refreshTradeReplay(accessToken, request);
      }
      return normalizeTradeReplayResponse(
        await fetchTradeReplay(accessToken, request),
      );
    },
    enabled: Boolean(accessToken && symbolUpper && enabled),
    staleTime: 60_000,
    retry: false,
  });

  return {
    replay: query.data ?? null,
    isLoading: query.isLoading,
    isRefreshing: query.isFetching && !query.isLoading,
    error: query.isError ? "Session Replay is unavailable." : null,
    refetch: query.refetch,
  };
}
