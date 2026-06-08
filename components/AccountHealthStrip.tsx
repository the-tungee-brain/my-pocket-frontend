"use client";

import { AlertTriangle, Landmark, Wallet } from "lucide-react";
import type { CashSecuredPutSummary, SchwabAccounts } from "@/app/types/schwab";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { KpiStat } from "@/components/ui/KpiStat";
import { formatUsd } from "@/lib/formatCurrency";

type Props = {
  account: SchwabAccounts | null;
  cashSecuredPutSummary?: CashSecuredPutSummary | null;
  className?: string;
};

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
    projected.isInCall ||
    initial.isInCall ||
    maintenanceCall > 0 ||
    regTCall > 0;

  const cspReserved = cashSecuredPutSummary?.totalReservedCash ?? 0;
  const cashAfterCsp =
    cashSecuredPutSummary?.availableCashAfterReserves ??
    balances.cashBalance ??
    null;

  return (
    <Card surface="subtle" className={className} aria-label="Account health">
      <CardHeader tone={isInCall ? "danger" : "default"}>
        <CardTitle
          title="Account health"
          description="Buying power, cash, and margin status from Schwab"
          icon={
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center bg-accent-muted text-accent-strong">
              <Landmark className="h-4 w-4" aria-hidden />
            </div>
          }
          badge={
            isInCall ? (
              <span className="inline-flex shrink-0 items-center gap-1 border border-danger/40 bg-danger/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-danger">
                <AlertTriangle className="h-3 w-3" aria-hidden />
                In call
              </span>
            ) : undefined
          }
        />
      </CardHeader>

      {isInCall && (
        <div className="border-b border-danger/30 bg-danger/5 px-4 py-2.5 text-sm text-danger">
          {maintenanceCall > 0 && (
            <p>Maintenance call: {formatUsd(maintenanceCall)}</p>
          )}
          {regTCall > 0 && <p>Reg-T call: {formatUsd(regTCall)}</p>}
          {maintenanceCall <= 0 && regTCall <= 0 && (
            <p>Your account is in a margin or day-trading call state.</p>
          )}
        </div>
      )}

      <CardBody className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <KpiStat
          label="Buying power"
          value={formatUsd(balances.buyingPower ?? 0)}
        />
        <KpiStat label="Cash" value={formatUsd(balances.cashBalance ?? 0)} />
        <KpiStat
          label="Available funds"
          value={formatUsd(
            balances.availableFunds ?? balances.cashBalance ?? 0,
          )}
        />
        <KpiStat
          label="Equity"
          value={`${(balances.equityPercentage ?? 0).toFixed(1)}%`}
        />
        <KpiStat
          label="CSP reserved"
          value={formatUsd(cspReserved)}
          tone={cspReserved > 0 ? "warning" : "default"}
        />
        <KpiStat
          label="Cash after CSP"
          value={cashAfterCsp != null ? formatUsd(cashAfterCsp) : "—"}
        />
      </CardBody>

      <div className="flex items-center gap-2 border-t border-border/70 px-4 py-2 text-xs text-muted">
        <Wallet className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Liquidation value{" "}
        <span className="font-medium tabular-nums text-foreground">
          {formatUsd(balances.liquidationValue ?? 0)}
        </span>
      </div>
    </Card>
  );
}
