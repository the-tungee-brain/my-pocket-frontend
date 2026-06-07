"use client";

import { AlertTriangle, ShieldCheck } from "lucide-react";
import { type ReactNode, useState } from "react";
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
import { sumOpenProfitLoss } from "@/lib/positionMetrics";
import { cn } from "@/lib/utils";

type Props = {
  loading?: boolean;
  allPositions: Position[];
  symbols: string[];
  account: SchwabAccounts | null;
  cashSecuredPutSummary?: CashSecuredPutSummary | null;
  portfolioMetrics?: PortfolioMetrics | null;
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
      <section className="space-y-5 border-t border-border/60 pt-5">
        <Skeleton className="h-4 w-28" />
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-28" />
            </div>
          ))}
        </div>
      </section>
    </LoadingRegion>
  );
}

function BalanceMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
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
  const totalDayPL = allPositions.reduce(
    (sum, p) => sum + p.currentDayProfitLoss,
    0,
  );
  const totalOpenPL =
    portfolioMetrics?.totalOpenProfitLoss ?? sumOpenProfitLoss(allPositions);
  const cspReserved = cashSecuredPutSummary?.totalReservedCash ?? 0;
  const cashAfterCsp =
    cashSecuredPutSummary?.availableCashAfterReserves ??
    balances?.cashBalance ??
    null;

  const dayTone = totalDayPL >= 0 ? "positive" : "negative";
  const openTone =
    totalOpenPL == null
      ? "default"
      : totalOpenPL >= 0
        ? "positive"
        : "negative";

  return (
    <section
      className={cn("mx-auto w-full", className)}
      aria-label="Portfolio snapshot"
    >
      <header className="flex flex-col gap-4 border-b border-border/60 pb-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Portfolio balance
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
            {(briefPending || positionsSyncedAt != null) && (
              <FreshnessLabel
                updatedAt={positionsSyncedAt}
                pending={briefPending}
                pendingLabel="Updating…"
              />
            )}
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
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-3 xl:grid-cols-6">
          <BalanceMetric
            label="Total value"
            value={formatUsd(totalValue, { maximumFractionDigits: 0 })}
          />
          <BalanceMetric
            label="Today P/L"
            value={formatSignedUsd(totalDayPL)}
            tone={dayTone}
          />
          {totalOpenPL != null && (
            <BalanceMetric
              label="Open P/L"
              value={formatSignedUsd(totalOpenPL)}
              tone={openTone}
            />
          )}
          {account && cashAfterCsp != null && cspReserved > 0 && (
            <BalanceMetric
              label="Cash after CSP"
              value={formatUsd(cashAfterCsp)}
            />
          )}
          {balances?.cashBalance != null && (
            <BalanceMetric
              label="Cash"
              value={formatUsd(balances.cashBalance)}
            />
          )}
          {balances?.buyingPower != null && (
            <BalanceMetric
              label="Buying power"
              value={formatUsd(balances.buyingPower)}
            />
          )}
          {account && cspReserved > 0 && (
            <BalanceMetric
              label="CSP reserve"
              value={formatUsd(cspReserved)}
              tone="warning"
            />
          )}
        </div>
      </div>

      <PortfolioSnapshotHeaderActionsContext.Provider value={headerActionsEl}>
        {children}
      </PortfolioSnapshotHeaderActionsContext.Provider>
    </section>
  );
}
