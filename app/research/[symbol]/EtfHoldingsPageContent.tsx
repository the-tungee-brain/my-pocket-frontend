"use client";

import Link from "next/link";
import { Layers, PieChart } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEtfHoldings } from "@/app/hooks/useEtfHoldings";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { PageSplit } from "@/components/PageShell";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { symbolHubPath } from "@/lib/symbolRoutes";
import { cn } from "@/lib/utils";
import {
  EtfFundStats,
  EtfHoldingsTable,
  EtfSectorBreakdown,
} from "./EtfHoldingsSections";

type Props = {
  symbol: string;
  limit?: number;
};

function LoadingBlock() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-16 animate-pulse rounded-xl bg-muted-bg"
          />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-xl bg-muted-bg" />
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
            action={
              holdings.dataAsOf ? (
                <span className="text-[10px] text-muted">
                  As of {holdings.dataAsOf.slice(0, 10)}
                </span>
              ) : null
            }
          >
            <EtfFundStats holdings={holdings} />
          </ResearchSectionCard>

          <PageSplit
            main={
              <ResearchSectionCard
                title="Top holdings"
                description="Largest positions inside the fund"
                icon={Layers}
              >
                <EtfHoldingsTable
                  holdings={holdings.holdings}
                  totalHoldings={holdings.total_holdings}
                />
              </ResearchSectionCard>
            }
            aside={
              <ResearchSectionCard
                title="Sector breakdown"
                description="How the ETF is allocated across sectors"
                icon={PieChart}
              >
                <EtfSectorBreakdown breakdown={holdings.sector_breakdown} />
              </ResearchSectionCard>
            }
          />
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
};

export function EtfHoldingsOverviewPreview({
  symbol,
  className,
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
      className={className}
      action={
        <Link
          href={symbolHubPath(symbol, "holdings")}
          className="text-xs font-medium text-accent-strong hover:underline"
        >
          Full composition
        </Link>
      }
    >
      <div className="space-y-4">
        <EtfFundStats holdings={holdings} />
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">
              Sector breakdown
            </p>
            <EtfSectorBreakdown
              breakdown={holdings.sector_breakdown}
              limit={5}
            />
          </div>
          <div>
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">
              Top holdings
            </p>
            <EtfHoldingsTable
              holdings={holdings.holdings}
              totalHoldings={holdings.total_holdings}
              limit={5}
              compact
            />
          </div>
        </div>
      </div>
    </ResearchSectionCard>
  );
}
