"use client";

import { LockKeyhole } from "lucide-react";
import type { CashSecuredPutSummary as CashSecuredPutSummaryData } from "@/app/types/schwab";
import { formatUsd } from "@/lib/formatCurrency";
import { cn } from "@/lib/utils";

type Props = {
  summary: CashSecuredPutSummaryData;
  cashBalance?: number | null;
  compact?: boolean;
  className?: string;
};

function formatStrike(strike: number | null) {
  if (strike == null) return "—";
  return formatUsd(strike, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function CashSecuredPutSummary({
  summary,
  cashBalance,
  compact = false,
  className,
}: Props) {
  if (summary.totalReservedCash <= 0) return null;

  const reserved = summary.totalReservedCash;
  const available =
    summary.availableCashAfterReserves ??
    (cashBalance != null ? Math.max(cashBalance - reserved, 0) : null);
  const cashTotal =
    cashBalance != null && cashBalance > 0 ? cashBalance : reserved + (available ?? 0);
  const reservedPct =
    cashTotal > 0 ? Math.min(100, Math.round((reserved / cashTotal) * 100)) : 100;

  return (
    <section
      className={cn(
        "mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-accent/20 bg-accent-muted/40 shadow-sm",
        className,
      )}
      aria-label="Cash-secured put reserves"
    >
      <div className="border-b border-accent/10 px-4 py-3 sm:px-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-strong">
            <LockKeyhole className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Cash reserved for puts
            </h3>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">
              {compact
                ? "Set aside to buy shares if assigned."
                : "When you sell cash-secured puts, this cash is earmarked to buy 100 shares per contract at the strike if assigned."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 px-4 py-4 sm:grid-cols-3 sm:px-5">
        {cashBalance != null && (
          <div className="rounded-xl border border-border/80 bg-secondary/70 px-3.5 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
              Cash balance
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {formatUsd(cashBalance)}
            </p>
          </div>
        )}
        <div className="rounded-xl border border-accent/25 bg-secondary/70 px-3.5 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
            Reserved
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-accent-strong">
            {formatUsd(reserved)}
          </p>
        </div>
        {available != null && (
          <div className="rounded-xl border border-border/80 bg-secondary/70 px-3.5 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
              Available after reserves
            </p>
            <p
              className={cn(
                "mt-1 text-lg font-semibold tabular-nums",
                available <= 0 ? "text-danger" : "text-foreground",
              )}
            >
              {formatUsd(available)}
            </p>
          </div>
        )}
      </div>

      {cashBalance != null && cashBalance > 0 && (
        <div className="px-4 pb-4 sm:px-5">
          <div className="mb-1.5 flex items-center justify-between text-[11px] text-muted">
            <span>Reserved vs cash</span>
            <span className="tabular-nums">{reservedPct}% reserved</span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-muted-bg"
            role="progressbar"
            aria-valuenow={reservedPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${reservedPct}% of cash reserved for puts`}
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300"
              style={{ width: `${reservedPct}%` }}
            />
          </div>
        </div>
      )}

      {!compact && summary.positions.length > 0 && (
        <div className="border-t border-border/80 bg-secondary/30">
          <ul className="divide-y divide-border/70">
            {summary.positions.map((item) => {
              const label = item.underlyingSymbol ?? item.symbol;
              const contractLabel =
                item.contracts === 1 ? "1 contract" : `${item.contracts} contracts`;

              return (
                <li
                  key={`${item.symbol}-${item.strike}-${item.contracts}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      <span className="font-mono">{label}</span>
                      <span className="text-muted"> · </span>
                      <span className="text-muted">{formatStrike(item.strike)} put</span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted">{contractLabel}</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold tabular-nums text-accent-strong">
                    {formatUsd(item.reservedCash)}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
