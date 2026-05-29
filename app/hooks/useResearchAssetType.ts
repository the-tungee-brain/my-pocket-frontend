"use client";

import { useEffect, useState } from "react";
import type { AssetType } from "@/app/types/research";
import {
  useResearchOverviewBundle,
  useResearchOverviewLoading,
} from "@/app/research/ResearchOverviewContext";
import { useEtfHoldings } from "@/app/hooks/useEtfHoldings";
import {
  fetchAssetType,
  getCachedAssetType,
  isEtfAssetType,
  rememberAssetType,
} from "@/lib/researchAssetType";

type UseResearchAssetTypeOptions = {
  accessToken?: string | null;
};

export function useResearchAssetType(
  symbol: string | null,
  { accessToken }: UseResearchAssetTypeOptions = {},
) {
  const symbolUpper = symbol?.trim().toUpperCase() ?? null;
  const overviewBundle = useResearchOverviewBundle();
  const overviewLoading = useResearchOverviewLoading();

  const [assetType, setAssetType] = useState<AssetType | null>(() => {
    if (
      symbolUpper &&
      overviewBundle?.symbol === symbolUpper &&
      overviewBundle.assetType
    ) {
      return overviewBundle.assetType;
    }
    if (!symbolUpper) return null;
    return getCachedAssetType(symbolUpper) ?? null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (!symbolUpper) return false;
    return getCachedAssetType(symbolUpper) === undefined;
  });

  const bundleResolvesAssetType =
    symbolUpper &&
    overviewBundle?.symbol === symbolUpper &&
    overviewBundle.assetType != null;

  const { holdings: etfHoldings } = useEtfHoldings(symbolUpper, {
    accessToken,
    limit: 1,
    enabled: Boolean(
      symbolUpper &&
        accessToken &&
        !overviewLoading &&
        !bundleResolvesAssetType &&
        !isEtfAssetType(assetType),
    ),
  });

  useEffect(() => {
    if (!symbolUpper) {
      setAssetType(null);
      setIsLoading(false);
      return;
    }

    if (
      overviewBundle?.symbol === symbolUpper &&
      overviewBundle.assetType
    ) {
      rememberAssetType(symbolUpper, overviewBundle.assetType);
      setAssetType(overviewBundle.assetType);
      setIsLoading(false);
      return;
    }

    const cached = getCachedAssetType(symbolUpper);
    if (cached) {
      setAssetType(cached);
      setIsLoading(false);
      return;
    }

    if (!accessToken) {
      setAssetType(null);
      setIsLoading(true);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      const resolved = await fetchAssetType(symbolUpper!, accessToken!);
      if (cancelled) return;
      setAssetType(resolved);
      setIsLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [symbolUpper, accessToken, overviewBundle]);

  const isEtf =
    isEtfAssetType(assetType) ||
    etfHoldings != null ||
    (assetType == null && isEtfAssetType(getCachedAssetType(symbolUpper ?? "")));

  return {
    assetType: isEtf && assetType !== "ETF" ? "ETF" : assetType,
    isLoading,
    isEtf,
  };
}
