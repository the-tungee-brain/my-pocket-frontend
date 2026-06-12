"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  MissedMovesRange,
  MissedMovesSort,
  TradeReplayWorkflow,
} from "@/app/types/tradeReplay";
import {
  fetchMissedMovesSummary,
  fetchTradeReplay,
  refreshTradeReplay,
} from "@/lib/apiClient";
import { normalizeTradeReplayResponse } from "@/lib/tradeReplay";

export const tradeReplayQueryKey = (
  accessToken: string,
  symbol: string,
  workflow: TradeReplayWorkflow,
  date: string,
  missedMoveId?: string | number | null,
) =>
  [
    "trade-replay",
    accessToken,
    symbol.toUpperCase(),
    workflow,
    date,
    missedMoveId ?? "",
  ] as const;

type Options = {
  enabled?: boolean;
  refreshOnLoad?: boolean;
  date?: string;
  missedMoveId?: string | number | null;
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
  const date = options.date ?? todayLocalDate();

  const query = useQuery({
    queryKey: tradeReplayQueryKey(
      accessToken ?? "",
      symbolUpper,
      workflow,
      date,
      options.missedMoveId,
    ),
    queryFn: async () => {
      if (!accessToken) throw new Error("Missing access token");
      const request = {
        symbol: symbolUpper,
        workflow,
        date,
        missedMoveId: options.missedMoveId,
      };
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

export const missedMovesSummaryQueryKey = (
  accessToken: string,
  symbol: string,
  workflow: TradeReplayWorkflow,
  range: MissedMovesRange,
  sort: MissedMovesSort,
) =>
  [
    "missed-moves-summary",
    accessToken,
    symbol.toUpperCase(),
    workflow,
    range,
    sort,
  ] as const;

export function useMissedMovesSummary(
  symbol: string | undefined,
  accessToken: string | undefined,
  workflow: TradeReplayWorkflow,
  range: MissedMovesRange,
  sort: MissedMovesSort,
  options: { enabled?: boolean } = {},
) {
  const symbolUpper = symbol?.toUpperCase().trim() ?? "";
  const { enabled = true } = options;

  const query = useQuery({
    queryKey: missedMovesSummaryQueryKey(
      accessToken ?? "",
      symbolUpper,
      workflow,
      range,
      sort,
    ),
    queryFn: async () => {
      if (!accessToken) throw new Error("Missing access token");
      return fetchMissedMovesSummary(accessToken, {
        symbol: symbolUpper,
        workflow,
        range,
        sort,
      });
    },
    enabled: Boolean(accessToken && symbolUpper && enabled),
    staleTime: 60_000,
    retry: false,
  });

  return {
    summary: query.data ?? null,
    rows: query.data?.rows ?? [],
    isLoading: query.isLoading,
    isRefreshing: query.isFetching && !query.isLoading,
    error: query.isError ? "Missed Moves summary is unavailable." : null,
    refetch: query.refetch,
  };
}
