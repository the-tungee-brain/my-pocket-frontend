"use client";

import { useSecRatios } from "@/app/hooks/useSecResearch";
import { useSession } from "next-auth/react";
import type { SecPeriod } from "@/lib/secUtils";
import {
  formatGrowthPct,
  formatLargeUsd,
  formatRatioPct,
  formatSecPeriodLabel,
} from "@/lib/secUtils";
import { cn } from "@/lib/utils";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";

type SecRatiosSectionProps = {
  symbol: string;
  period: SecPeriod;
};

export function SecRatiosSection({ symbol, period }: SecRatiosSectionProps) {
  const { data: session } = useSession();
  const { ratios, isLoading, error } = useSecRatios(symbol, period, 8, {
    accessToken: session?.accessToken,
  });

  if (isLoading) {
    return <LoadingTable rows={4} />;
  }

  if (error) {
    return <ErrorBanner message={error} />;
  }

  if (!ratios?.snapshots.length) {
    return (
      <p className="text-sm text-muted">No SEC ratio history is available.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="min-w-full divide-y divide-border text-sm">
        <thead className="bg-surface-elevated/60">
          <tr>
            <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">
              Period
            </th>
            <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted">
              Gross
            </th>
            <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted">
              Operating
            </th>
            <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted">
              Net
            </th>
            <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted">
              ROE
            </th>
            <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted">
              FCF
            </th>
            <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted">
              Rev YoY
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {ratios.snapshots.map((row) => (
            <tr
              key={`${row.end}-${row.fiscal_period}`}
              className="bg-secondary/20"
            >
              <td className="px-3 py-2.5 font-medium text-foreground">
                {formatSecPeriodLabel(row.end, row.fiscal_period)}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums">
                {formatRatioPct(row.gross_margin)}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums">
                {formatRatioPct(row.operating_margin)}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums">
                {formatRatioPct(row.net_margin)}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums">
                {formatRatioPct(row.roe)}
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums">
                {formatLargeUsd(row.free_cash_flow)}
              </td>
              <td
                className={cn(
                  "px-3 py-2.5 text-right tabular-nums",
                  (row.revenue_growth_yoy ?? 0) >= 0
                    ? "text-success"
                    : "text-danger",
                )}
              >
                {formatGrowthPct(row.revenue_growth_yoy)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LoadingTable({ rows }: { rows: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-8 rounded"
          style={{ width: `${100 - i * 5}%` }}
        />
      ))}
    </div>
  );
}
