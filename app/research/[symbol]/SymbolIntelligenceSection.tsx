"use client";

import { useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSymbolIntelligence } from "@/app/hooks/useSymbolIntelligence";
import { usePositionsContext } from "@/app/Providers";
import { SymbolIntelligencePanel } from "@/components/SymbolIntelligencePanel";
import type { IntelligenceSignal } from "@/app/types/intelligence";

type Props = {
  symbol: string;
};

export function SymbolIntelligenceSection({ symbol }: Props) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const { positionMap, sendQuickAction } = usePositionsContext();

  const { intelligence, loading, error, refetch } = useSymbolIntelligence(
    symbol,
    { accessToken },
  );

  const handleRunSignal = useCallback(
    (_signal: IntelligenceSignal, actionId: string) => {
      const chatKey = `__RESEARCH_${symbol.toUpperCase()}__`;
      void sendQuickAction({
        activeChatKey: chatKey,
        selectedView: "research",
        selectedSymbol: symbol.toUpperCase(),
        positionsForSelectedSymbol: positionMap[symbol.toUpperCase()] ?? [],
        actionId,
      });
    },
    [symbol, sendQuickAction, positionMap],
  );

  return (
    <SymbolIntelligencePanel
      intelligence={intelligence}
      loading={loading}
      error={error}
      onRefresh={refetch}
      onRunSignal={handleRunSignal}
      actionContext="research"
      researchBasePath="/research"
    />
  );
}
