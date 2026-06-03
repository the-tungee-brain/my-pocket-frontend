"use client";

import { useCallback, useState } from "react";
import { BarChart3, LineChart, ScrollText, Shield } from "lucide-react";
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
import type { SecPeriod } from "@/lib/secUtils";
import { SecPeriodToggle } from "./SecPeriodToggle";
import { SecRatiosSection } from "./SecRatiosSection";
import { SecFinancialsTrendSection } from "./SecFinancialsTrendSection";
import { SecFilingsSection } from "./SecFilingsSection";
import { FinancialStrengthSection } from "./FinancialStrengthSection";
import { YFinanceStatementsSection } from "./YFinanceStatementsSection";
import { KeyMetricsGrid, KeyMetricsGridSkeleton } from "./KeyMetricsGrid";

type FinancialsPageContentProps = {
  symbol: string;
};

export function FinancialsPageContent({ symbol }: FinancialsPageContentProps) {
  const { data: session } = useSession();
  const { plan } = useAccountPlan(session?.accessToken);
  const financialStrengthAllowed = hasProFeature(plan, "financialStrength");
  const [period, setPeriod] = useState<SecPeriod>("annual");
  const [aiAnalysisRequested, setAiAnalysisRequested] = useState(false);
  const { fundamentals, isLoading, error } = useFundamentals(symbol, {
    accessToken: session?.accessToken,
    proFinancialAnalysis: financialStrengthAllowed,
    includeAiOverview: aiAnalysisRequested && financialStrengthAllowed,
    includeStreetAnalysis: false,
  });

  const isAnalyzingAi =
    aiAnalysisRequested &&
    financialStrengthAllowed &&
    isLoading &&
    !fundamentals?.overview;

  const requestAiAnalysis = useCallback(() => {
    setAiAnalysisRequested(true);
  }, []);

  const yfinanceSnapshot =
    period === "quarterly"
      ? fundamentals?.quarterlyFinancials
      : fundamentals?.annualFinancials;

  return (
    <ResearchScrollSpy className="app-stack">
      {error && <ErrorBanner message={error} />}

      <div className="flex justify-end px-1">
        <SecPeriodToggle period={period} onChange={setPeriod} />
      </div>

      <ResearchScrollSpySection id="financial-strength" label="Strength">
        <ResearchSectionCard
          title="Financial strength"
          description={
            financialStrengthAllowed
              ? "AI-assisted read on growth, margins, cash flow, and leverage"
              : "Pro — score, strengths, risks, and narrative from filings & market data"
          }
          icon={Shield}
        >
          <ProFeatureGate
            feature="financialStrength"
            allowed={financialStrengthAllowed}
          >
            <FinancialStrengthSection
              strength={fundamentals?.strength}
              overview={fundamentals?.overview}
              isLoading={isLoading && !fundamentals}
              aiAnalysisRequested={aiAnalysisRequested}
              isAnalyzingAi={isAnalyzingAi}
              onRequestAiAnalysis={
                financialStrengthAllowed ? requestAiAnalysis : undefined
              }
            />
          </ProFeatureGate>
        </ResearchSectionCard>
      </ResearchScrollSpySection>

      <ResearchScrollSpySection id="financial-statements" label="Statements">
        <ResearchSectionCard
          title="Financial statements"
          description="Income, balance sheet, and cash flow"
          icon={LineChart}
        >
          <YFinanceStatementsSection
            snapshot={yfinanceSnapshot}
            isLoading={isLoading}
          />
        </ResearchSectionCard>
      </ResearchScrollSpySection>

      <ResearchScrollSpySection id="sec-trends" label="SEC trends">
        <ResearchSectionCard
          title="SEC financial trends"
          description="Revenue, earnings, and cash flow from filed statements"
          icon={LineChart}
        >
          <SecFinancialsTrendSection symbol={symbol} period={period} />
        </ResearchSectionCard>
      </ResearchScrollSpySection>

      <ResearchScrollSpySection id="key-metrics" label="Metrics">
        <ResearchSectionCard
          title="Key metrics"
          description="Valuation, profitability, and balance sheet highlights"
          icon={BarChart3}
        >
          {isLoading ? (
            <KeyMetricsGridSkeleton grouped />
          ) : fundamentals?.metrics.length ? (
            <KeyMetricsGrid metrics={fundamentals.metrics} grouped />
          ) : (
            <p className="text-sm text-muted">Metrics unavailable.</p>
          )}
        </ResearchSectionCard>
      </ResearchScrollSpySection>

      <ResearchScrollSpySection id="profitability" label="Returns">
        <ResearchSectionCard
          title="Profitability & returns"
          description="Margins, ROE, free cash flow, and year-over-year growth (SEC)"
          icon={LineChart}
        >
          <SecRatiosSection symbol={symbol} period={period} />
        </ResearchSectionCard>
      </ResearchScrollSpySection>

      <ResearchScrollSpySection id="sec-filings" label="Filings">
        <ResearchSectionCard
          title="SEC filings"
          description="Recent 10-K, 10-Q, and other submitted documents"
          icon={ScrollText}
        >
          <SecFilingsSection symbol={symbol} />
        </ResearchSectionCard>
      </ResearchScrollSpySection>
    </ResearchScrollSpy>
  );
}
