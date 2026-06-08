"use client";

import { useMomentumBreakoutPaperPerformance } from "@/app/hooks/useMomentumBreakoutPaperPerformance";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { SkeletonList } from "@/components/ui/Skeleton";
import { formatPct, formatRatio } from "@/lib/momentumBreakoutPaperPerformance";
import { cn } from "@/lib/utils";

type Props = {
  accessToken: string;
  className?: string;
};

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border/60 bg-surface/40 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  );
}

function BucketTable({
  title,
  rows,
}: {
  title: string;
  rows: {
    key: string;
    tradeCount: number;
    winRate: number | null;
    expectancy: number | null;
    profitFactor: number | null;
  }[];
}) {
  if (rows.length === 0) {
    return (
      <p className="text-xs text-muted">No {title.toLowerCase()} data yet.</p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[320px] text-left text-xs">
        <thead>
          <tr className="border-b border-border/60 text-muted">
            <th className="py-2 pr-3 font-medium">{title}</th>
            <th className="py-2 pr-3 font-medium">Trades</th>
            <th className="py-2 pr-3 font-medium">Win rate</th>
            <th className="py-2 pr-3 font-medium">Expectancy</th>
            <th className="py-2 font-medium">PF</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-border/40">
              <td className="py-2 pr-3 font-medium text-foreground">
                {row.key}
              </td>
              <td className="py-2 pr-3 tabular-nums text-muted">
                {row.tradeCount}
              </td>
              <td className="py-2 pr-3 tabular-nums">
                {formatPct(row.winRate)}
              </td>
              <td className="py-2 pr-3 tabular-nums">
                {formatPct(row.expectancy)}
              </td>
              <td className="py-2 tabular-nums">
                {formatRatio(row.profitFactor)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MomentumBreakoutPaperPerformanceTab({
  accessToken,
  className,
}: Props) {
  const {
    meta,
    summary,
    bySymbol,
    byRegime,
    recentTrades,
    loading,
    error,
    reload,
  } = useMomentumBreakoutPaperPerformance(accessToken);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="border border-primary/20 bg-primary/5 px-3 py-2">
        <p className="text-xs font-semibold text-foreground">
          {meta?.label ?? "Practice tracking (optional)"}
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">
          {meta?.disclaimer ??
            "Simulated outcomes from monitored trade-plan levels only. Not brokerage execution."}
        </p>
        <p className="mt-2 text-[10px] text-muted">
          Hypothetical practice results only — not the same as your live
          watchlist.
        </p>
      </div>

      {error && <ErrorBanner message={error} onRetry={() => void reload()} />}

      {loading && !summary && !error && <SkeletonList rows={4} />}

      {summary && (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatCell
              label="Total alerts"
              value={String(summary.totalAlerts)}
            />
            <StatCell
              label="Triggered"
              value={String(summary.triggeredAlerts)}
            />
            <StatCell label="Wins" value={formatPct(summary.winRate)} />
            <StatCell
              label="Avg return"
              value={formatPct(summary.expectancy)}
            />
            <StatCell
              label="Profit score"
              value={formatRatio(summary.profitFactor)}
            />
            <StatCell
              label="Avg holding (days)"
              value={
                summary.averageHoldingDays != null
                  ? summary.averageHoldingDays.toFixed(1)
                  : "—"
              }
            />
            <StatCell
              label="Max drawdown"
              value={formatPct(summary.maxDrawdown)}
            />
            <StatCell
              label="Open paper trades"
              value={String(summary.currentOpenTrades)}
            />
          </div>

          <div>
            <h3 className="text-xs font-semibold text-foreground">
              Recent completed paper trades
            </h3>
            {recentTrades.length === 0 ? (
              <p className="mt-2 text-xs text-muted">
                No completed paper trades yet.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {recentTrades.map((trade) => (
                  <li
                    key={trade.alertId}
                    className="flex flex-wrap items-center justify-between gap-2 border border-border/50 px-3 py-2 text-xs"
                  >
                    <span className="font-semibold text-foreground">
                      {trade.symbol}
                    </span>
                    <span className="text-muted">
                      {trade.status.replace(/_/g, " ")}
                    </span>
                    <span
                      className={cn(
                        "tabular-nums font-medium",
                        (trade.outcomeReturnPct ?? 0) >= 0
                          ? "text-success"
                          : "text-danger",
                      )}
                    >
                      {formatPct(trade.outcomeReturnPct)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold text-foreground">
              By symbol
            </h3>
            <BucketTable title="Symbol" rows={bySymbol} />
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold text-foreground">
              By market regime
            </h3>
            <BucketTable title="Regime" rows={byRegime} />
          </div>
        </>
      )}
    </div>
  );
}
