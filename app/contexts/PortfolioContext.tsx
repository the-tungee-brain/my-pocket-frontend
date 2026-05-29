"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { PortfolioContextValue } from "@/app/contexts/portfolioContextTypes";

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

type ProviderProps = {
  value: PortfolioContextValue;
  children: ReactNode;
};

export function PortfolioContextProvider({ value, children }: ProviderProps) {
  return (
    <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>
  );
}

export function usePortfolioContext(): PortfolioContextValue {
  const ctx = useContext(PortfolioContext);
  if (!ctx) {
    throw new Error(
      "usePortfolioContext must be used within PortfolioContextProvider",
    );
  }
  return ctx;
}
