"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { SymbolIntelligence } from "@/app/types/intelligence";

type ResearchSymbolIntelligenceContextValue = {
  intelligence: SymbolIntelligence | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  includeOptions: boolean;
};

const ResearchSymbolIntelligenceContext =
  createContext<ResearchSymbolIntelligenceContextValue | null>(null);

type Props = ResearchSymbolIntelligenceContextValue & {
  children: ReactNode;
};

export function ResearchSymbolIntelligenceProvider({
  children,
  ...value
}: Props) {
  return (
    <ResearchSymbolIntelligenceContext.Provider value={value}>
      {children}
    </ResearchSymbolIntelligenceContext.Provider>
  );
}

export function useResearchSymbolIntelligence() {
  return useContext(ResearchSymbolIntelligenceContext);
}
