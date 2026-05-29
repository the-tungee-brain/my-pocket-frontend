"use client";

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchResearchOverviewBundle } from "@/lib/apiClient";
import { overviewBundleEtagKey, writeOverviewBundleEtag } from "@/lib/overviewBundleCache";
import type { ResearchOverviewBundle } from "@/app/types/researchOverview";
import { seedResearchOverviewCaches } from "@/lib/researchOverviewSeeds";

const ResearchOverviewContext = createContext<ResearchOverviewBundle | null>(
  null,
);
const ResearchOverviewLoadingContext = createContext(false);

type Props = {
  symbol: string;
  accessToken?: string | null;
  children: ReactNode;
};

export function ResearchOverviewProvider({
  symbol,
  accessToken,
  children,
}: Props) {
  const symbolUpper = symbol.toUpperCase();
  const queryClient = useQueryClient();
  const queryKey = ["research-overview", symbolUpper, accessToken ?? ""] as const;

  const { data, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: async () => {
      const result = await fetchResearchOverviewBundle(
        accessToken!,
        symbolUpper,
      );
      if (result.status === "ok") {
        return result.bundle;
      }

      const cached = queryClient.getQueryData<ResearchOverviewBundle>(queryKey);
      if (cached) {
        return cached;
      }

      writeOverviewBundleEtag(overviewBundleEtagKey(symbolUpper, false), null);
      const retry = await fetchResearchOverviewBundle(
        accessToken!,
        symbolUpper,
        { skipEtag: true },
      );
      if (retry.status !== "ok") {
        throw new Error("Failed to load research overview");
      }
      return retry.bundle;
    },
    enabled: Boolean(symbolUpper && accessToken),
    staleTime: 2 * 60_000,
  });

  useEffect(() => {
    if (!data) return;
    seedResearchOverviewCaches(data);
  }, [data]);

  return (
    <ResearchOverviewContext.Provider value={data ?? null}>
      <ResearchOverviewLoadingContext.Provider
        value={isLoading || isFetching}
      >
        {children}
      </ResearchOverviewLoadingContext.Provider>
    </ResearchOverviewContext.Provider>
  );
}

export function useResearchOverviewBundle() {
  return useContext(ResearchOverviewContext);
}

export function useResearchOverviewLoading() {
  return useContext(ResearchOverviewLoadingContext);
}

export function useResearchDataAsOf(): string | null {
  const bundle = useResearchOverviewBundle();
  return bundle?.asOf ?? null;
}

/** Avoid parallel fetches while the overview bundle request is in flight. */
export function useOverviewBundleGate(symbol: string | null | undefined) {
  const bundle = useResearchOverviewBundle();
  const overviewLoading = useResearchOverviewLoading();
  const key = symbol?.toUpperCase().trim() ?? "";

  return {
    bundle: key && bundle?.symbol === key ? bundle : null,
    waitForBundle: Boolean(key && overviewLoading),
  };
}
