"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";
import type { ResearchOverviewBundle } from "@/app/types/researchOverview";

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
  void symbol;
  void accessToken;

  return (
    <ResearchOverviewContext.Provider value={null}>
      <ResearchOverviewLoadingContext.Provider value={false}>
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

/** Overview data is an optional cache seed; sections fetch independently. */
export function useOverviewBundleGate(symbol: string | null | undefined) {
  const bundle = useResearchOverviewBundle();
  const key = symbol?.toUpperCase().trim() ?? "";

  return {
    bundle: key && bundle?.symbol === key ? bundle : null,
    waitForBundle: false,
  };
}
