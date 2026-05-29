"use client";

import {
  createContext,
  useContext,
  useEffect,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchResearchOverviewBundle } from "@/lib/apiClient";
import type { ResearchOverviewBundle } from "@/app/types/researchOverview";
import { rememberAssetType } from "@/lib/researchAssetType";
import { seedSymbolIntelligenceCache } from "@/app/hooks/useSymbolIntelligence";

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

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["research-overview", symbolUpper, accessToken ?? ""],
    queryFn: () => fetchResearchOverviewBundle(accessToken!, symbolUpper),
    enabled: Boolean(symbolUpper && accessToken),
    staleTime: 2 * 60_000,
  });

  useEffect(() => {
    if (!data) return;
    seedSymbolIntelligenceCache(data.symbol, data.intelligence);
    if (data.assetType) {
      rememberAssetType(data.symbol, data.assetType);
    }
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
