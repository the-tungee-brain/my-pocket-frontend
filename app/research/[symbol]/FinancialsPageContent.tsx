"use client";

import { useMemo, useState } from "react";
import { LineChart, ScrollText, Shield } from "lucide-react";
import { useSession } from "next-auth/react";
import { useFundamentals } from "@/app/hooks/useFundamentals";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import {
  ResearchScrollSpy,
  ResearchScrollSpySection,
} from "@/components/ResearchScrollSpy";
import {
  buildFinancialRisks,
  buildFinancialStrengths,
  pickFinancialKeyMetrics,
} from "@/lib/financialsPresentation";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { SecPeriodToggle } from "./SecPeriodToggle";
import type { SecPeriod } from "@/lib/secUtils";
import { FinancialStrengthSection } from "./FinancialStrengthSection";
import { YFinanceStatementsSection } from "./YFinanceStatementsSection";
import { KeyMetricsGrid, KeyMetricsGridSkeleton } from "./KeyMetricsGrid";
import { FinancialBulletList } from "./FinancialBulletList";
import { SecFilingsRecentSection } from "./SecFilingsRecentSection";
import { appSectionLabelClass } from "@/lib/appUi";

type FinancialsPageContentProps = {
  symbol: string;
};

export function FinancialsPageContent({ symbol }: FinancialsPageContentProps) {
  const { data: session } = useSession();
  const [period, setPeriod] = useState<SecPeriod>("annual");
  const { fundamentals, isLoading, error } = useFundamentals(symbol, {
    accessToken: session?.accessToken,
    includeAiOverview: false,
    includeStreetAnalysis: false,
  });

  const isInitialLoading = isLoading && !fundamentals;

  const yfinanceSnapshot =
    period === "quarterly"
      ? fundamentals?.quarterlyFinancials
      : fundamentals?.annualFinancials;

  const keyMetrics = useMemo(() => {
    const fromStrength = fundamentals?.strength?.keyMetrics;
    if (fromStrength?.length) {
      return fromStrength;
    }
    return pickFinancialKeyMetrics(fundamentals?.metrics ?? []);
  }, [fundamentals?.strength?.keyMetrics, fundamentals?.metrics]);

  const financialStrengths = useMemo(
    () =>
      buildFinancialStrengths(
        fundamentals?.strength,
        fundamentals?.overview,
      ),
    [fundamentals?.strength, fundamentals?.overview],
  );

  const financialRisks = useMemo(
    () =>
      buildFinancialRisks(fundamentals?.strength, fundamentals?.overview),
    [fundamentals?.strength, fundamentals?.overview],
  );

  return (
    <ResearchScrollSpy className="app-stack">
      {error && <ErrorBanner message={error} />}

      <ResearchScrollSpySection id="financial-overview" label="Overview">
        <ResearchSectionCard
          title="Financial overview"
          description="Financial health score, key metrics, strengths, and risks"
          icon={Shield}
        >
          <div className="space-y-6">
            <FinancialStrengthSection
              strength={fundamentals?.strength}
              isLoading={isInitialLoading}
            />

            <section>
              <h3 className={appSectionLabelClass}>Key metrics</h3>
              <div className="mt-2">
                {isInitialLoading ? (
                  <KeyMetricsGridSkeleton />
                ) : keyMetrics.length ? (
                  <KeyMetricsGrid metrics={keyMetrics} />
                ) : (
                  <p className="text-sm text-muted">Metrics unavailable.</p>
                )}
              </div>
            </section>

            <FinancialBulletList
              title="Financial strengths"
              items={financialStrengths}
            />
            <FinancialBulletList
              title="Financial risks"
              items={financialRisks}
              variant="risk"
            />
          </div>
        </ResearchSectionCard>
      </ResearchScrollSpySection>

      <ResearchScrollSpySection id="financial-statements" label="Statements">
        <ResearchSectionCard
          title="Financial statements"
          description="Income, balance sheet, and cash flow"
          icon={LineChart}
        >
          <div className="mb-3 flex justify-end">
            <SecPeriodToggle period={period} onChange={setPeriod} />
          </div>
          <YFinanceStatementsSection
            snapshot={yfinanceSnapshot}
            isLoading={isInitialLoading}
          />
        </ResearchSectionCard>
      </ResearchScrollSpySection>

      <ResearchScrollSpySection id="sec-filings" label="Filings">
        <ResearchSectionCard
          title="Recent SEC filings"
          description="Latest 10-Q, 10-K, and 8-K"
          icon={ScrollText}
        >
          <SecFilingsRecentSection symbol={symbol} />
        </ResearchSectionCard>
      </ResearchScrollSpySection>
    </ResearchScrollSpy>
  );
}
