"use client";

import { BarChart3, FileSpreadsheet, Landmark, PieChart, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import { useFundamentals } from "@/app/hooks/useFundamentals";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import {
  ResearchScrollSpy,
  ResearchScrollSpySection,
} from "@/components/ResearchScrollSpy";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useResearchAssetTypeContext } from "./ResearchAssetTypeContext";
import { InvestmentThesisSection } from "./InvestmentThesisSection";
import { ValuationConclusionSection } from "./ValuationConclusionSection";
import { ValuationSignalsSection } from "./ValuationSignalsSection";
import { ValuationSummarySection } from "./ValuationSummarySection";
import {
  hasStreetOwnership,
  StreetOwnershipSection,
} from "./StreetOwnershipSection";
import { EtfFundsSection, hasEtfFunds } from "./EtfFundsSection";
import { SecCompanyProfileSection } from "./SecCompanyProfileSection";

type FundamentalsPageContentProps = {
  symbol: string;
};

function FundamentalsOverviewSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-24 rounded-lg" />
      </div>
    </div>
  );
}

export function FundamentalsPageContent({
  symbol,
}: FundamentalsPageContentProps) {
  const { data: session } = useSession();
  const { isEtf } = useResearchAssetTypeContext();
  const { fundamentals, isLoading, error } = useFundamentals(symbol, {
    accessToken: session?.accessToken,
    includeAiOverview: false,
    includeStreetAnalysis: !isEtf,
  });

  const overview = fundamentals?.overview;
  const hasThesis =
    (overview?.investmentThesis?.bullCase?.length ?? 0) > 0 ||
    (overview?.investmentThesis?.bearCase?.length ?? 0) > 0;

  return (
    <ResearchScrollSpy className="app-stack">
      {error && <ErrorBanner message={error} />}

      <ResearchScrollSpySection id="fundamentals-valuation" label="Valuation">
        <ResearchSectionCard
          title={isEtf ? "Fund valuation" : "Valuation"}
          description={
            isEtf
              ? "Cost, yield, and what the basket prices in"
              : "What expectations are priced in, and what must happen for a return from here?"
          }
          icon={FileSpreadsheet}
        >
          {isLoading ? (
            <FundamentalsOverviewSkeleton />
          ) : overview ? (
            <div className="space-y-6">
              {overview.valuationConclusion ? (
                <section>
                  <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
                    Valuation conclusion
                  </h3>
                  <ValuationConclusionSection overview={overview} />
                </section>
              ) : null}
              {hasThesis ? (
                <section>
                  <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-muted">
                    Investment thesis
                  </h3>
                  <InvestmentThesisSection thesis={overview.investmentThesis} />
                </section>
              ) : null}
              {overview.valuationSummary ? (
                <section>
                  <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted">
                    What is priced in
                  </h3>
                  <ValuationSummarySection overview={overview} />
                </section>
              ) : null}
              {overview.streetContext ? (
                <p className="text-xs leading-relaxed text-muted">
                  {overview.streetContext}
                </p>
              ) : null}
            </div>
          ) : (
            <EmptyState
              icon={FileSpreadsheet}
              title="Valuation view unavailable"
              description="We couldn't build a valuation read for this symbol right now."
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
              description="Composition, sectors, and cost"
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
          {!isEtf && (isLoading || (overview?.valuationSignals?.length ?? 0) > 0) ? (
            <ResearchScrollSpySection id="fundamentals-signals" label="Signals">
              <ResearchSectionCard
                title="Valuation signals"
                description="Key inputs behind the thesis"
                icon={BarChart3}
              >
                {isLoading ? (
                  <Skeleton className="h-24 rounded-lg" />
                ) : (
                  <ValuationSignalsSection signals={overview?.valuationSignals} />
                )}
              </ResearchSectionCard>
            </ResearchScrollSpySection>
          ) : null}

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
              description="Registrant details from EDGAR"
              icon={Landmark}
            >
              <SecCompanyProfileSection symbol={symbol} />
            </ResearchSectionCard>
          </ResearchScrollSpySection>
        </>
      )}
    </ResearchScrollSpy>
  );
}
