"use client";

import { useState } from "react";
import { BarChart3, LineChart, ScrollText, Shield } from "lucide-react";
import { useSession } from "next-auth/react";
import { useAccountPlan } from "@/app/hooks/useAccountPlan";
import { useFundamentals } from "@/app/hooks/useFundamentals";
import { ProFeatureGate } from "@/components/ProFeatureGate";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { hasProFeature } from "@/lib/planFeatures";
import { PageSplit } from "@/components/PageShell";
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
  const { isPaid, plan } = useAccountPlan(session?.accessToken);
  const financialStrengthAllowed = hasProFeature(
    isPaid,
    "financialStrength",
    plan,
  );
  const [period, setPeriod] = useState<SecPeriod>("annual");
  const { fundamentals, isLoading, error } = useFundamentals(symbol, {
    accessToken: session?.accessToken,
    proFinancialAnalysis: financialStrengthAllowed,
  });

  const yfinanceSnapshot =
    period === "quarterly"
      ? fundamentals?.quarterlyFinancials
      : fundamentals?.annualFinancials;

  return (
    <div className="app-stack">
      {error && <ErrorBanner message={error} />}

      <div className="flex justify-end px-1">
        <SecPeriodToggle period={period} onChange={setPeriod} />
      </div>

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
            isLoading={isLoading && financialStrengthAllowed}
          />
        </ProFeatureGate>
      </ResearchSectionCard>

      <PageSplit
        main={
          <>
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

            <ResearchSectionCard
              title="SEC financial trends"
              description="Revenue, earnings, and cash flow from filed statements"
              icon={LineChart}
            >
              <SecFinancialsTrendSection symbol={symbol} period={period} />
            </ResearchSectionCard>
          </>
        }
        aside={
          <>
            <ResearchSectionCard
              title="Key metrics"
              description="Valuation, profitability, and balance sheet highlights"
              icon={BarChart3}
            >
              {isLoading ? (
                <KeyMetricsGridSkeleton />
              ) : fundamentals?.metrics.length ? (
                <KeyMetricsGrid metrics={fundamentals.metrics} />
              ) : (
                <p className="text-sm text-muted">Metrics unavailable.</p>
              )}
            </ResearchSectionCard>

            <ResearchSectionCard
              title="Profitability & returns"
              description="Margins, ROE, free cash flow, and year-over-year growth (SEC)"
              icon={LineChart}
            >
              <SecRatiosSection symbol={symbol} period={period} />
            </ResearchSectionCard>

            <ResearchSectionCard
              title="SEC filings"
              description="Recent 10-K, 10-Q, and other submitted documents"
              icon={ScrollText}
            >
              <SecFilingsSection symbol={symbol} />
            </ResearchSectionCard>
          </>
        }
      />
    </div>
  );
}
