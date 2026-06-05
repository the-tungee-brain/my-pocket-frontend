"use client";

import { useEffect, useState } from "react";
import type { AssetType } from "@/app/types/research";
import { useResearchOverviewBundle } from "@/app/research/ResearchOverviewContext";
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

    const requestKey = symbolUpper;
    const requestToken = accessToken;
    let cancelled = false;

    async function loadAssetType() {
      setIsLoading(true);
      const resolved = await fetchAssetType(requestKey, requestToken);
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

    const requestKey = symbolUpper;
    const requestToken = accessToken;
    let cancelled = false;

    async function loadLogoUrl() {
      setIsLogoLoading(true);
      const resolved = await fetchTickerLogoUrl(requestKey, requestToken);
      if (cancelled) return;
      if (resolved) rememberTickerLogoUrl(requestKey, resolved);
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
    (assetType == null && isEtfAssetType(getCachedAssetType(symbolUpper ?? "")));

  return {
    assetType: isEtf && assetType !== "ETF" ? "ETF" : assetType,
    logoUrl,
    isLoading,
    isLogoLoading,
    isEtf,
  };
}
