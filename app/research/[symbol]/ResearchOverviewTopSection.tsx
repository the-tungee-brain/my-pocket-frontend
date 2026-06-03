"use client";

import { useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSymbolIntelligence } from "@/app/hooks/useSymbolIntelligence";
import { useAppChatContext, usePortfolioContext } from "@/app/contextSelectors";
import {
  IntelligenceRecentEventsPanel,
  SymbolIntelligencePanel,
} from "@/components/SymbolIntelligencePanel";
import { PageSplit } from "@/components/PageShell";
import type { IntelligenceSignal } from "@/app/types/intelligence";
import { symbolChatKey } from "@/lib/chatKeys";
import { pageSectionClass, pageOverviewAsideClass, pageOverviewMainClass, pageOverviewSplitClass } from "@/lib/pageLayout";
import { PerformanceSnapshot } from "./PerformanceSnapshot";
import { ResearchStockChart } from "./ResearchStockChart";
import { useResearchAssetTypeContext } from "./ResearchAssetTypeContext";
import { EtfHoldingsOverviewPreview } from "./EtfHoldingsPageContent";
import { EtfFundsOverview } from "./EtfFundsOverview";
import { StreetAnalysisOverview } from "./StreetAnalysisOverview";

type Props = {
  symbol: string;
};

export function ResearchOverviewTopSection({ symbol }: Props) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const { positionMap } = usePortfolioContext();
  const { sendQuickAction } = useAppChatContext();
  const symbolUpper = symbol.toUpperCase();
  const chatKey = symbolChatKey(symbolUpper) ?? symbolUpper;

  const { isEtf } = useResearchAssetTypeContext();

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
    <div className="space-y-6">
      <PageSplit
        splitClassName={pageOverviewSplitClass}
        mainClassName={pageOverviewMainClass}
        asideClassName={pageOverviewAsideClass}
        main={
          <>
            <ResearchStockChart
              symbol={symbol}
              chartIntelligence={intelligence?.patternIntelligence?.chartIntelligence}
            />
            <SymbolIntelligencePanel
              intelligence={intelligence}
              loading={loading}
              error={error}
              onRefresh={refetch}
              onRunSignal={handleRunSignal}
              onGoDeeper={handleGoDeeper}
              actionContext="research"
              researchBasePath="/research"
              isEtf={isEtf}
              hideRecentEvents
              hidePatternForecast
              className={pageSectionClass}
            />
          </>
        }
        aside={
          <>
            {isEtf ? (
              <>
                <EtfFundsOverview symbol={symbol} className={pageSectionClass} />
                <EtfHoldingsOverviewPreview
                  symbol={symbol}
                  stacked
                  className={pageSectionClass}
                />
              </>
            ) : null}
            {!isEtf ? (
              <StreetAnalysisOverview symbol={symbol} className={pageSectionClass} />
            ) : null}
            <PerformanceSnapshot symbol={symbol} className={pageSectionClass} />
            <IntelligenceRecentEventsPanel
              className={pageSectionClass}
              timeline={intelligence?.eventTimeline ?? []}
              loading={loading}
              limit={6}
            />
          </>
        }
      />
    </div>
  );
}
