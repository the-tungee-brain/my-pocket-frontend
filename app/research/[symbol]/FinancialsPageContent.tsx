"use client";

import { useState } from "react";
import { BarChart3, LineChart, ScrollText, Shield } from "lucide-react";
import { useSession } from "next-auth/react";
import { useFundamentals } from "@/app/hooks/useFundamentals";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
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
  const [period, setPeriod] = useState<SecPeriod>("annual");
  const { fundamentals, isLoading, error } = useFundamentals(symbol, {
    accessToken: session?.accessToken,
  });

  const yfinanceSnapshot =
    period === "quarterly"
      ? fundamentals?.quarterlyFinancials
      : fundamentals?.annualFinancials;

  return (
    <div className="space-y-4">
      {error && <ErrorBanner message={error} />}

      <div className="flex justify-end px-1">
        <SecPeriodToggle period={period} onChange={setPeriod} />
      </div>

      <ResearchSectionCard
        title="Financial strength"
        description="Rule-based read on growth, margins, cash flow, and leverage"
        icon={Shield}
      >
        <FinancialStrengthSection
          strength={fundamentals?.strength}
          isLoading={isLoading}
        />
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

      {fundamentals?.overviewNote && (
        <ResearchSectionCard
          title="Fundamental overview"
          description="AI narrative from SEC filings, statements, and market data"
          icon={BarChart3}
        >
          <p className="text-sm leading-relaxed text-foreground">
            {fundamentals.overviewNote}
          </p>
        </ResearchSectionCard>
      )}
    </div>
  );
}
