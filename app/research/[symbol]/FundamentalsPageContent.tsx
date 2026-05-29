"use client";

import { BarChart3, FileSpreadsheet, Landmark, PieChart, Target, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import { useFundamentals } from "@/app/hooks/useFundamentals";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { PageSplit } from "@/components/PageShell";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { KeyMetricsGrid, KeyMetricsGridSkeleton } from "./KeyMetricsGrid";
import { SecCompanyBadge } from "./SecCompanyBadge";
import { useResearchAssetTypeContext } from "./ResearchAssetTypeContext";
import {
  FundamentalOverviewSection,
  FundamentalOverviewSkeleton,
} from "./FundamentalOverviewSection";
import { StreetAnalysisSection } from "./StreetAnalysisSection";
import {
  hasStreetOwnership,
  StreetOwnershipSection,
} from "./StreetOwnershipSection";
import { EtfFundsSection, hasEtfFunds } from "./EtfFundsSection";

type FundamentalsPageContentProps = {
  symbol: string;
};

export function FundamentalsPageContent({
  symbol,
}: FundamentalsPageContentProps) {
  const { data: session } = useSession();
  const { isEtf } = useResearchAssetTypeContext();
  const { fundamentals, isLoading, error } = useFundamentals(symbol, {
    accessToken: session?.accessToken,
  });

  const keyMetricsCard = (
    <ResearchSectionCard
      title={isEtf ? "Fund metrics" : "Key metrics"}
      description={
        isEtf
          ? "Expense ratio, dividend yield, and other ETF-specific metrics"
          : "Valuation, profitability, and balance sheet highlights"
      }
      icon={BarChart3}
    >
      {isLoading ? (
        <KeyMetricsGridSkeleton />
      ) : fundamentals ? (
        <KeyMetricsGrid metrics={fundamentals.metrics} />
      ) : (
        <EmptyState
          icon={BarChart3}
          title="Metrics unavailable"
          description="Fundamental metrics aren't available for this symbol right now."
          variant="solid"
          className="py-4"
        />
      )}
    </ResearchSectionCard>
  );

  const ownershipCard =
    isLoading || hasStreetOwnership(fundamentals?.streetAnalysis) ? (
      <ResearchSectionCard
        title="Ownership & insiders"
        description="Institutional holders and insider transaction history"
        icon={Users}
      >
        <StreetOwnershipSection
          ownership={fundamentals?.streetAnalysis?.ownership}
          dataAsOf={fundamentals?.streetAnalysis?.dataAsOf}
          isLoading={isLoading}
        />
      </ResearchSectionCard>
    ) : null;

  return (
    <div className="app-stack">
      {error && <ErrorBanner message={error} />}

      <PageSplit
        main={
          <>
            <ResearchSectionCard
              title={isEtf ? "Fund overview" : "Fundamental overview"}
              description={
                isEtf
                  ? "AI-generated snapshot focused on cost, yield, and composition"
                  : "AI-generated snapshot from SEC filings and market data"
              }
              icon={FileSpreadsheet}
            >
              {isLoading ? (
                <FundamentalOverviewSkeleton />
              ) : fundamentals?.overview || fundamentals?.overviewNote ? (
                <FundamentalOverviewSection
                  overview={fundamentals.overview}
                  fallbackNote={fundamentals.overviewNote}
                  isEtf={isEtf}
                />
              ) : (
                <EmptyState
                  icon={FileSpreadsheet}
                  title="Overview unavailable"
                  description="An AI overview isn't available for this symbol right now."
                  variant="solid"
                  className="py-4"
                />
              )}
            </ResearchSectionCard>

            {isEtf ? keyMetricsCard : ownershipCard}
          </>
        }
        aside={
          isEtf ? (
            (isLoading || hasEtfFunds(fundamentals?.etfFunds)) && (
              <ResearchSectionCard
                title="Fund profile"
                description="Composition, sectors, and cost from Yahoo Finance"
                icon={PieChart}
              >
                <EtfFundsSection
                  funds={fundamentals?.etfFunds}
                  isLoading={isLoading}
                />
              </ResearchSectionCard>
            )
          ) : (
            <>
              <ResearchSectionCard
                title="Wall Street analysis"
                description="Analyst ratings, targets, and estimates"
                icon={Target}
              >
                <StreetAnalysisSection
                  street={fundamentals?.streetAnalysis}
                  isLoading={isLoading}
                />
              </ResearchSectionCard>
              {keyMetricsCard}
              <ResearchSectionCard
                title="SEC company profile"
                description="Official registrant details from EDGAR"
                icon={Landmark}
              >
                <SecCompanyBadge symbol={symbol} />
              </ResearchSectionCard>
            </>
          )
        }
      />
    </div>
  );
}
