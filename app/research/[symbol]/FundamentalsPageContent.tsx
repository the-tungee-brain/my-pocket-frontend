"use client";

import { BarChart3, FileSpreadsheet, Landmark, PieChart, Target, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import { useAccountPlan } from "@/app/hooks/useAccountPlan";
import { useFundamentals } from "@/app/hooks/useFundamentals";
import { ProFeatureGate } from "@/components/ProFeatureGate";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import {
  ResearchScrollSpy,
  ResearchScrollSpySection,
} from "@/components/ResearchScrollSpy";
import { hasProFeature } from "@/lib/planFeatures";
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
  const { isPaid, plan } = useAccountPlan(session?.accessToken);
  const financialStrengthAllowed = hasProFeature(
    isPaid,
    "financialStrength",
    plan,
  );
  const { isEtf } = useResearchAssetTypeContext();
  const { fundamentals, isLoading, error } = useFundamentals(symbol, {
    accessToken: session?.accessToken,
    proFinancialAnalysis: financialStrengthAllowed,
  });

  return (
    <ResearchScrollSpy className="app-stack">
      {error && <ErrorBanner message={error} />}

      <ResearchScrollSpySection id="fundamentals-overview" label="Overview">
        <ResearchSectionCard
          title={isEtf ? "Fund overview" : "Fundamental overview"}
          description={
            financialStrengthAllowed
              ? isEtf
                ? "AI snapshot focused on cost, yield, and composition"
                : "AI read on valuation, strengths, and what to watch in the numbers"
              : "Pro — AI snapshot from SEC filings and market data"
          }
          icon={FileSpreadsheet}
        >
          <ProFeatureGate
            feature="financialStrength"
            allowed={financialStrengthAllowed}
          >
            {isLoading && financialStrengthAllowed ? (
              <FundamentalOverviewSkeleton />
            ) : fundamentals?.overview || fundamentals?.overviewNote ? (
              <FundamentalOverviewSection
                overview={fundamentals.overview}
                fallbackNote={fundamentals.overviewNote}
                isEtf={isEtf}
              />
            ) : financialStrengthAllowed ? (
              <EmptyState
                icon={FileSpreadsheet}
                title="Overview unavailable"
                description="An AI overview isn't available for this symbol right now."
                variant="solid"
                className="py-4"
              />
            ) : null}
          </ProFeatureGate>
        </ResearchSectionCard>
      </ResearchScrollSpySection>

      <ResearchScrollSpySection id="fundamentals-metrics" label="Metrics">
        <ResearchSectionCard
          title={isEtf ? "Fund metrics" : "Key metrics"}
          description={
            isEtf
              ? "Expense ratio, dividend yield, and other fund-specific figures"
              : "Valuation, profitability, growth, and balance sheet highlights"
          }
          icon={BarChart3}
        >
          {isLoading ? (
            <KeyMetricsGridSkeleton grouped={!isEtf} />
          ) : fundamentals ? (
            <KeyMetricsGrid metrics={fundamentals.metrics} grouped={!isEtf} />
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
      </ResearchScrollSpySection>

      {isEtf ? (
        isLoading || hasEtfFunds(fundamentals?.etfFunds) ? (
          <ResearchScrollSpySection id="fundamentals-profile" label="Profile">
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
          </ResearchScrollSpySection>
        ) : null
      ) : (
        <>
          <ResearchScrollSpySection id="fundamentals-street" label="Street">
            <ResearchSectionCard
              title="Wall Street analysis"
              description="Analyst consensus, price targets, and estimate trends"
              icon={Target}
            >
              <StreetAnalysisSection
                street={fundamentals?.streetAnalysis}
                isLoading={isLoading}
              />
            </ResearchSectionCard>
          </ResearchScrollSpySection>

          {isLoading || hasStreetOwnership(fundamentals?.streetAnalysis) ? (
            <ResearchScrollSpySection id="fundamentals-ownership" label="Ownership">
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
            </ResearchScrollSpySection>
          ) : null}

          <ResearchScrollSpySection id="fundamentals-sec" label="SEC">
            <ResearchSectionCard
              title="SEC company profile"
              description="Official registrant details from EDGAR"
              icon={Landmark}
            >
              <SecCompanyBadge symbol={symbol} />
            </ResearchSectionCard>
          </ResearchScrollSpySection>
        </>
      )}
    </ResearchScrollSpy>
  );
}
