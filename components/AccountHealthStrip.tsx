"use client";

import { AlertTriangle, Landmark, Wallet } from "lucide-react";
import type {
  CashSecuredPutSummary,
  SchwabAccounts,
} from "@/app/types/schwab";
import { formatUsd } from "@/lib/formatCurrency";
import { cn } from "@/lib/utils";

type Props = {
  account: SchwabAccounts | null;
  cashSecuredPutSummary?: CashSecuredPutSummary | null;
  className?: string;
};

function Metric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning" | "danger";
}) {
  return (
    <div className="rounded-xl border border-border bg-background/60 px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-sm font-semibold tabular-nums",
          tone === "danger" && "text-danger",
          tone === "warning" && "text-orange-700 dark:text-orange-300",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function AccountHealthStrip({
  account,
  cashSecuredPutSummary,
  className,
}: Props) {
  if (!account) return null;

  const balances = account.securitiesAccount.currentBalances;
  const projected = account.securitiesAccount.projectedBalances;
  const initial = account.securitiesAccount.initialBalances;

  const maintenanceCall = balances.maintenanceCall ?? 0;
  const regTCall = balances.regTCall ?? 0;
  const isInCall =
    projected.isInCall || initial.isInCall || maintenanceCall > 0 || regTCall > 0;

  const cspReserved = cashSecuredPutSummary?.totalReservedCash ?? 0;
  const cashAfterCsp =
    cashSecuredPutSummary?.availableCashAfterReserves ??
    balances.cashBalance ??
    null;

  return (
    <section
      className={cn(
        "mx-auto w-full overflow-hidden rounded-2xl border border-border bg-secondary/60 shadow-sm",
        className,
      )}
      aria-label="Account health"
    >
      <div className="flex items-start gap-3 border-b border-border px-4 py-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent-strong">
          <Landmark className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-foreground">Account health</h2>
          <p className="text-[11px] text-muted">
            Buying power, cash, and margin status from Schwab
          </p>
        </div>
        {isInCall && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-danger/40 bg-danger/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-danger">
            <AlertTriangle className="h-3 w-3" aria-hidden />
            In call
          </span>
        )}
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

      <div className="grid grid-cols-2 gap-2 px-4 py-3 sm:grid-cols-3 lg:grid-cols-6">
        <Metric
          label="Buying power"
          value={formatUsd(balances.buyingPower ?? 0)}
        />
        <Metric
          label="Cash"
          value={formatUsd(balances.cashBalance ?? 0)}
        />
        <Metric
          label="Available funds"
          value={formatUsd(balances.availableFunds ?? balances.cashBalance ?? 0)}
        />
        <Metric
          label="Equity"
          value={`${(balances.equityPercentage ?? 0).toFixed(1)}%`}
        />
        <Metric
          label="CSP reserved"
          value={formatUsd(cspReserved)}
          tone={cspReserved > 0 ? "warning" : "default"}
        />
        <Metric
          label="Cash after CSP"
          value={
            cashAfterCsp != null ? formatUsd(cashAfterCsp) : "—"
          }
        />
      </div>

      <div className="flex items-center gap-2 border-t border-border/70 px-4 py-2 text-[11px] text-muted">
        <Wallet className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Liquidation value{" "}
        <span className="font-medium tabular-nums text-foreground">
          {formatUsd(balances.liquidationValue ?? 0)}
        </span>
      </div>
    </section>
  );
}
