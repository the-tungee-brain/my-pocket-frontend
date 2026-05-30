"use client";

import { createContext, useContext } from "react";
import { useResearchAssetType } from "@/app/hooks/useResearchAssetType";
import type { AssetType } from "@/app/types/research";

type ResearchAssetTypeContextValue = {
  assetType: AssetType | null;
  logoUrl: string | null;
  isLoading: boolean;
  isLogoLoading: boolean;
  isEtf: boolean;
};

const ResearchAssetTypeContext = createContext<ResearchAssetTypeContextValue>({
  assetType: null,
  logoUrl: null,
  isLoading: true,
  isLogoLoading: true,
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
  const { assetType, logoUrl, isLoading, isLogoLoading, isEtf } =
    useResearchAssetType(symbol, {
      accessToken,
    });

  return (
    <ResearchAssetTypeContext.Provider
      value={{ assetType, logoUrl, isLoading, isLogoLoading, isEtf }}
    >
      {children}
    </ResearchAssetTypeContext.Provider>
  );
}

export function useResearchAssetTypeContext() {
  return useContext(ResearchAssetTypeContext);
}
