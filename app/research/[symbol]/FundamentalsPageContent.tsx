"use client";

import { BarChart3, FileSpreadsheet, Landmark } from "lucide-react";
import { useSession } from "next-auth/react";
import { useFundamentals } from "@/app/hooks/useFundamentals";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { PageSplit } from "@/components/PageShell";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { KeyMetricsGrid, KeyMetricsGridSkeleton } from "./KeyMetricsGrid";
import { SecCompanyBadge } from "./SecCompanyBadge";

type FundamentalsPageContentProps = {
  symbol: string;
};

function OverviewSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-4 w-full animate-pulse rounded bg-muted-bg" />
      <div className="h-4 w-5/6 animate-pulse rounded bg-muted-bg" />
      <div className="h-4 w-4/6 animate-pulse rounded bg-muted-bg" />
    </div>
  );
}

export function FundamentalsPageContent({ symbol }: FundamentalsPageContentProps) {
  const { data: session } = useSession();
  const { fundamentals, isLoading, error } = useFundamentals(symbol, {
    accessToken: session?.accessToken,
  });

  return (
    <div className="space-y-4">
      {error && <ErrorBanner message={error} />}

      <PageSplit
        main={
          <>
            <ResearchSectionCard
              title="Fundamental overview"
              description="AI-generated snapshot from SEC filings and market data"
              icon={FileSpreadsheet}
            >
              {isLoading ? (
                <OverviewSkeleton />
              ) : fundamentals?.overviewNote ? (
                <p className="text-sm leading-relaxed text-foreground">
                  {fundamentals.overviewNote}
                </p>
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

            <ResearchSectionCard
              title="Key metrics"
              description="Valuation, profitability, and balance sheet highlights"
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
          </>
        }
        aside={
          <ResearchSectionCard
            title="SEC company profile"
            description="Official registrant details from EDGAR"
            icon={Landmark}
          >
            <SecCompanyBadge symbol={symbol} />
          </ResearchSectionCard>
        }
      />
    </div>
  );
}
