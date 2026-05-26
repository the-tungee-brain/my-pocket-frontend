"use client";

import { useResearchAssetTypeContext } from "./ResearchAssetTypeContext";

type Props = {
  symbol: string;
  children: React.ReactNode;
};

export function EtfOverviewGate({ children }: Props) {
  const { isEtf, isLoading } = useResearchAssetTypeContext();

  if (isLoading || !isEtf) {
    return null;
  }

  return <>{children}</>;
}
