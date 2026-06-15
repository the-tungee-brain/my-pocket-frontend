"use client";

import { AlertTriangle, ShieldCheck } from "lucide-react";
import { type ReactNode, useState } from "react";
import type { PortfolioOptimizationResponse } from "@/app/types/portfolioOptimization";
import type {
  CashSecuredPutSummary,
  PortfolioMetrics,
  Position,
  SchwabAccounts,
} from "@/app/types/schwab";
import { PortfolioSnapshotHeaderActionsContext } from "@/components/portfolioSnapshotHeaderActions";
import { FreshnessLabel } from "@/components/ui/FreshnessLabel";
import { LoadingRegion } from "@/components/ui/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatSignedUsd, formatUsd } from "@/lib/formatCurrency";
import {
  openProfitLossPct,
  sumCostBasis,
  sumOpenProfitLoss,
} from "@/lib/positionMetrics";
import { cn } from "@/lib/utils";

type Props = {
  loading?: boolean;
  allPositions: Position[];
  symbols: string[];
  account: SchwabAccounts | null;
  cashSecuredPutSummary?: CashSecuredPutSummary | null;
  portfolioMetrics?: PortfolioMetrics | null;
  portfolioOptimization?: PortfolioOptimizationResponse | null;
  briefPending?: boolean;
  positionsSyncedAt?: number | null;
  children?: ReactNode;
  className?: string;
};

function SnapshotSkeleton({ className }: { className?: string }) {
  return (
    <LoadingRegion
      label="Loading portfolio"
      className={cn("mx-auto w-full", className)}
    >
      <section className="space-y-5">
        <header className="flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-56 max-w-full" />
          </div>
          <Skeleton className="h-7 w-24" />
        </header>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.75fr)] lg:items-start">
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-10 w-52 max-w-full" />
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-6 w-28" />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3 border-t border-border/60 pt-4 lg:border-t-0 lg:pt-0">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-5 w-24" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          </div>
        </div>
      </section>
    </LoadingRegion>
  );
}

function SupportingMetric({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: string;
  detail?: string | null;
  tone?: "default" | "positive" | "negative" | "warning";
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-base font-semibold tabular-nums text-foreground sm:text-lg",
          tone === "positive" && "text-success",
          tone === "negative" && "text-danger",
          tone === "warning" && "text-warning",
        )}
      >
        {value}
      </p>
      {detail ? <p className="mt-0.5 text-xs text-muted">{detail}</p> : null}
    </div>
  );
}

function formatSignedPercent(value: number | null) {
  if (value == null || !Number.isFinite(value)) return null;
  const prefix = value >= 0 ? "+" : "";
  return `${prefix}${value.toFixed(2)}%`;
}

function healthTone(
  status: PortfolioOptimizationResponse["breakdown"]["stockConcentration"]["status"],
) {
  if (status === "poor") return "danger";
  if (status === "watch") return "warning";
  if (status === "strong" || status === "good") return "success";
  return "muted";
}

function buildHealthSnapshot({
  optimization,
  cashPct,
  inCall,
}: {
  optimization?: PortfolioOptimizationResponse | null;
  cashPct: number | null;
  inCall: boolean;
}) {
  const score = optimization?.diversificationScore ?? null;
  const topHolding = optimization?.stockWeights[0] ?? null;
  const concentrationStatus = optimization?.breakdown.stockConcentration.status;
  const concentrationPct = topHolding?.portfolioWeightPct ?? null;
  const concentrationSymbol = topHolding?.symbol ?? null;

  const isCritical =
    inCall ||
    topHolding?.level === "critical" ||
    concentrationStatus === "poor" ||
    (score != null && score < 40);
  const isHighConcentration =
    !isCritical &&
    (topHolding?.level === "high" ||
      (concentrationPct != null && concentrationPct >= 30));
  const isModerate =
    !isCritical &&
    !isHighConcentration &&
    (topHolding?.level === "elevated" ||
      concentrationStatus === "watch" ||
      (score != null && score < 70));

  if (isCritical) {
    return {
      label: "Critical Risk",
      tone: "danger" as const,
      score,
      concentrationPct,
      concentrationSymbol,
      cashPct,
    };
  }
  if (isHighConcentration) {
    return {
      label: "High Concentration",
      tone: "warning" as const,
      score,
      concentrationPct,
      concentrationSymbol,
      cashPct,
    };
  }
  if (isModerate) {
    return {
      label: "Moderate Risk",
      tone: "warning" as const,
      score,
      concentrationPct,
      concentrationSymbol,
      cashPct,
    };
  }
  return {
    label: score == null ? "Status Pending" : "Healthy",
    tone: score == null ? ("muted" as const) : ("success" as const),
    score,
    concentrationPct,
    concentrationSymbol,
    cashPct,
  };
}

function HealthBadge({
  label,
  value,
  tone = "muted",
}: {
  label: string;
  value: string;
  tone?: "success" | "warning" | "danger" | "muted";
}) {
  return (
    <div
      className={cn(
        "min-w-0 border border-border/60 bg-muted-bg/30 px-3 py-2",
        tone === "success" && "border-success/25 bg-success/5",
        tone === "warning" && "border-warning/25 bg-warning-muted/60",
        tone === "danger" && "border-danger/25 bg-danger/5",
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 truncate text-sm font-semibold tabular-nums text-foreground",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
          tone === "danger" && "text-danger",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function PortfolioSnapshot({
  loading = false,
  allPositions,
  symbols,
  account,
  cashSecuredPutSummary,
  portfolioMetrics,
  portfolioOptimization,
  briefPending = false,
  positionsSyncedAt = null,
  children,
  className,
}: Props) {
  const [headerActionsEl, setHeaderActionsEl] = useState<HTMLDivElement | null>(
    null,
  );

  if (loading) {
    return <SnapshotSkeleton className={className} />;
  }

  if (!allPositions.length) return null;

  const balances = account?.securitiesAccount.currentBalances;
  const projected = account?.securitiesAccount.projectedBalances;
  const initial = account?.securitiesAccount.initialBalances;

  const maintenanceCall = balances?.maintenanceCall ?? 0;
  const regTCall = balances?.regTCall ?? 0;
  const isInCall =
    projected?.isInCall ||
    initial?.isInCall ||
    maintenanceCall > 0 ||
    regTCall > 0;

  const totalValue = allPositions.reduce((sum, p) => sum + p.marketValue, 0);
  const accountValue = balances?.liquidationValue ?? totalValue;
  const totalDayPL = allPositions.reduce(
    (sum, p) => sum + p.currentDayProfitLoss,
    0,
  );
  const totalOpenPL =
    portfolioMetrics?.totalOpenProfitLoss ?? sumOpenProfitLoss(allPositions);
  const totalCostBasis = sumCostBasis(allPositions);
  const totalOpenPLPct = openProfitLossPct(totalOpenPL, totalCostBasis);
  const cspReserved = cashSecuredPutSummary?.totalReservedCash ?? 0;
  const cashAfterCsp =
    cashSecuredPutSummary?.availableCashAfterReserves ??
    balances?.cashBalance ??
    null;
  const cashPct =
    balances?.cashBalance != null && accountValue > 0
      ? (balances.cashBalance / accountValue) * 100
      : null;
  const totalDayPLPct =
    accountValue - totalDayPL > 0
      ? (totalDayPL / (accountValue - totalDayPL)) * 100
      : null;

  const dayTone = totalDayPL >= 0 ? "positive" : "negative";
  const openTone =
    totalOpenPL == null
      ? "default"
      : totalOpenPL >= 0
        ? "positive"
        : "negative";
  const health = buildHealthSnapshot({
    optimization: portfolioOptimization,
    cashPct,
    inCall: !!isInCall,
  });
  const dayPercent = formatSignedPercent(totalDayPLPct);
  const openPercent = formatSignedPercent(totalOpenPLPct);
  const concentrationLabel =
    health.concentrationPct != null
      ? `${health.concentrationPct.toFixed(1)}%${
          health.concentrationSymbol ? ` ${health.concentrationSymbol}` : ""
        }`
      : "Pending";
  const cashLabel =
    health.cashPct != null ? `${health.cashPct.toFixed(1)}%` : "Pending";

  return (
    <section
      className={cn("mx-auto w-full", className)}
      aria-label="Portfolio snapshot"
    >
      <header className="flex flex-col gap-3 border-b border-border/60 pb-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Portfolio status
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span>
              {symbols.length} {symbols.length === 1 ? "symbol" : "symbols"} ·{" "}
              {allPositions.length}{" "}
              {allPositions.length === 1 ? "position" : "positions"}
            </span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" aria-hidden />
              Read-only Schwab
            </span>
            {isInCall && (
              <span className="inline-flex items-center gap-1 text-danger">
                <AlertTriangle className="h-3 w-3" aria-hidden />
                In call
              </span>
            )}
          </div>
        </div>
        <div
          ref={setHeaderActionsEl}
          className="flex shrink-0 items-center gap-2 md:pt-1"
        />
      </header>

      {isInCall && (
        <div className="border-y border-danger/30 bg-danger/5 px-5 py-3 text-sm text-danger">
          {maintenanceCall > 0 && (
            <p>Maintenance call: {formatUsd(maintenanceCall)}</p>
          )}
          {regTCall > 0 && <p>Reg-T call: {formatUsd(regTCall)}</p>}
          {maintenanceCall <= 0 && regTCall <= 0 && (
            <p>Your account is in a margin or day-trading call state.</p>
          )}
        </div>
      )}

      <div className="pt-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.75fr)] lg:items-start">
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Total portfolio value
              </p>
              <p className="mt-1 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                {formatUsd(accountValue, { maximumFractionDigits: 0 })}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <SupportingMetric
                label="Today P/L"
                value={formatSignedUsd(totalDayPL)}
                detail={dayPercent}
                tone={dayTone}
              />
              {totalOpenPL != null && (
                <SupportingMetric
                  label="Overall return"
                  value={formatSignedUsd(totalOpenPL)}
                  detail={openPercent}
                  tone={openTone}
                />
              )}
              {balances?.cashBalance != null && (
                <SupportingMetric
                  label="Cash"
                  value={formatUsd(balances.cashBalance)}
                  detail={cashPct != null ? `${cashPct.toFixed(1)}%` : null}
                />
              )}
              {account && cashAfterCsp != null && cspReserved > 0 && (
                <SupportingMetric
                  label="Cash after CSP"
                  value={formatUsd(cashAfterCsp)}
                />
              )}
              {balances?.buyingPower != null && (
                <SupportingMetric
                  label="Buying power"
                  value={formatUsd(balances.buyingPower)}
                />
              )}
              {account && cspReserved > 0 && (
                <SupportingMetric
                  label="CSP reserve"
                  value={formatUsd(cspReserved)}
                  tone="warning"
                />
              )}
            </div>
          </div>

          <aside className="space-y-3 border-t border-border/60 pt-4 lg:border-t-0 lg:pt-0">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                Portfolio health
              </p>
              <span
                className={cn(
                  "inline-flex max-w-full items-center border px-2 py-0.5 text-[10px] font-medium tracking-wide",
                  health.tone === "success" &&
                    "border-success/30 bg-success/10 text-success",
                  health.tone === "warning" &&
                    "border-warning/30 bg-warning-muted text-warning",
                  health.tone === "danger" &&
                    "border-danger/30 bg-danger/10 text-danger",
                  health.tone === "muted" &&
                    "border-border bg-transparent text-muted",
                )}
              >
                {health.label}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <HealthBadge
                label="Score"
                value={health.score != null ? `${health.score}/100` : "Pending"}
                tone={health.tone}
              />
              <HealthBadge
                label="Top weight"
                value={concentrationLabel}
                tone={healthTone(
                  portfolioOptimization?.breakdown.stockConcentration.status ??
                    "unavailable",
                )}
              />
              <HealthBadge label="Cash" value={cashLabel} />
            </div>
            {(briefPending || positionsSyncedAt != null) && (
              <FreshnessLabel
                updatedAt={positionsSyncedAt}
                pending={briefPending}
                pendingLabel="Updating portfolio data…"
                className="pt-1"
              />
            )}
          </aside>
        </div>
      </div>

      <PortfolioSnapshotHeaderActionsContext.Provider value={headerActionsEl}>
        {children}
      </PortfolioSnapshotHeaderActionsContext.Provider>
    </section>
  );
}
