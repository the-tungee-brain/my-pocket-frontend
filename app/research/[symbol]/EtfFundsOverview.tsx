"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEtfFunds } from "@/app/hooks/useEtfFunds";
import type { FundWeighting } from "@/app/hooks/etfFundsTypes";
import { usePerformanceSnapshot } from "@/app/hooks/usePerformance";
import {
  ResearchMetricList,
  ResearchRow,
  ResearchSection,
  researchMemo,
} from "@/components/research/ResearchMemoPrimitives";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatExpenseRatio } from "@/lib/etfHoldings";
import { quoteFreshnessLabel } from "@/lib/researchSnapshot";
import { formatCompactNumber } from "@/lib/streetAnalysisUtils";
import { formatCompactVolume, formatSnapshotPercent } from "@/lib/tickerKeyStats";
import { cn } from "@/lib/utils";
import {
  EtfSectorBreakdown,
  EtfTopHoldings,
} from "./EtfHoldingsSections";
import { useResearchAssetTypeContext } from "./ResearchAssetTypeContext";
import { useResearchSymbolHeader } from "./ResearchSymbolHeaderContext";

type EtfFundsOverviewProps = {
  symbol: string;
  className?: string;
};

function formatFundPct(value: number | null | undefined, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

function formatMoney(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `$${value.toFixed(2)}`;
}

function formatMove(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function formatDistributionYield(
  dividendYieldPct: number | null | undefined,
  holdingsYield: string | null | undefined,
): string {
  if (dividendYieldPct != null && Number.isFinite(dividendYieldPct)) {
    return formatSnapshotPercent(dividendYieldPct);
  }
  return holdingsYield?.trim() || "—";
}

function firstWeightingLabel(rows: FundWeighting[] | undefined): string | null {
  const first = rows?.[0];
  if (!first) return null;
  return `${first.label} (${formatFundPct(first.weightPct, 1)})`;
}

function joinDetails(values: Array<string | null | undefined>): string {
  return values.map((value) => value?.trim()).filter(Boolean).join(" · ");
}

function OverviewSkeleton() {
  return (
    <div className="space-y-8" aria-hidden>
      <div className="space-y-3">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-4 w-full max-w-3xl" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-14" />
        <Skeleton className="h-14" />
        <Skeleton className="h-14" />
        <Skeleton className="h-14" />
      </div>
    </div>
  );
}

export function EtfFundsOverview({ symbol, className }: EtfFundsOverviewProps) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const { isEtf } = useResearchAssetTypeContext();
  const {
    snapshot,
    etfHoldings: holdings,
    isLoading: snapshotLoading,
    error: snapshotError,
  } = useResearchSymbolHeader();
  const { funds, isLoading: fundsLoading, error: fundsError } = useEtfFunds(
    symbol,
    {
      accessToken,
      enabled: isEtf,
    },
  );
  const {
    performance,
    isLoading: performanceLoading,
    error: performanceError,
  } = usePerformanceSnapshot(symbol, { accessToken });

  if (!isEtf) return null;

  const loading =
    (snapshotLoading && !snapshot) || (fundsLoading && !funds && !holdings);
  const expenseDisplay = formatExpenseRatio(
    funds?.expenseRatioPct != null
      ? `${funds.expenseRatioPct.toFixed(2)}%`
      : (holdings?.expense_ratio ?? null),
  );
  const assetClass = firstWeightingLabel(funds?.assetClasses);
  const topSector =
    funds?.sectorWeightings?.[0]?.label ??
    Object.entries(holdings?.sector_breakdown ?? {}).sort(
      (a, b) => b[1] - a[1],
    )[0]?.[0] ??
    null;
  const fundTopHolding = funds?.topHoldings?.[0] ?? null;
  const holdingsTopHolding = holdings?.holdings[0] ?? null;
  const topHoldingLabel = fundTopHolding
    ? joinDetails([
        fundTopHolding.symbol || fundTopHolding.name,
        formatFundPct(fundTopHolding.weightPct, 1),
      ])
    : holdingsTopHolding
      ? joinDetails([
          holdingsTopHolding.ticker || holdingsTopHolding.name,
          formatFundPct(holdingsTopHolding.weight_pct, 1),
        ])
      : null;
  const fundSummary =
    funds?.description?.trim() ||
    joinDetails([
      funds?.family ? `${funds.family} fund` : "Exchange-traded fund",
      funds?.category ?? holdings?.ticker,
      assetClass,
    ]);
  const hasExposure =
    (holdings?.holdings.length ?? 0) > 0 ||
    Object.keys(holdings?.sector_breakdown ?? {}).length > 0;

  if (loading) {
    return (
      <section className={cn(researchMemo.sectionGap, className)}>
        <OverviewSkeleton />
      </section>
    );
  }

  return (
    <div className={cn("space-y-9", className)}>
      <ResearchSection
        title={`${symbol.toUpperCase()} Fund Overview`}
        subtitle={joinDetails([
          funds?.category ?? "ETF",
          funds?.family,
          funds?.dataAsOf ? `Profile as of ${funds.dataAsOf.slice(0, 10)}` : null,
        ])}
      >
        {snapshotError && !snapshot ? <ErrorBanner message={snapshotError} /> : null}
        {fundsError && !funds && !holdings ? (
          <ErrorBanner message={fundsError} />
        ) : null}

        <div className="space-y-4">
          <div className="max-w-4xl space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {funds?.category ?? funds?.legalType ?? "ETF fund"}
            </h2>
            <p className="line-clamp-3 text-sm leading-relaxed text-muted sm:text-base">
              {fundSummary}
            </p>
          </div>

          <ResearchMetricList
            columns={4}
            items={[
              {
                label: "Current price",
                value: formatMoney(snapshot?.price),
                note: snapshot
                  ? `${quoteFreshnessLabel(snapshot)} · Daily move ${formatMove(snapshot.changePct)}`
                  : undefined,
              },
              {
                label: "Expense ratio",
                value: expenseDisplay || "—",
                note:
                  funds?.categoryExpenseRatioPct != null
                    ? `Category ${formatFundPct(funds.categoryExpenseRatioPct)}`
                    : undefined,
              },
              {
                label: "AUM",
                value:
                  holdings?.aum ??
                  (funds?.totalNetAssets != null
                    ? formatCompactNumber(funds.totalNetAssets)
                    : "—"),
              },
              {
                label: "Distribution yield",
                value: formatDistributionYield(
                  snapshot?.dividendYieldPct,
                  holdings?.dividend_yield,
                ),
              },
            ]}
          />
        </div>
      </ResearchSection>

      <ResearchSection title="Key Fund Metrics">
        <ResearchMetricList
          columns={4}
          items={[
            {
              label: "Fund category",
              value: funds?.category ?? "—",
            },
            {
              label: "Asset class",
              value: assetClass ?? "—",
            },
            {
              label: "Holdings",
              value:
                holdings?.total_holdings != null
                  ? holdings.total_holdings.toLocaleString()
                  : "—",
            },
            {
              label: "Issuer",
              value: funds?.family ?? "—",
            },
          ]}
        />
      </ResearchSection>

      <ResearchSection title="Performance Snapshot">
        <div className="divide-y divide-border/60">
          <ResearchRow
            label="1 month"
            status={performance?.oneMonth ?? "—"}
            loading={performanceLoading && !performance}
            error={performanceError}
          />
          <ResearchRow
            label="3 month"
            status={performance?.threeMonth ?? "—"}
            loading={performanceLoading && !performance}
          />
          <ResearchRow
            label="1 year"
            status={performance?.oneYear ?? "—"}
            loading={performanceLoading && !performance}
          />
          <ResearchRow
            label="Trend"
            status={performance?.trendLabel ?? "Unavailable"}
            body={performance?.volatilityNote}
            loading={performanceLoading && !performance}
          />
        </div>
      </ResearchSection>

      {hasExposure ? (
        <ResearchSection
          title="Holdings / Exposure"
          action={
            <Link
              href={`/research/${symbol.toUpperCase()}/holdings`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-accent-strong hover:underline"
            >
              Full holdings
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          }
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div className="min-w-0">
              <p className={researchMemo.rowLabel}>Sector exposure</p>
              <div className="mt-3">
                <EtfSectorBreakdown
                  breakdown={holdings?.sector_breakdown ?? {}}
                  limit={6}
                />
              </div>
            </div>
            <div className="min-w-0">
              <p className={researchMemo.rowLabel}>Top holdings</p>
              <div className="mt-3">
                <EtfTopHoldings
                  holdings={holdings?.holdings ?? []}
                  totalHoldings={holdings?.total_holdings}
                  limit={6}
                  showFooter={false}
                />
              </div>
            </div>
          </div>
        </ResearchSection>
      ) : null}

      <ResearchSection title="Risk / Liquidity">
        <div className="divide-y divide-border/60">
          <ResearchRow
            label="Cost"
            status={expenseDisplay || "Unavailable"}
            body={
              funds?.categoryExpenseRatioPct != null && funds?.expenseRatioPct != null
                ? funds.expenseRatioPct < funds.categoryExpenseRatioPct
                  ? `Below category average of ${formatFundPct(
                      funds.categoryExpenseRatioPct,
                    )}.`
                  : `Above category average of ${formatFundPct(
                      funds.categoryExpenseRatioPct,
                    )}.`
                : "Category cost comparison is not available."
            }
          />
          <ResearchRow
            label="Turnover"
            status={formatFundPct(funds?.holdingsTurnoverPct)}
            body="Higher turnover can create more tax drag and trading friction."
          />
          <ResearchRow
            label="Liquidity"
            status={formatCompactVolume(snapshot?.volume)}
            body={
              snapshot?.avgVolume != null
                ? `Average volume ${formatCompactVolume(snapshot.avgVolume)}.`
                : "Average volume is not available."
            }
          />
          <ResearchRow
            label="NAV / premium"
            status="Unavailable"
            body="NAV premium or discount is not available from the current provider."
            tone="muted"
          />
        </div>
      </ResearchSection>

      <ResearchSection title="Fund Details">
        <div className="divide-y divide-border/60">
          <ResearchRow label="Issuer" status={funds?.family ?? "Unavailable"} />
          <ResearchRow
            label="Legal type"
            status={funds?.legalType ?? "Unavailable"}
          />
          <ResearchRow
            label="Primary exposure"
            status={assetClass ?? topSector ?? "Unavailable"}
            body={topHoldingLabel ? `Largest holding ${topHoldingLabel}.` : undefined}
          />
          <ResearchRow
            label="Data"
            status={
              holdings?.dataAsOf
                ? `Holdings as of ${holdings.dataAsOf.slice(0, 10)}`
                : funds?.dataAsOf
                  ? `Profile as of ${funds.dataAsOf.slice(0, 10)}`
                  : "Latest available provider data"
            }
          />
        </div>
      </ResearchSection>
    </div>
  );
}
