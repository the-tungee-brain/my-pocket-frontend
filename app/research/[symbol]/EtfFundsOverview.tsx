"use client";

import Link from "next/link";
import { ChevronRight, Layers } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEtfFunds } from "@/app/hooks/useEtfFunds";
import { useResearchAssetTypeContext } from "./ResearchAssetTypeContext";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { formatExpenseRatio } from "@/lib/etfHoldings";
import {
  formatCompactNumber,
  yahooFundProfileAttribution,
} from "@/lib/streetAnalysisUtils";
import { symbolHubPath } from "@/lib/symbolRoutes";
import { EtfFundsSkeleton, hasEtfFunds } from "./EtfFundsSection";

const FUND_PROFILE_SUBTITLE = "Expense, composition, and top holdings";

type EtfFundsOverviewProps = {
  symbol: string;
  className?: string;
};

function formatFundPct(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toFixed(2)}%`;
}

export function EtfFundsOverview({ symbol, className }: EtfFundsOverviewProps) {
  const { data: session } = useSession();
  const { isEtf } = useResearchAssetTypeContext();
  const { funds, isLoading, error } = useEtfFunds(symbol, {
    accessToken: session?.accessToken,
    enabled: isEtf,
  });

  if (!isEtf) return null;

  const fundamentalsHref = symbolHubPath(symbol, "fundamentals");

  const detailsLink = (
    <Link
      href={fundamentalsHref}
      className="inline-flex items-center gap-0.5 text-[11px] font-medium text-accent-strong transition hover:underline"
    >
      Full profile
      <ChevronRight className="h-3 w-3" aria-hidden />
    </Link>
  );

  if (isLoading) {
    return (
      <ResearchSectionCard
        title="Fund profile"
        description={FUND_PROFILE_SUBTITLE}
        icon={Layers}
        className={className}
      >
        <EtfFundsSkeleton />
      </ResearchSectionCard>
    );
  }

  if (error) {
    return (
      <ResearchSectionCard
        title="Fund profile"
        description={FUND_PROFILE_SUBTITLE}
        icon={Layers}
        className={className}
      >
        <ErrorBanner message={error} />
      </ResearchSectionCard>
    );
  }

  if (!hasEtfFunds(funds)) {
    return null;
  }

  const expenseDisplay = formatExpenseRatio(
    funds.expenseRatioPct != null
      ? `${funds.expenseRatioPct.toFixed(2)}%`
      : null,
  );
  const topSector = funds.sectorWeightings?.[0];
  const topHolding = funds.topHoldings?.[0];

  return (
    <ResearchSectionCard
      title="Fund profile"
      description={FUND_PROFILE_SUBTITLE}
      icon={Layers}
      action={detailsLink}
      className={className}
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {funds.category ? (
            <span className="border border-accent/30 bg-accent-muted px-2 py-0.5 text-[11px] font-semibold text-accent-strong">
              {funds.category}
            </span>
          ) : null}
          {expenseDisplay ? (
            <span className="text-sm font-semibold tabular-nums text-foreground">
              ER {expenseDisplay}
            </span>
          ) : null}
        </div>

        {funds.categoryExpenseRatioPct != null && funds.expenseRatioPct != null ? (
          <p className="text-sm text-muted">
            Category avg {formatFundPct(funds.categoryExpenseRatioPct)}
            {funds.expenseRatioPct < funds.categoryExpenseRatioPct ? (
              <span className="text-success"> · below category</span>
            ) : funds.expenseRatioPct > funds.categoryExpenseRatioPct ? (
              <span className="text-danger"> · above category</span>
            ) : null}
          </p>
        ) : null}

        {funds.totalNetAssets != null ? (
          <p className="text-sm text-muted">
            Net assets{" "}
            <span className="font-medium tabular-nums text-foreground">
              {formatCompactNumber(funds.totalNetAssets)}
            </span>
          </p>
        ) : null}

        {topSector ? (
          <p className="text-sm leading-relaxed text-foreground">
            Largest sector: {topSector.label} ({formatFundPct(topSector.weightPct)})
          </p>
        ) : null}

        {topHolding ? (
          <p className="text-sm leading-relaxed text-muted">
            Top holding:{" "}
            <span className="text-foreground">
              {topHolding.symbol ? (
                <Link
                  href={symbolHubPath(topHolding.symbol, "overview")}
                  className="font-mono font-semibold text-accent-strong hover:underline"
                >
                  {topHolding.symbol}
                </Link>
              ) : (
                topHolding.name
              )}{" "}
              · {formatFundPct(topHolding.weightPct)}
            </span>
          </p>
        ) : null}

        {funds.description ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted">
            {funds.description}
          </p>
        ) : null}

        <p className="text-[11px] text-muted">
          {yahooFundProfileAttribution(funds.dataAsOf)}
        </p>
      </div>
    </ResearchSectionCard>
  );
}
