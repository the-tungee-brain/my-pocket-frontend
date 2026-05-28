"use client";

import { PieChart } from "lucide-react";
import type { EtfFundsSnapshot, FundWeighting } from "@/app/hooks/etfFundsTypes";
import { formatExpenseRatio } from "@/lib/etfHoldings";
import { formatCompactNumber } from "@/lib/streetAnalysisUtils";

const YAHOO_FUNDS_ATTRIBUTION = "Fund profile from Yahoo Finance";

type EtfFundsSectionProps = {
  funds: EtfFundsSnapshot | null | undefined;
  isLoading?: boolean;
};

export function hasEtfFunds(
  funds: EtfFundsSnapshot | null | undefined,
): funds is EtfFundsSnapshot {
  if (!funds) return false;
  return Boolean(
    funds.category ||
      funds.family ||
      funds.description ||
      funds.expenseRatioPct != null ||
      (funds.assetClasses?.length ?? 0) > 0 ||
      (funds.sectorWeightings?.length ?? 0) > 0 ||
      (funds.topHoldings?.length ?? 0) > 0,
  );
}

function formatFundPct(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toFixed(2)}%`;
}

function WeightingBars({ rows, max = 6 }: { rows: FundWeighting[]; max?: number }) {
  const slice = rows.slice(0, max);
  if (slice.length === 0) return null;

  return (
    <div className="space-y-2">
      {slice.map((row) => (
        <div key={row.label} className="space-y-1">
          <div className="flex justify-between gap-2 text-xs">
            <span className="truncate text-foreground">{row.label}</span>
            <span className="shrink-0 tabular-nums text-muted">
              {formatFundPct(row.weightPct)}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted-bg">
            <div
              className="h-full rounded-full bg-accent/70"
              style={{ width: `${Math.min(row.weightPct, 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EtfFundsSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-4 w-36 animate-pulse rounded bg-muted-bg" />
      <div className="h-24 animate-pulse rounded-lg bg-muted-bg" />
    </div>
  );
}

export function EtfFundsSection({ funds, isLoading }: EtfFundsSectionProps) {
  if (isLoading) {
    return <EtfFundsSkeleton />;
  }

  if (!hasEtfFunds(funds)) {
    return (
      <p className="text-sm text-muted">
        Yahoo Finance fund profile isn&apos;t available for this symbol.
      </p>
    );
  }

  const expenseDisplay = formatExpenseRatio(
    funds.expenseRatioPct != null
      ? `${funds.expenseRatioPct.toFixed(2)}%`
      : null,
  );

  return (
    <div className="space-y-4">
      {(funds.category || funds.family || funds.legalType) && (
        <div className="flex flex-wrap gap-2">
          {funds.category ? (
            <span className="rounded-full border border-border bg-background/60 px-2 py-0.5 text-[11px] font-medium text-foreground">
              {funds.category}
            </span>
          ) : null}
          {funds.family ? (
            <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted">
              {funds.family}
            </span>
          ) : null}
          {funds.legalType ? (
            <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted">
              {funds.legalType}
            </span>
          ) : null}
        </div>
      )}

      {funds.description ? (
        <p className="text-sm leading-relaxed text-muted">{funds.description}</p>
      ) : null}

      {(expenseDisplay ||
        funds.holdingsTurnoverPct != null ||
        funds.totalNetAssets != null) && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {expenseDisplay ? (
            <div className="rounded-lg border border-border bg-background/60 px-2.5 py-2">
              <p className="text-[10px] text-muted">Expense ratio</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {expenseDisplay}
              </p>
              {funds.categoryExpenseRatioPct != null ? (
                <p className="mt-0.5 text-[10px] text-muted">
                  Category {formatFundPct(funds.categoryExpenseRatioPct)}
                </p>
              ) : null}
            </div>
          ) : null}
          {funds.holdingsTurnoverPct != null ? (
            <div className="rounded-lg border border-border bg-background/60 px-2.5 py-2">
              <p className="text-[10px] text-muted">Turnover</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {formatFundPct(funds.holdingsTurnoverPct)}
              </p>
            </div>
          ) : null}
          {funds.totalNetAssets != null ? (
            <div className="rounded-lg border border-border bg-background/60 px-2.5 py-2">
              <p className="text-[10px] text-muted">Net assets</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {formatCompactNumber(funds.totalNetAssets)}
              </p>
            </div>
          ) : null}
        </div>
      )}

      {funds.assetClasses && funds.assetClasses.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Asset mix
          </p>
          <WeightingBars rows={funds.assetClasses} />
        </div>
      ) : null}

      {funds.sectorWeightings && funds.sectorWeightings.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Sector weightings
          </p>
          <WeightingBars rows={funds.sectorWeightings} max={8} />
        </div>
      ) : null}

      {funds.topHoldings && funds.topHoldings.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Top holdings (Yahoo)
          </p>
          <ul className="space-y-1.5">
            {funds.topHoldings.map((row) => (
              <li
                key={`${row.symbol ?? row.name}-${row.weightPct}`}
                className="flex items-baseline justify-between gap-2 text-xs"
              >
                <span className="min-w-0 truncate text-foreground">
                  {row.symbol ? (
                    <span className="font-mono font-semibold">{row.symbol}</span>
                  ) : null}
                  {row.symbol ? (
                    <span className="text-muted"> · {row.name}</span>
                  ) : (
                    row.name
                  )}
                </span>
                <span className="shrink-0 tabular-nums text-muted">
                  {formatFundPct(row.weightPct)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <p className="text-[11px] text-muted">{YAHOO_FUNDS_ATTRIBUTION}</p>
    </div>
  );
}
