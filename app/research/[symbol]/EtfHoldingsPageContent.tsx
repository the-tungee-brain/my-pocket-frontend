"use client";

import Link from "next/link";
import { Layers, PieChart, Scale } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEtfHoldings } from "@/app/hooks/useEtfHoldings";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { symbolHubPath } from "@/lib/symbolRoutes";
import {
  EtfCompositionColumns,
  EtfFundStats,
  EtfQualityHoldings,
} from "./EtfHoldingsSections";

type Props = {
  symbol: string;
  limit?: number;
};

function LoadingBlock() {
  return (
    <div className="space-y-4">
      <div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-16 animate-pulse rounded-xl bg-muted-bg"
          />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="h-3 w-28 animate-pulse rounded bg-muted-bg" />
            <div className="h-52 animate-pulse rounded-xl bg-muted-bg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function EtfHoldingsPageContent({ symbol, limit = 25 }: Props) {
  const { data: session } = useSession();
  const { holdings, isLoading, error, refetch } = useEtfHoldings(symbol, {
    accessToken: session?.accessToken,
    limit,
    enabled: true,
  });

  return (
    <div className="space-y-4">
      {error ? <ErrorBanner message={error} onRetry={refetch} /> : null}

      {isLoading ? (
        <ResearchSectionCard
          title="ETF composition"
          description="Holdings, sectors, and fund stats"
          icon={Layers}
        >
          <LoadingBlock />
        </ResearchSectionCard>
      ) : holdings ? (
        <>
          <ResearchSectionCard
            title="Fund stats"
            description="Size, cost, and income profile"
            icon={Layers}
          >
            <EtfFundStats holdings={holdings} />
          </ResearchSectionCard>

          <ResearchSectionCard
            title="Composition"
            description="Sector allocation and largest positions"
            icon={PieChart}
            action={
              holdings.dataAsOf ? (
                <span className="text-[10px] text-muted">
                  As of {holdings.dataAsOf.slice(0, 10)}
                </span>
              ) : null
            }
          >
            <EtfCompositionColumns
              sectorBreakdown={holdings.sector_breakdown}
              holdings={holdings.holdings}
              totalHoldings={holdings.total_holdings}
              sectorLimit={20}
              holdingsLimit={limit}
              showHoldingsFooter={false}
            />
            {holdings.holdings.length < holdings.total_holdings ? (
              <p className="mt-4 border-t border-border pt-3 text-xs text-muted">
                Showing {Math.min(holdings.holdings.length, limit)} of{" "}
                {holdings.total_holdings.toLocaleString()} holdings.
              </p>
            ) : null}
          </ResearchSectionCard>

          <ResearchSectionCard
            title="Holdings quality"
            description="Strongest and weakest names by Piotroski F-Score and Altman Z"
            icon={Scale}
          >
            <EtfQualityHoldings
              strongest={holdings.strongestHoldings}
              weakest={holdings.weakestHoldings}
              limit={5}
            />
            <p className="mt-3 text-[11px] text-muted">
              Rankings use all scored holdings in the fund, not just the largest
              positions. Holdings without fundamentals are excluded.
            </p>
          </ResearchSectionCard>
        </>
      ) : (
        <EmptyState
          icon={Layers}
          title="Holdings unavailable"
          description="We couldn't load ETF holdings for this symbol. It may not be tagged as an ETF yet, or holdings data isn't available from our provider."
          variant="solid"
          action={
            <Link
              href={symbolHubPath(symbol, "overview")}
              className="text-xs font-medium text-accent-strong hover:underline"
            >
              Back to overview
            </Link>
          }
        />
      )}
    </div>
  );
}

type PreviewProps = {
  symbol: string;
  className?: string;
  stacked?: boolean;
};

export function EtfHoldingsOverviewPreview({
  symbol,
  className,
  stacked = false,
}: PreviewProps) {
  const { data: session } = useSession();
  const { holdings, isLoading } = useEtfHoldings(symbol, {
    accessToken: session?.accessToken,
    limit: 8,
    enabled: true,
  });

  if (isLoading) {
    return (
      <ResearchSectionCard
        title="Fund composition"
        description="What this ETF owns — sectors and largest positions"
        icon={Layers}
        titleHref={symbolHubPath(symbol, "holdings")}
        className={className}
      >
        <LoadingBlock />
      </ResearchSectionCard>
    );
  }

  if (!holdings) return null;

  return (
    <ResearchSectionCard
      title="Fund composition"
      description="What this ETF owns — sectors and largest positions"
      icon={Layers}
      titleHref={symbolHubPath(symbol, "holdings")}
      className={className}
    >
      <div className="space-y-4">
        <EtfFundStats holdings={holdings} />
        <EtfCompositionColumns
          sectorBreakdown={holdings.sector_breakdown}
          holdings={holdings.holdings}
          totalHoldings={holdings.total_holdings}
          sectorLimit={5}
          holdingsLimit={5}
          stacked={stacked}
        />
        <EtfQualityHoldings
          strongest={holdings.strongestHoldings}
          weakest={holdings.weakestHoldings}
          limit={3}
          stacked={stacked}
        />
      </div>
    </ResearchSectionCard>
  );
}
