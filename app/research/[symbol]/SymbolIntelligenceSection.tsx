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
  const { positionMap, sendQuickAction, sendPrompt } = usePositionsContext();
  const symbolUpper = symbol.toUpperCase();

  const { intelligence, loading, error, refetch } = useSymbolIntelligence(
    symbol,
    { accessToken },
  );

  const handleRunSignal = useCallback(
    (_signal: IntelligenceSignal, actionId: string) => {
      const chatKey = `__RESEARCH_${symbolUpper}__`;
      void sendQuickAction({
        activeChatKey: chatKey,
        selectedView: "research",
        selectedSymbol: symbolUpper,
        positionsForSelectedSymbol: positionMap[symbolUpper] ?? [],
        actionId,
      });
    },
    [symbolUpper, sendQuickAction, positionMap],
  );

  const handleAnalyzeOption = useCallback(
    (prompt: string) => {
      void sendPrompt({
        activeChatKey: `__RESEARCH_${symbolUpper}__`,
        selectedView: "research",
        selectedSymbol: symbolUpper,
        positionsForSelectedSymbol: positionMap[symbolUpper] ?? [],
        prompt,
      });
    },
    [symbolUpper, sendPrompt, positionMap],
  );

  const handleGoDeeper = useCallback(() => {
    void sendQuickAction({
      activeChatKey: `__RESEARCH_${symbolUpper}__`,
      selectedView: "research",
      selectedSymbol: symbolUpper,
      positionsForSelectedSymbol: positionMap[symbolUpper] ?? [],
      actionId: "daily-summary",
    });
  }, [symbolUpper, sendQuickAction, positionMap]);

  return (
    <SymbolIntelligencePanel
      intelligence={intelligence}
      loading={loading}
      error={error}
      onRefresh={refetch}
      onRunSignal={handleRunSignal}
      onAnalyzeOption={handleAnalyzeOption}
      onGoDeeper={handleGoDeeper}
      actionContext="research"
      researchBasePath="/research"
    />
  );
}
