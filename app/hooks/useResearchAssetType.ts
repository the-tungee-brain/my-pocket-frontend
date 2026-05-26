"use client";

import { useEffect, useState } from "react";
import type { AssetType } from "@/app/types/research";
import {
  fetchAssetType,
  getCachedAssetType,
  isEtfAssetType,
} from "@/lib/researchAssetType";

type UseResearchAssetTypeOptions = {
  accessToken?: string | null;
};

export function useResearchAssetType(
  symbol: string | null,
  { accessToken }: UseResearchAssetTypeOptions = {},
) {
  const [assetType, setAssetType] = useState<AssetType | null>(() => {
    if (!symbol) return null;
    const cached = getCachedAssetType(symbol);
    return cached === undefined ? null : cached;
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (!symbol) return false;
    return getCachedAssetType(symbol) === undefined;
  });

  useEffect(() => {
    const key = symbol?.trim().toUpperCase();
    if (!key) {
      setAssetType(null);
      setIsLoading(false);
      return;
    }

    const cached = getCachedAssetType(key);
    if (cached !== undefined) {
      setAssetType(cached);
      setIsLoading(false);
      return;
    }

    if (!accessToken) {
      setAssetType(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      const resolved = await fetchAssetType(key!, accessToken!);
      if (cancelled) return;
      setAssetType(resolved);
      setIsLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [symbol, accessToken]);

  return {
    assetType,
    isLoading,
    isEtf: isEtfAssetType(assetType),
  };
}
