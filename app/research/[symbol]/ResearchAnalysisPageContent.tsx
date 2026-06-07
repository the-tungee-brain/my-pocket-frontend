"use client";

import { useSession } from "next-auth/react";
import { useResearchSnapshot } from "@/app/hooks/useResearchSnapshot";
import { useStreetAnalysis } from "@/app/hooks/useStreetAnalysis";
import { useTradeDecision } from "@/app/hooks/useTradeDecision";
import { ResearchSection } from "@/components/research/ResearchMemoPrimitives";
import { ResearchPatternOverviewSections } from "@/components/research/ResearchPatternOverviewSections";
import { SymbolIntelligencePanel } from "@/components/SymbolIntelligencePanel";
import { TradeDecisionPanel } from "@/components/TradeDecisionPanel";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { appStackClass } from "@/lib/appUi";
import { pageSectionClass } from "@/lib/pageLayout";
import { useResearchAssetTypeContext } from "./ResearchAssetTypeContext";
import { useResearchSymbolIntelligence } from "./ResearchSymbolIntelligenceContext";
import {
  StreetAnalysisSection,
  StreetAnalysisSkeleton,
} from "./StreetAnalysisSection";

type Props = {
  symbol: string;
};

export function ResearchAnalysisPageContent({ symbol }: Props) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const { isEtf } = useResearchAssetTypeContext();
  const symbolIntelligence = useResearchSymbolIntelligence();
  const intelligence = symbolIntelligence?.intelligence ?? null;
  const loading = symbolIntelligence?.loading ?? false;
  const error = symbolIntelligence?.error ?? null;
  const refetch = symbolIntelligence?.refetch;
  const { snapshot } = useResearchSnapshot(symbol, { accessToken });
  const {
    street,
    isLoading: streetLoading,
    error: streetError,
  } = useStreetAnalysis(symbol, {
    accessToken,
    enabled: !isEtf,
  });
  const {
    decision,
    isLoading: decisionLoading,
    error: decisionError,
  } = useTradeDecision(symbol, {
    accessToken,
    enabled: !isEtf,
  });

  return (
    <div className={appStackClass}>
      <ResearchPatternOverviewSections
        symbol={symbol}
        intelligence={intelligence}
        loading={loading}
        mode="full"
        currentPrice={snapshot?.price}
        className={pageSectionClass}
      />

      {!isEtf ? (
        <TradeDecisionPanel
          symbol={symbol}
          accessToken={accessToken}
          decisionOverride={decision}
          isLoadingOverride={decisionLoading}
          errorOverride={decisionError}
          diagnosticsOnly
          className={pageSectionClass}
        />
      ) : null}

      <SymbolIntelligencePanel
        intelligence={intelligence}
        loading={loading}
        error={error}
        onRefresh={refetch}
        actionContext="research"
        title="Company context"
        description="Company signals, risks, peer context, research thesis, and data quality."
        researchBasePath="/research"
        isEtf={isEtf}
        hideRecentEvents
        hidePatternForecast
        hideNavigationLinks
        className={pageSectionClass}
      />

      {!isEtf ? (
        <ResearchSection
          title="Analyst view"
          subtitle="Consensus view, target range, estimate changes, and recent analyst updates."
          className={pageSectionClass}
        >
          {streetError ? (
            <ErrorBanner message={streetError} />
          ) : streetLoading ? (
            <StreetAnalysisSkeleton />
          ) : (
            <StreetAnalysisSection street={street} />
          )}
        </ResearchSection>
      ) : null}
    </div>
  );
}
