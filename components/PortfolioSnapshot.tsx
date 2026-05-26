"use client";

import { AlertTriangle, BriefcaseBusiness, ChevronDown } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { PortfolioSnapshotHeaderActionsContext } from "@/components/portfolioSnapshotHeaderActions";
import type {
  CashSecuredPutSummary,
  PortfolioMetrics,
  Position,
  SchwabAccounts,
} from "@/app/types/schwab";
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
  children?: ReactNode;
  /** Collapse cash and buying-power stats until expanded. Defaults open on Holdings. */
  compactAccountDetails?: boolean;
  className?: string;
};

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "positive" | "negative" | "warning";
}) {
  return (
    <div className="rounded-xl border border-border bg-background/60 px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-base font-semibold tabular-nums sm:text-lg",
          tone === "positive" && "text-success",
          tone === "negative" && "text-danger",
          tone === "warning" && "text-orange-700 dark:text-orange-300",
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
  children,
  compactAccountDetails = false,
  className,
}: Props) {
  const [headerActionsEl, setHeaderActionsEl] = useState<HTMLDivElement | null>(
    null,
  );
  const [accountDetailsOpen, setAccountDetailsOpen] = useState(
    !compactAccountDetails,
  );

  useEffect(() => {
    setAccountDetailsOpen(!compactAccountDetails);
  }, [compactAccountDetails]);

  if (loading) {
    return (
      <section className={cn("mx-auto w-full", className)}>
        <div className="mb-3 space-y-2">
          <div className="h-6 w-36 animate-pulse rounded bg-muted-bg" />
          <div className="h-4 w-48 animate-pulse rounded bg-muted-bg" />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-muted-bg" />
          ))}
        </div>
      </section>
    );
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

  return (
    <section
      className={cn(
        "mx-auto w-full overflow-hidden rounded-2xl border border-border bg-secondary shadow-sm",
        className,
      )}
      aria-label="Portfolio snapshot"
    >
      <div className="flex items-start justify-between gap-3 border-b border-border bg-surface-elevated/50 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent-strong">
            <BriefcaseBusiness className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-foreground">My portfolio</h1>
            <p className="text-[11px] text-muted">
              {symbols.length} {symbols.length === 1 ? "symbol" : "symbols"} ·{" "}
              {allPositions.length}{" "}
              {allPositions.length === 1 ? "position" : "positions"}
            </p>
          </div>
          {isInCall && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-danger/40 bg-danger/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-danger">
              <AlertTriangle className="h-3 w-3" aria-hidden />
              In call
            </span>
          )}
        </div>
        <div
          ref={setHeaderActionsEl}
          className="flex shrink-0 items-center gap-2"
        />
      </div>

      {isInCall && (
        <div className="border-b border-border bg-danger/5 px-4 py-2.5 text-sm text-danger">
          {maintenanceCall > 0 && (
            <p>Maintenance call: {formatUsd(maintenanceCall)}</p>
          )}
          {regTCall > 0 && <p>Reg-T call: {formatUsd(regTCall)}</p>}
          {maintenanceCall <= 0 && regTCall <= 0 && (
            <p>Your account is in a margin or day-trading call state.</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 px-4 py-3 sm:grid-cols-4">
        <Stat
          label="Total value"
          value={formatUsd(totalValue, { maximumFractionDigits: 0 })}
        />
        <Stat
          label="Open P/L"
          value={
            totalOpenPL != null ? formatSignedUsd(totalOpenPL) : "—"
          }
          tone={
            totalOpenPL == null
              ? "default"
              : totalOpenPL >= 0
                ? "positive"
                : "negative"
          }
        />
        <Stat
          label="Today P/L"
          value={formatSignedUsd(totalDayPL)}
          tone={totalDayPL >= 0 ? "positive" : "negative"}
        />
        <Stat
          label="Liquidation"
          value={formatUsd(balances?.liquidationValue ?? totalValue, {
            maximumFractionDigits: 0,
          })}
        />
      </div>

      {account && (
        <>
          {compactAccountDetails && (
            <button
              type="button"
              aria-expanded={accountDetailsOpen}
              onClick={() => setAccountDetailsOpen((open) => !open)}
              className="flex w-full items-center justify-between gap-2 border-t border-border/70 px-4 py-2.5 text-left text-[11px] font-medium text-muted transition hover:bg-muted-bg/40 hover:text-foreground"
            >
              <span>Account details · cash & buying power</span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 shrink-0 transition-transform",
                  accountDetailsOpen && "rotate-180",
                )}
                aria-hidden
              />
            </button>
          )}
          {(!compactAccountDetails || accountDetailsOpen) && (
            <div className="grid grid-cols-2 gap-2 border-t border-border/70 px-4 py-3 sm:grid-cols-4">
              <Stat
                label="Cash"
                value={formatUsd(balances?.cashBalance ?? 0)}
              />
              <Stat
                label="Buying power"
                value={formatUsd(balances?.buyingPower ?? 0)}
              />
              {cspReserved > 0 ? (
                <>
                  <Stat
                    label="CSP reserved"
                    value={formatUsd(cspReserved)}
                    tone="warning"
                  />
                  <Stat
                    label="Cash after CSP"
                    value={cashAfterCsp != null ? formatUsd(cashAfterCsp) : "—"}
                  />
                </>
              ) : (
                <Stat
                  label="Available funds"
                  value={formatUsd(
                    balances?.availableFunds ?? balances?.cashBalance ?? 0,
                  )}
                />
              )}
            </div>
          )}
        </>
      )}

      <PortfolioSnapshotHeaderActionsContext.Provider value={headerActionsEl}>
        {children}
      </PortfolioSnapshotHeaderActionsContext.Provider>
    </section>
  );
}
