"use client";

import { useCallback, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { track } from "@/lib/analytics";
import {
  accountPositionsQueryKey,
  clearPositionsRefreshQueryParams,
  loadAccountPositions,
  readInitialPositionsRefresh,
  schwabConnectPendingFromUrl,
} from "@/lib/accountPositionsQuery";
import { fetchPortfolioBrief } from "@/lib/apiClient";
import type { SchwabReauthDetail } from "@/lib/schwabReauth";
import type { AccountPositionsResponse } from "@/app/types/schwab";

type Options = {
  enabled?: boolean;
  onReauth?: (detail: SchwabReauthDetail) => void;
  onClearReauth?: () => void;
};

export function useAccountPositionsQuery(
  accessToken: string,
  options: Options = {},
) {
  const { enabled = true, onReauth, onClearReauth } = options;
  const queryClient = useQueryClient();
  const initialRefreshRef = useRef<boolean | null>(null);
  const schwabConnectPendingRef = useRef(false);
  const positionsLoadedTrackedRef = useRef(false);

  if (initialRefreshRef.current === null) {
    initialRefreshRef.current = readInitialPositionsRefresh();
    schwabConnectPendingRef.current = schwabConnectPendingFromUrl();
  }

  const query = useQuery({
    queryKey: accountPositionsQueryKey(accessToken),
    queryFn: async () => {
      const refresh = initialRefreshRef.current ?? false;
      initialRefreshRef.current = false;
      if (refresh) {
        clearPositionsRefreshQueryParams();
      }
      return loadAccountPositions(accessToken, refresh);
    },
    enabled: enabled && Boolean(accessToken),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!query.data || !accessToken) return;

    const data = query.data;
    if (data.portfolioBrief || data.dataFreshness?.briefStatus !== "pending") {
      return;
    }

    let cancelled = false;
    void fetchPortfolioBrief(accessToken)
      .then((brief) => {
        if (cancelled) return;
        queryClient.setQueryData<AccountPositionsResponse>(
          accountPositionsQueryKey(accessToken),
          (prev) =>
            prev
              ? {
                  ...prev,
                  portfolioBrief: brief,
                  dataFreshness: prev.dataFreshness
                    ? { ...prev.dataFreshness, briefStatus: "cached" }
                    : prev.dataFreshness,
                }
              : prev,
        );
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [query.data, accessToken, queryClient]);

  useEffect(() => {
    if (!query.data) return;

    const loadedPositions = Object.values(query.data.schwab_positions ?? {})
      .flat()
      .filter(Boolean);
    const symbolCount = Object.keys(query.data.schwab_positions ?? {}).length;

    if (!positionsLoadedTrackedRef.current) {
      positionsLoadedTrackedRef.current = true;
      track("positions_loaded", {
        symbol_count: symbolCount,
        position_count: loadedPositions.length,
        refreshed: false,
      });
    }

    if (schwabConnectPendingRef.current) {
      schwabConnectPendingRef.current = false;
      track("schwab_connect_completed", {
        symbol_count: symbolCount,
        position_count: loadedPositions.length,
      });
    }
  }, [query.data]);

  useEffect(() => {
    if (query.isSuccess && query.data) {
      onClearReauth?.();
    }
  }, [query.isSuccess, query.data, onClearReauth]);

  useEffect(() => {
    if (!query.isError || !query.error) return;
    const err = query.error as Error & { reauth?: SchwabReauthDetail | null };
    if (err.reauth?.reauthRequired) {
      onReauth?.(err.reauth);
    }
  }, [query.isError, query.error, onReauth]);

  const refreshPositions = useCallback(
    async (refresh = false) => {
      if (!accessToken) return;
      try {
        const data = await loadAccountPositions(accessToken, refresh);
        queryClient.setQueryData(accountPositionsQueryKey(accessToken), data);
        onClearReauth?.();

        if (
          !data.portfolioBrief &&
          data.dataFreshness?.briefStatus === "pending"
        ) {
          void fetchPortfolioBrief(accessToken)
            .then((brief) => {
              queryClient.setQueryData<AccountPositionsResponse>(
                accountPositionsQueryKey(accessToken),
                (prev) =>
                  prev
                    ? {
                        ...prev,
                        portfolioBrief: brief,
                        dataFreshness: prev.dataFreshness
                          ? { ...prev.dataFreshness, briefStatus: "cached" }
                          : prev.dataFreshness,
                      }
                    : prev,
              );
            })
            .catch(() => {});
        }

        const loadedPositions = Object.values(data.schwab_positions ?? {})
          .flat()
          .filter(Boolean);
        track("positions_loaded", {
          symbol_count: Object.keys(data.schwab_positions ?? {}).length,
          position_count: loadedPositions.length,
          refreshed: refresh,
        });
      } catch (err) {
        const apiErr = err as Error & { reauth?: SchwabReauthDetail | null };
        if (apiErr.reauth?.reauthRequired) {
          onReauth?.(apiErr.reauth);
        }
        queryClient.setQueryData(
          accountPositionsQueryKey(accessToken),
          undefined,
        );
        throw err;
      }
    },
    [accessToken, onClearReauth, onReauth, queryClient],
  );

  return {
    data: query.data ?? null,
    loading: query.isLoading || query.isFetching,
    error: query.isError
      ? query.error instanceof Error
        ? query.error.message
        : "Failed to load positions"
      : null,
    refreshPositions,
    reset: () =>
      queryClient.removeQueries({
        queryKey: accountPositionsQueryKey(accessToken),
      }),
  };
}
