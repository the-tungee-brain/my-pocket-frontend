"use client";

import { useCallback } from "react";
import { useSession } from "next-auth/react";
import { Target } from "lucide-react";
import { useAppChatContext, usePortfolioContext } from "@/app/contextSelectors";
import { useStreetAnalysis } from "@/app/hooks/useStreetAnalysis";
import type { IntelligenceSignal } from "@/app/types/intelligence";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { SymbolIntelligencePanel } from "@/components/SymbolIntelligencePanel";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { appStackClass } from "@/lib/appUi";
import { symbolChatKey } from "@/lib/chatKeys";
import { symbolHubPath } from "@/lib/symbolRoutes";
import { pageSectionClass } from "@/lib/pageLayout";
import { ResearchPatternOverviewSections } from "@/components/research/ResearchPatternOverviewSections";
import { useResearchAssetTypeContext } from "./ResearchAssetTypeContext";
import { useResearchSymbolIntelligence } from "./ResearchSymbolIntelligenceContext";
import { StreetAnalysisSection, StreetAnalysisSkeleton } from "./StreetAnalysisSection";

type Props = {
  symbol: string;
};

export function ResearchAnalysisPageContent({ symbol }: Props) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const { positionMap } = usePortfolioContext();
  const { sendQuickAction } = useAppChatContext();
  const { isEtf } = useResearchAssetTypeContext();
  const symbolUpper = symbol.toUpperCase();
  const chatKey = symbolChatKey(symbolUpper) ?? symbolUpper;
  const symbolIntelligence = useResearchSymbolIntelligence();
  const intelligence = symbolIntelligence?.intelligence ?? null;
  const loading = symbolIntelligence?.loading ?? false;
  const error = symbolIntelligence?.error ?? null;
  const refetch = symbolIntelligence?.refetch;
  const {
    street,
    isLoading: streetLoading,
    error: streetError,
  } = useStreetAnalysis(symbol, {
    accessToken,
    enabled: !isEtf,
  });

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
    <div className={appStackClass}>
      <ResearchPatternOverviewSections
        symbol={symbol}
        intelligence={intelligence}
        loading={loading}
        mode="full"
        className={pageSectionClass}
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

      {!isEtf ? (
        <ResearchSectionCard
          title="Wall Street analysis"
          description="Consensus, targets, estimates, and recent rating actions"
          icon={Target}
          titleHref={symbolHubPath(symbolUpper, "fundamentals")}
          className={pageSectionClass}
        >
          {streetError ? (
            <ErrorBanner message={streetError} />
          ) : streetLoading ? (
            <StreetAnalysisSkeleton />
          ) : (
            <StreetAnalysisSection street={street} />
          )}
        </ResearchSectionCard>
      ) : null}
    </div>
  );
}
