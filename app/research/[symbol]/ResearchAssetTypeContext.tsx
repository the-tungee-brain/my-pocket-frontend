"use client";

import { createContext, useContext } from "react";
import { useResearchAssetType } from "@/app/hooks/useResearchAssetType";
import type { AssetType } from "@/app/types/research";

type ResearchAssetTypeContextValue = {
  assetType: AssetType | null;
  isLoading: boolean;
  isEtf: boolean;
};

const ResearchAssetTypeContext = createContext<ResearchAssetTypeContextValue>({
  assetType: null,
  isLoading: true,
  isEtf: false,
});

type Props = {
  symbol: string;
  accessToken?: string | null;
  children: React.ReactNode;
};

export function ResearchAssetTypeProvider({
  symbol,
  accessToken,
  children,
}: Props) {
  const { assetType, isLoading, isEtf } = useResearchAssetType(symbol, {
    accessToken,
  });

  return (
    <ResearchAssetTypeContext.Provider
      value={{ assetType, isLoading, isEtf }}
    >
      {children}
    </ResearchAssetTypeContext.Provider>
  );
}

export function useResearchAssetTypeContext() {
  return useContext(ResearchAssetTypeContext);
}
