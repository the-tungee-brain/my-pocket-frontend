"use client";

import { useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSymbolIntelligence } from "@/app/hooks/useSymbolIntelligence";
import { usePositionsContext } from "@/app/Providers";
import {
  IntelligenceRecentEventsPanel,
  SymbolIntelligencePanel,
} from "@/components/SymbolIntelligencePanel";
import { PageSplit } from "@/components/PageShell";
import type { IntelligenceSignal } from "@/app/types/intelligence";
import { symbolChatKey } from "@/lib/chatKeys";
import { pageSectionClass } from "@/lib/pageLayout";
import { PerformanceSnapshot } from "./PerformanceSnapshot";
import { ResearchStockChart } from "./ResearchStockChart";

type Props = {
  symbol: string;
};

export function ResearchOverviewTopSection({ symbol }: Props) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const { positionMap, sendQuickAction } = usePositionsContext();
  const symbolUpper = symbol.toUpperCase();
  const chatKey = symbolChatKey(symbolUpper) ?? symbolUpper;

  const { intelligence, loading, error, refetch } = useSymbolIntelligence(
    symbol,
    { accessToken },
  );

  const handleRunSignal = useCallback(
    (_signal: IntelligenceSignal, actionId: string) => {
      void sendQuickAction({
        activeChatKey: chatKey,
        selectedView: "research",
        selectedSymbol: symbolUpper,
        positionsForSelectedSymbol: positionMap[symbolUpper] ?? [],
        actionId,
      });
    },
    [chatKey, symbolUpper, sendQuickAction, positionMap],
  );

  const handleGoDeeper = useCallback(() => {
    void sendQuickAction({
      activeChatKey: chatKey,
      selectedView: "research",
      selectedSymbol: symbolUpper,
      positionsForSelectedSymbol: positionMap[symbolUpper] ?? [],
      actionId: "daily-summary",
    });
  }, [chatKey, symbolUpper, sendQuickAction, positionMap]);

  return (
    <PageSplit
      main={
        <>
          <ResearchStockChart symbol={symbol} />
          <SymbolIntelligencePanel
            intelligence={intelligence}
            loading={loading}
            error={error}
            onRefresh={refetch}
            onRunSignal={handleRunSignal}
            onGoDeeper={handleGoDeeper}
            actionContext="research"
            researchBasePath="/research"
            hideRecentEvents
            optionsMode="summary"
            className={pageSectionClass}
          />
        </>
      }
      aside={
        <>
          <PerformanceSnapshot symbol={symbol} />
          <IntelligenceRecentEventsPanel
            className={pageSectionClass}
            timeline={intelligence?.eventTimeline ?? []}
            loading={loading}
            limit={6}
          />
        </>
      }
    />
  );
}
