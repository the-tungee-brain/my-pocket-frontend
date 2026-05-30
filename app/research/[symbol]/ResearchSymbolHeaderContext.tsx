"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { EtfHoldingsContext } from "@/app/types/research";
import {
  fetchResearchSnapshot,
  getCachedResearchSnapshot,
  snapshotMissingKeyStats,
  type ResearchSnapshot,
} from "@/lib/researchSnapshot";
import {
  fetchEtfHoldings,
  getCachedEtfHoldings,
} from "@/lib/etfHoldings";
import { useOverviewBundleGate } from "@/app/research/ResearchOverviewContext";
import { useResearchAssetTypeContext } from "./ResearchAssetTypeContext";

const HEADER_ETF_HOLDINGS_LIMIT = 8;

type ResearchSymbolHeaderContextValue = {
  snapshot: ResearchSnapshot | null;
  etfHoldings: EtfHoldingsContext | null;
  isLoading: boolean;
  error: string | null;
};

const ResearchSymbolHeaderContext =
  createContext<ResearchSymbolHeaderContextValue>({
    snapshot: null,
    etfHoldings: null,
    isLoading: true,
    error: null,
  });

type ProviderProps = {
  symbol: string;
  accessToken?: string | null;
  children: ReactNode;
};

function resolveBundleSnapshot(
  bundleSnapshot: ResearchSnapshot | undefined,
): ResearchSnapshot | null {
  if (!bundleSnapshot || snapshotMissingKeyStats(bundleSnapshot)) {
    return null;
  }
  return bundleSnapshot;
}

export function ResearchSymbolHeaderProvider({
  symbol,
  accessToken,
  children,
}: ProviderProps) {
  const symbolUpper = symbol.trim().toUpperCase();
  const { isEtf } = useResearchAssetTypeContext();
  const { bundle, waitForBundle } = useOverviewBundleGate(symbolUpper);

  const [snapshot, setSnapshot] = useState<ResearchSnapshot | null>(() => {
    const cached = getCachedResearchSnapshot(symbolUpper);
    if (cached) return cached;
    return resolveBundleSnapshot(bundle?.snapshot);
  });
  const [etfHoldings, setEtfHoldings] = useState<EtfHoldingsContext | null>(
    () => {
      if (bundle?.etfHoldings) return bundle.etfHoldings;
      return getCachedEtfHoldings(symbolUpper, HEADER_ETF_HOLDINGS_LIMIT);
    },
  );
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    if (waitForBundle) return true;
    if (getCachedResearchSnapshot(symbolUpper)) return false;
    if (resolveBundleSnapshot(bundle?.snapshot)) return false;
    return Boolean(symbolUpper);
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbolUpper) {
      setSnapshot(null);
      setEtfHoldings(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    if (waitForBundle) {
      setIsLoading(true);
      setError(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      const bundleSnapshot = resolveBundleSnapshot(bundle?.snapshot);
      let nextSnapshot =
        bundleSnapshot ?? getCachedResearchSnapshot(symbolUpper);

      let nextHoldings: EtfHoldingsContext | null = null;
      if (isEtf) {
        nextHoldings =
          bundle?.etfHoldings ??
          getCachedEtfHoldings(symbolUpper, HEADER_ETF_HOLDINGS_LIMIT);
      }

      const needsSnapshot = !nextSnapshot;

      if (needsSnapshot && accessToken) {
        try {
          nextSnapshot = await fetchResearchSnapshot(symbolUpper, accessToken);
        } catch {
          if (cancelled) return;
        }
      }

      if (cancelled) return;

      setSnapshot(nextSnapshot);
      setError(nextSnapshot ? null : "Could not load snapshot for this symbol.");
      setIsLoading(false);

      if (!isEtf) {
        setEtfHoldings(null);
        return;
      }

      if (nextHoldings) {
        setEtfHoldings(nextHoldings);
        return;
      }

      if (!accessToken) {
        setEtfHoldings(null);
        return;
      }

      try {
        const fetchedHoldings = await fetchEtfHoldings(
          symbolUpper,
          accessToken,
          HEADER_ETF_HOLDINGS_LIMIT,
        );
        if (!cancelled) {
          setEtfHoldings(fetchedHoldings);
        }
      } catch {
        if (!cancelled) {
          setEtfHoldings(null);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [symbolUpper, accessToken, bundle, waitForBundle, isEtf]);

  const value = useMemo(
    () => ({
      snapshot,
      etfHoldings,
      isLoading,
      error,
    }),
    [snapshot, etfHoldings, isLoading, error],
  );

  return (
    <ResearchSymbolHeaderContext.Provider value={value}>
      {children}
    </ResearchSymbolHeaderContext.Provider>
  );
}

export function useResearchSymbolHeader() {
  return useContext(ResearchSymbolHeaderContext);
}
