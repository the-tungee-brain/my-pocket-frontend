"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, TrendingUp } from "lucide-react";
import type { PortfolioRankingDashboard, PortfolioRankingRow } from "@/app/types/intelligence";
import { useAccountPlan } from "@/app/hooks/useAccountPlan";
import { fetchPortfolioRankingDashboard } from "@/lib/apiClient";
import { hasProFeature } from "@/lib/planFeatures";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { ProFeatureGate } from "@/components/ProFeatureGate";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { formatFriendlyDate } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  limit?: number;
};

function formatRankChange(change: number | null | undefined) {
  if (change == null || change === 0) return "—";
  const prefix = change > 0 ? "+" : "";
  return `${prefix}${change}`;
}

function formatScoreChange(change: number | null | undefined) {
  if (change == null || Math.abs(change) < 0.001) return "—";
  const pct = change * 100;
  const prefix = pct > 0 ? "+" : "";
  return `${prefix}${pct.toFixed(1)} pts`;
}

function RankingTable({
  title,
  rows,
  icon: Icon,
  limit = 10,
}: {
  title: string;
  rows: PortfolioRankingRow[];
  icon: typeof TrendingUp;
  limit?: number;
}) {
  if (rows.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {title}
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-border bg-background/60 text-[10px] uppercase tracking-wide text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Symbol</th>
              <th className="px-3 py-2 font-medium">Rank</th>
              <th className="px-3 py-2 font-medium">Δ Rank</th>
              <th className="px-3 py-2 font-medium">Δ Score</th>
              <th className="px-3 py-2 font-medium">Trend</th>
              <th className="px-3 py-2 font-medium">RS</th>
              <th className="px-3 py-2 font-medium">Thesis</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, limit).map((row) => (
              <tr key={`${title}-${row.symbol}`} className="border-b border-border/60 last:border-0">
                <td className="px-3 py-2 font-semibold">
                  <Link href={`/research/${row.symbol}/overview`} className="hover:text-accent-strong">
                    {row.symbol}
                  </Link>
                </td>
                <td className="px-3 py-2 tabular-nums">{row.rank}</td>
                <td
                  className={cn(
                    "px-3 py-2 tabular-nums",
                    (row.rankChange ?? 0) > 0 && "text-success",
                    (row.rankChange ?? 0) < 0 && "text-danger",
                  )}
                >
                  {formatRankChange(row.rankChange)}
                </td>
                <td
                  className={cn(
                    "px-3 py-2 tabular-nums",
                    (row.scoreChange ?? 0) > 0 && "text-success",
                    (row.scoreChange ?? 0) < 0 && "text-danger",
                  )}
                >
                  {formatScoreChange(row.scoreChange)}
                </td>
                <td className="px-3 py-2">{row.trend}</td>
                <td className="px-3 py-2 tabular-nums">
                  {row.relativeStrength != null
                    ? `${(row.relativeStrength * 100).toFixed(1)}%`
                    : "—"}
                </td>
                <td className="max-w-xs px-3 py-2 text-xs text-muted">{row.thesisSummary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PortfolioRankingDashboardSection({ className, limit = 10 }: Props) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const { plan } = useAccountPlan(accessToken);
  const allowed = hasProFeature(plan, "patternTrend");

  const [data, setData] = useState<PortfolioRankingDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !allowed) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPortfolioRankingDashboard(accessToken)
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, allowed]);

  return (
    <ProFeatureGate feature="patternTrend" allowed={allowed} className={className}>
      <ResearchSectionCard
        title="Model C rankings"
        description="Cross-sectional ranking across the TOP20 training universe"
        icon={TrendingUp}
        className={className}
      >
        {loading ? <p className="text-sm text-muted">Loading rankings…</p> : null}
        {error ? <ErrorBanner message={error} /> : null}
        {data ? (
          <div className="app-stack">
            <p className="text-xs text-muted">
              As of {formatFriendlyDate(data.asOfDate ?? "")} · {data.universeSize} names ranked
            </p>
            <RankingTable title="Top 10" rows={data.top10} icon={ArrowUpRight} limit={limit} />
            <RankingTable title="Bottom 10" rows={data.bottom10} icon={ArrowDownRight} limit={limit} />
            <RankingTable
              title="Biggest upgrades"
              rows={data.biggestUpgrades}
              icon={ArrowUpRight}
              limit={limit}
            />
            <RankingTable
              title="Biggest downgrades"
              rows={data.biggestDowngrades}
              icon={ArrowDownRight}
              limit={limit}
            />
          </div>
        ) : null}
      </ResearchSectionCard>
    </ProFeatureGate>
  );
}
