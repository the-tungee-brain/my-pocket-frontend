"use client";

import { AlertTriangle, BriefcaseBusiness, ChevronDown, ShieldCheck } from "lucide-react";
import { useState, type ReactNode } from "react";
import { PortfolioSnapshotHeaderActionsContext } from "@/components/portfolioSnapshotHeaderActions";
import { Badge } from "@/components/ui/Badge";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { KpiStat } from "@/components/ui/KpiStat";
import { Skeleton } from "@/components/ui/Skeleton";
import { LoadingRegion } from "@/components/ui/LoadingRegion";
import { FreshnessLabel } from "@/components/ui/FreshnessLabel";
import type {
  CashSecuredPutSummary,
  PortfolioMetrics,
  Position,
  SchwabAccounts,
} from "@/app/types/schwab";
import { formatSignedUsd, formatUsd } from "@/lib/formatCurrency";
import { sumOpenProfitLoss } from "@/lib/positionMetrics";
import {
  appIconBoxClass,
  appPanelFooterClass,
  appStatGridClass,
} from "@/lib/appUi";
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
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-2 h-3 w-48" />
        </CardHeader>
        <CardBody spacious>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-40" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className={appStatGridClass}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[4.5rem] rounded-lg" />
          ))}
        </div>
        </CardBody>
      </Card>
    </LoadingRegion>
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
  const [detailsOpen, setDetailsOpen] = useState(false);
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
    <Card className={className} aria-label="Portfolio snapshot">
      <CardHeader tone={isInCall ? "danger" : "default"}>
        <CardTitle
          headingLevel={1}
          title="My portfolio"
          description={
            <>
              {`${symbols.length} ${symbols.length === 1 ? "symbol" : "symbols"} · ${allPositions.length} ${allPositions.length === 1 ? "position" : "positions"}`}
              {(briefPending || positionsSyncedAt != null) && (
                <span className="mt-0.5 block">
                  <FreshnessLabel
                    updatedAt={positionsSyncedAt}
                    pending={briefPending}
                    pendingLabel="Morning brief · updating…"
                  />
                </span>
              )}
            </>
          }
          icon={
            <div className={appIconBoxClass}>
              <BriefcaseBusiness className="h-4 w-4" aria-hidden />
            </div>
          }
          badge={
            <>
              <Badge variant="muted" className="gap-1 px-2 py-0.5">
                <ShieldCheck className="h-3 w-3 text-accent-strong" aria-hidden />
                Read-only Schwab
              </Badge>
              {isInCall && (
                <Badge variant="danger" className="gap-1 font-semibold uppercase tracking-wide">
                  <AlertTriangle className="h-3 w-3" aria-hidden />
                  In call
                </Badge>
              )}
            </>
          }
        />
        <div
          ref={setHeaderActionsEl}
          className="flex shrink-0 items-center gap-2"
        />
      </CardHeader>

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

      <CardBody spacious className="space-y-5">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <KpiStat
            variant="hero"
            label="Total value"
            value={formatUsd(totalValue, { maximumFractionDigits: 0 })}
            subValue={
              totalOpenPL != null
                ? `${formatSignedUsd(totalOpenPL)} open P/L`
                : undefined
            }
          />
          <KpiStat
            variant="hero"
            label="Today"
            value={formatSignedUsd(totalDayPL)}
            tone={dayTone}
            subValue={`Liquidation ${formatUsd(balances?.liquidationValue ?? totalValue, { maximumFractionDigits: 0 })}`}
          />
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border/70 pt-4 text-xs text-muted">
          {totalOpenPL != null && (
            <span className={cn("tabular-nums", openTone === "positive" && "text-success", openTone === "negative" && "text-danger")}>
              Open P/L {formatSignedUsd(totalOpenPL)}
            </span>
          )}
          {balances?.cashBalance != null && (
            <span className="tabular-nums">Cash {formatUsd(balances.cashBalance)}</span>
          )}
          {balances?.buyingPower != null && (
            <span className="tabular-nums">Buying power {formatUsd(balances.buyingPower)}</span>
          )}
        </div>
      </CardBody>

      {account && (
        <div className="border-t border-border/70">
          <button
            type="button"
            onClick={() => setDetailsOpen((open) => !open)}
            aria-expanded={detailsOpen}
            className={cn(
              appPanelFooterClass,
              "w-full text-left text-xs font-medium text-muted transition hover:bg-muted-bg/40 hover:text-foreground",
            )}
          >
            Account details
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 transition-transform",
                detailsOpen && "rotate-180",
              )}
              aria-hidden
            />
          </button>

          {detailsOpen && (
            <div className={cn(appStatGridClass, "border-t border-border/70")}>
              <KpiStat label="Cash" value={formatUsd(balances?.cashBalance ?? 0)} />
              <KpiStat
                label="Buying power"
                value={formatUsd(balances?.buyingPower ?? 0)}
              />
              {cspReserved > 0 ? (
                <>
                  <KpiStat
                    label="CSP reserved"
                    value={formatUsd(cspReserved)}
                    tone="warning"
                  />
                  <KpiStat
                    label="Cash after CSP"
                    value={cashAfterCsp != null ? formatUsd(cashAfterCsp) : "—"}
                  />
                </>
              ) : (
                <KpiStat
                  label="Available funds"
                  value={formatUsd(
                    balances?.availableFunds ?? balances?.cashBalance ?? 0,
                  )}
                />
              )}
              <KpiStat
                label="Liquidation"
                value={formatUsd(balances?.liquidationValue ?? totalValue, {
                  maximumFractionDigits: 0,
                })}
              />
            </div>
          )}
        </div>
      )}

      <PortfolioSnapshotHeaderActionsContext.Provider value={headerActionsEl}>
        {children}
      </PortfolioSnapshotHeaderActionsContext.Provider>
    </Card>
  );
}
