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
  fetchTickerLogoUrl,
  getCachedAssetType,
  getCachedTickerLogoUrl,
  isEtfAssetType,
  rememberAssetType,
  rememberTickerLogoUrl,
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
  const [logoUrl, setLogoUrl] = useState<string | null>(() => {
    if (!symbolUpper) return null;
    return getCachedTickerLogoUrl(symbolUpper) ?? null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (!symbolUpper) return false;
    return getCachedAssetType(symbolUpper) === undefined;
  });
  const [isLogoLoading, setIsLogoLoading] = useState<boolean>(() => {
    if (!symbolUpper) return false;
    return getCachedTickerLogoUrl(symbolUpper) === undefined;
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

    async function loadAssetType() {
      setIsLoading(true);
      const resolved = await fetchAssetType(symbolUpper!, accessToken!);
      if (cancelled) return;
      setAssetType(resolved);
      setIsLoading(false);
    }

    void loadAssetType();

    return () => {
      cancelled = true;
    };
  }, [symbolUpper, accessToken, overviewBundle]);

  useEffect(() => {
    if (!symbolUpper) {
      setLogoUrl(null);
      setIsLogoLoading(false);
      return;
    }

    const cachedLogo = getCachedTickerLogoUrl(symbolUpper);
    if (cachedLogo) {
      setLogoUrl(cachedLogo);
      setIsLogoLoading(false);
      return;
    }

    if (!accessToken) {
      setLogoUrl(null);
      setIsLogoLoading(true);
      return;
    }

    let cancelled = false;

    async function loadLogoUrl() {
      setIsLogoLoading(true);
      const resolved = await fetchTickerLogoUrl(symbolUpper!, accessToken!);
      if (cancelled) return;
      if (resolved) rememberTickerLogoUrl(symbolUpper!, resolved);
      setLogoUrl(resolved);
      setIsLogoLoading(false);
    }

    void loadLogoUrl();

    return () => {
      cancelled = true;
    };
  }, [symbolUpper, accessToken]);

  const isEtf =
    isEtfAssetType(assetType) ||
    etfHoldings != null ||
    (assetType == null && isEtfAssetType(getCachedAssetType(symbolUpper ?? "")));

  return {
    assetType: isEtf && assetType !== "ETF" ? "ETF" : assetType,
    logoUrl,
    isLoading,
    isLogoLoading,
    isEtf,
  };
}
