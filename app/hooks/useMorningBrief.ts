"use client";

import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { track } from "@/lib/analytics";
import { fetchMorningBrief } from "@/lib/apiClient";
import type { MorningBrief, PortfolioIntelligence } from "@/app/types/intelligence";

export const morningBriefQueryKey = (accessToken: string) =>
  ["morning-brief", accessToken] as const;

type Options = {
  enabled?: boolean;
  initialBrief?: PortfolioIntelligence | null;
};

export function useMorningBrief(
  accessToken: string | undefined,
  options: Options = {},
) {
  const { enabled = true, initialBrief = null } = options;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: morningBriefQueryKey(accessToken ?? ""),
    queryFn: async () => {
      try {
        return await fetchMorningBrief(accessToken!, { refresh: false });
      } catch (err) {
        const status =
          err instanceof Error && "status" in err
            ? (err as Error & { status?: number }).status
            : undefined;
        if ((status === 404 || status === 401) && initialBrief) {
          return null;
        }
        throw err;
      }
    },
    enabled: Boolean(accessToken && enabled),
    staleTime: 60_000,
  });

  const morningBrief = query.data ?? null;

  const portfolioBrief = useMemo<PortfolioIntelligence | null>(() => {
    if (morningBrief) {
      return {
        signals: morningBrief.signals ?? [],
        digest: morningBrief.digest ?? null,
        alerts: morningBrief.topAlerts ?? [],
      };
    }
    return initialBrief;
  }, [initialBrief, morningBrief]);

  const error =
    query.isError && !initialBrief
      ? "Morning brief is not available yet."
      : null;

  const refetch = useCallback(async () => {
    if (!accessToken || !enabled) return;
    const data = await fetchMorningBrief(accessToken, { refresh: true });
    queryClient.setQueryData(morningBriefQueryKey(accessToken), data);
    track("morning_brief_viewed", {
      alert_count: data.topAlerts?.length ?? 0,
      refreshed: true,
    });
  }, [accessToken, enabled, queryClient]);

  return {
    morningBrief,
    portfolioBrief,
    loading: query.isLoading || query.isFetching,
    error,
    lastUpdated: morningBrief ? Date.now() : null,
    refetch,
  };
}
