"use client";

import { useSession } from "next-auth/react";
import { BarChart3 } from "lucide-react";
import { IntelligenceRecentEventsPanel } from "@/components/SymbolIntelligencePanel";
import { PageSplit } from "@/components/PageShell";
import {
  pageSectionClass,
  pageOverviewAsideClass,
  pageOverviewMainClass,
  pageOverviewSplitClass,
} from "@/lib/pageLayout";
import { ResearchPatternOverviewSections } from "@/components/research/ResearchPatternOverviewSections";
import { PerformanceSnapshot } from "./PerformanceSnapshot";
import { ResearchStockChart } from "./ResearchStockChart";
import { useResearchAssetTypeContext } from "./ResearchAssetTypeContext";
import { EtfHoldingsOverviewPreview } from "./EtfHoldingsPageContent";
import { EtfFundsOverview } from "./EtfFundsOverview";
import { StreetAnalysisOverview } from "./StreetAnalysisOverview";
import { useResearchSymbolIntelligence } from "./ResearchSymbolIntelligenceContext";
import { useResearchEvents } from "@/app/hooks/useResearchEvents";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { TickerKeyStats } from "@/components/TickerKeyStats";
import { TradeDecisionPanel } from "@/components/TradeDecisionPanel";
import { TradingBiasCard } from "@/components/research/TradingBiasCard";

type Props = {
  symbol: string;
};

export function ResearchOverviewTopSection({ symbol }: Props) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const { isEtf } = useResearchAssetTypeContext();

  const symbolIntelligence = useResearchSymbolIntelligence();
  const intelligence = symbolIntelligence?.intelligence ?? null;
  const loading = symbolIntelligence?.loading ?? false;
  const researchEvents = useResearchEvents(symbol, accessToken);
  const intelligenceTimeline = intelligence?.eventTimeline ?? [];
  const recentEventsTimeline = researchEvents.events.length
    ? researchEvents.events
    : intelligenceTimeline;
  const recentEventsLoading =
    researchEvents.isLoading && recentEventsTimeline.length === 0;
  const recentEventsError =
    recentEventsTimeline.length === 0 ? researchEvents.error : null;

  return (
    <div className="space-y-6">
      <PageSplit
        splitClassName={pageOverviewSplitClass}
        mainClassName={pageOverviewMainClass}
        asideClassName={pageOverviewAsideClass}
        main={
          <>
            {!isEtf ? (
              <>
                <TradingBiasCard
                  symbol={symbol}
                  accessToken={accessToken}
                  className={pageSectionClass}
                />
                <TradeDecisionPanel
                  symbol={symbol}
                  accessToken={accessToken}
                  compact
                  className={pageSectionClass}
                />
              </>
            ) : null}
            <ResearchStockChart
              symbol={symbol}
              chartIntelligence={
                intelligence?.patternIntelligence?.chartIntelligence
              }
              autoSwitchToChartIntelligence={false}
            />
            <ResearchPatternOverviewSections
              symbol={symbol}
              intelligence={intelligence}
              loading={loading}
              mode="summary"
              className={pageSectionClass}
            />
            <ResearchSectionCard
              title="Key stats"
              description="Core market snapshot"
              icon={BarChart3}
              className={pageSectionClass}
            >
              <TickerKeyStats symbol={symbol} />
            </ResearchSectionCard>
          </>
        }
        aside={
          <>
            {isEtf ? (
              <>
                <EtfFundsOverview
                  symbol={symbol}
                  className={pageSectionClass}
                />
                <EtfHoldingsOverviewPreview
                  symbol={symbol}
                  stacked
                  className={pageSectionClass}
                />
              </>
            ) : null}
            {!isEtf ? (
              <StreetAnalysisOverview
                symbol={symbol}
                className={pageSectionClass}
              />
            ) : null}
            <PerformanceSnapshot symbol={symbol} className={pageSectionClass} />
            <IntelligenceRecentEventsPanel
              className={pageSectionClass}
              timeline={recentEventsTimeline}
              loading={recentEventsLoading}
              error={recentEventsError}
              limit={3}
            />
          </>
        }
      />
    </div>
  );
}
