"use client";

import { Target } from "lucide-react";
import type { StreetAnalysisSnapshot } from "@/app/hooks/streetAnalysisTypes";
import {
  formatEstimateGrowth,
  formatEstimateRange,
  formatStreetPrice,
  formatStreetUpside,
  hasStreetAnalysis,
} from "@/lib/streetAnalysisUtils";
import { cn } from "@/lib/utils";

type StreetAnalysisSectionProps = {
  street: StreetAnalysisSnapshot | null | undefined;
  isLoading?: boolean;
  compact?: boolean;
};

function RecommendationBar({
  recommendation,
}: {
  recommendation: NonNullable<StreetAnalysisSnapshot["recommendation"]>;
}) {
  const segments = [
    { key: "strongBuy", label: "Strong buy", count: recommendation.strongBuy, className: "bg-accent-strong" },
    { key: "buy", label: "Buy", count: recommendation.buy, className: "bg-accent/70" },
    { key: "hold", label: "Hold", count: recommendation.hold, className: "bg-muted" },
    { key: "sell", label: "Sell", count: recommendation.sell, className: "bg-danger/60" },
    { key: "strongSell", label: "Strong sell", count: recommendation.strongSell, className: "bg-danger" },
  ];
  const total = segments.reduce((sum, s) => sum + s.count, 0);
  if (total <= 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex h-2 overflow-hidden rounded-full bg-muted-bg">
        {segments.map((segment) =>
          segment.count > 0 ? (
            <div
              key={segment.key}
              className={cn(segment.className, "min-w-0.5")}
              style={{ width: `${(segment.count / total) * 100}%` }}
              title={`${segment.label}: ${segment.count}`}
            />
          ) : null,
        )}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted">
        {segments.map(
          (segment) =>
            segment.count > 0 && (
              <span key={segment.key}>
                {segment.label} {segment.count}
              </span>
            ),
        )}
      </div>
    </div>
  );
}

export function StreetAnalysisSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("space-y-3", compact ? "" : "rounded-xl border border-border bg-secondary/40 p-4")}>
      <div className="h-4 w-32 animate-pulse rounded bg-muted-bg" />
      <div className="h-16 animate-pulse rounded-lg bg-muted-bg" />
      <div className="h-10 animate-pulse rounded-lg bg-muted-bg" />
    </div>
  );
}

export function StreetAnalysisSection({
  street,
  isLoading,
  compact = false,
}: StreetAnalysisSectionProps) {
  if (isLoading) {
    return <StreetAnalysisSkeleton compact={compact} />;
  }

  if (!hasStreetAnalysis(street)) {
    return (
      <p className="text-sm text-muted">
        Street consensus data isn&apos;t available for this symbol.
      </p>
    );
  }

  const targets = street.priceTargets;

  return (
    <div className={cn("space-y-4", compact ? "" : "")}>
      {(street.consensusLabel || street.recommendation) && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              Analyst consensus
            </span>
            {street.consensusLabel ? (
              <span className="rounded-full border border-accent/30 bg-accent-muted px-2 py-0.5 text-[11px] font-semibold text-accent-strong">
                {street.consensusLabel}
              </span>
            ) : null}
          </div>
          {street.recommendation ? (
            <RecommendationBar recommendation={street.recommendation} />
          ) : null}
        </div>
      )}

      {targets && (targets.mean != null || targets.low != null || targets.high != null) ? (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
            <Target className="h-3 w-3" aria-hidden />
            Price targets
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Low", value: targets.low },
              { label: "Mean", value: targets.mean },
              { label: "Median", value: targets.median },
              { label: "High", value: targets.high },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-border bg-background/60 px-2.5 py-2"
              >
                <p className="text-[10px] text-muted">{item.label}</p>
                <p className="text-sm font-semibold tabular-nums text-foreground">
                  {formatStreetPrice(item.value)}
                </p>
              </div>
            ))}
          </div>
          {targets.upsideToMeanPct != null ? (
            <p className="text-xs text-muted">
              {formatStreetUpside(targets.upsideToMeanPct)}
              {targets.current != null ? (
                <span className="text-foreground">
                  {" "}
                  · last {formatStreetPrice(targets.current)}
                </span>
              ) : null}
            </p>
          ) : null}
        </div>
      ) : null}

      {!compact && street.estimateRevisionHeadline ? (
        <p className="rounded-lg border border-accent/20 bg-accent-muted/30 px-3 py-2 text-xs leading-relaxed text-foreground">
          {street.estimateRevisionHeadline}
        </p>
      ) : null}

      <p className="text-[10px] text-muted">Street estimates via Yahoo Finance.</p>
    </div>
  );
}

export function StreetEarningsEstimates({
  street,
  embedded = true,
}: {
  street: StreetAnalysisSnapshot | null | undefined;
  embedded?: boolean;
}) {
  if (!hasStreetAnalysis(street)) return null;

  const eps = street.nextQuarterEps;
  const revenue = street.nextQuarterRevenue;
  const hasEstimates = eps?.avg != null || revenue?.avg != null;

  if (!hasEstimates && !street.estimateRevisionHeadline) return null;

  return (
    <div
      className={cn(
        "space-y-3",
        embedded && "border-t border-border pt-4",
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        Street estimates (next quarter)
      </p>

      {street.estimateRevisionHeadline ? (
        <p className="rounded-lg border border-accent/20 bg-accent-muted/30 px-3 py-2 text-xs leading-relaxed text-foreground">
          {street.estimateRevisionHeadline}
        </p>
      ) : null}

      {hasEstimates ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {eps?.avg != null ? (
            <div className="rounded-lg border border-border bg-background/60 px-3 py-2.5">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
                EPS consensus
              </p>
              <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
                {formatEstimateRange(eps)}
              </p>
              <p className="mt-1 text-[11px] text-muted">
                {eps.analystCount != null ? `${eps.analystCount} analysts` : "Analyst count n/a"}
                {formatEstimateGrowth(eps.growthPct)
                  ? ` · ${formatEstimateGrowth(eps.growthPct)}`
                  : ""}
              </p>
            </div>
          ) : null}
          {revenue?.avg != null ? (
            <div className="rounded-lg border border-border bg-background/60 px-3 py-2.5">
              <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
                Revenue consensus
              </p>
              <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
                {formatEstimateRange(revenue)}
              </p>
              <p className="mt-1 text-[11px] text-muted">
                {revenue.analystCount != null
                  ? `${revenue.analystCount} analysts`
                  : "Analyst count n/a"}
                {formatEstimateGrowth(revenue.growthPct)
                  ? ` · ${formatEstimateGrowth(revenue.growthPct)}`
                  : ""}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
