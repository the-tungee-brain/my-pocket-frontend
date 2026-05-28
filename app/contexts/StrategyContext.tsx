"use client";

import { createContext, useContext } from "react";
import { useSession } from "next-auth/react";
import { useStrategyJourney } from "@/app/hooks/useStrategyJourney";

type StrategyContextValue = ReturnType<typeof useStrategyJourney>;

const StrategyContext = createContext<StrategyContextValue | null>(null);

export function StrategyProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const value = useStrategyJourney(accessToken, { enabled: !!accessToken });

  return (
    <StrategyContext.Provider value={value}>{children}</StrategyContext.Provider>
  );
}

export function useStrategyContext(): StrategyContextValue {
  const context = useContext(StrategyContext);
  if (!context) {
    throw new Error("useStrategyContext must be used within StrategyProvider");
  }
  return context;
}
