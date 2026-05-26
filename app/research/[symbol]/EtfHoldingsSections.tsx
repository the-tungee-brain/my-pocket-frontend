"use client";

import Link from "next/link";
import type { EtfHoldingsContext } from "@/app/types/research";
import { symbolHubPath } from "@/lib/symbolRoutes";

type Props = {
  breakdown: Record<string, number>;
  limit?: number;
};

export function EtfSectorBreakdown({ breakdown, limit = 8 }: Props) {
  const sectors = Object.entries(breakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  if (sectors.length === 0) {
    return (
      <p className="text-sm text-muted">Sector breakdown is not available.</p>
    );
  }

  const maxWeight = sectors[0]?.[1] ?? 1;

  return (
    <div className="space-y-2">
      {sectors.map(([sector, weight]) => (
        <div key={sector} className="space-y-1">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="truncate text-foreground">{sector}</span>
            <span className="shrink-0 tabular-nums text-muted">
              {weight.toFixed(2)}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted-bg">
            <div
              className="h-full rounded-full bg-accent-strong/80"
              style={{ width: `${Math.max((weight / maxWeight) * 100, 4)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

type TableProps = {
  holdings: EtfHoldingsContext["holdings"];
  totalHoldings?: number;
  limit?: number;
  compact?: boolean;
};

export function EtfHoldingsTable({
  holdings,
  totalHoldings,
  limit,
  compact = false,
}: TableProps) {
  const rows = limit ? holdings.slice(0, limit) : holdings;

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted">No holdings were returned for this ETF.</p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-background/70 text-[11px] uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Ticker</th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Weight</th>
              {!compact ? (
                <th className="px-3 py-2 font-medium">Sector</th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((holding) => (
              <tr key={`${holding.ticker ?? holding.name}-${holding.weight_pct}`}>
                <td className="px-3 py-2 font-mono text-xs font-semibold">
                  {holding.ticker ? (
                    <Link
                      href={symbolHubPath(holding.ticker, "overview")}
                      className="text-accent-strong hover:underline"
                    >
                      {holding.ticker}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="max-w-[12rem] truncate px-3 py-2 text-foreground">
                  {holding.name}
                </td>
                <td className="px-3 py-2 tabular-nums text-foreground">
                  {holding.weight_pct.toFixed(2)}%
                </td>
                {!compact ? (
                  <td className="px-3 py-2 text-muted">
                    {holding.sector ?? "—"}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalHoldings != null && rows.length < totalHoldings ? (
        <p className="text-xs text-muted">
          Showing {rows.length} of {totalHoldings.toLocaleString()} holdings.
        </p>
      ) : null}
    </div>
  );
}

export function EtfFundStats({
  holdings,
}: {
  holdings: EtfHoldingsContext;
}) {
  const stats = [
    holdings.aum ? { label: "AUM", value: holdings.aum } : null,
    holdings.expense_ratio
      ? { label: "Expense ratio", value: holdings.expense_ratio }
      : null,
    holdings.dividend_yield
      ? { label: "Dividend yield", value: holdings.dividend_yield }
      : null,
    {
      label: "Holdings count",
      value: holdings.total_holdings.toLocaleString(),
    },
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-border bg-background/60 px-3 py-2.5"
        >
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
            {stat.label}
          </p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
