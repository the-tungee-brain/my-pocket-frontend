"use client";

import { useEffect, useMemo, useState } from "react";
import { Target } from "lucide-react";
import type {
  AnalystRatingAction,
  EstimatePeriodKey,
  PeriodEstimate,
  StreetAnalysisSnapshot,
} from "@/app/hooks/streetAnalysisTypes";
import { ESTIMATE_PERIOD_KEYS } from "@/app/hooks/streetAnalysisTypes";
import {
  formatEstimateGrowth,
  yahooEstimatesAttribution,
  formatEstimateRange,
  formatRatingActionDate,
  estimateForPeriod,
  formatRatingActionLine,
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

function EstimatePeriodChips({
  periods,
  selected,
  onSelect,
}: {
  periods: EstimatePeriodKey[];
  selected: EstimatePeriodKey;
  onSelect: (key: EstimatePeriodKey) => void;
}) {
  if (periods.length <= 1) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {periods.map((key) => {
        const label =
          key === "0q"
            ? "This Q"
            : key === "+1q"
              ? "Next Q"
              : key === "0y"
                ? "This FY"
                : "Next FY";
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-semibold transition",
              selected === key
                ? "border-accent/40 bg-accent-muted text-accent-strong"
                : "border-border bg-background/60 text-muted hover:text-foreground",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

function EstimateInsight({ headline }: { headline: string }) {
  return (
    <p className="rounded-lg border border-accent/20 bg-accent-muted/30 px-3 py-2 text-xs leading-relaxed text-foreground">
      {headline}
    </p>
  );
}

function ratingActionTone(action: AnalystRatingAction): string {
  const token = `${action.action ?? ""} ${action.toGrade}`.toLowerCase();
  if (token.includes("down") || token.includes("sell") || token.includes("under")) {
    return "text-danger";
  }
  if (token.includes("up") || token.includes("buy") || token.includes("outperform")) {
    return "text-success";
  }
  return "text-foreground";
}

function RecentRatingActions({ actions }: { actions: AnalystRatingAction[] }) {
  if (actions.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        Recent analyst actions
      </p>
      <ul className="space-y-1.5">
        {actions.map((item) => (
          <li
            key={`${item.date}-${item.firm}-${item.toGrade}`}
            className="flex gap-2 text-xs leading-snug"
          >
            <span className="shrink-0 tabular-nums text-muted">
              {formatRatingActionDate(item.date)}
            </span>
            <span className={cn("min-w-0", ratingActionTone(item))}>
              {formatRatingActionLine(item)}
            </span>
          </li>
        ))}
      </ul>
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
        Analyst consensus isn&apos;t available for this symbol.
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

      {!compact && street.estimateDriftHeadline ? (
        <EstimateInsight headline={street.estimateDriftHeadline} />
      ) : null}

      {!compact && street.estimateRevisionHeadline ? (
        <EstimateInsight headline={street.estimateRevisionHeadline} />
      ) : null}

      {!compact && street.growthContextHeadline ? (
        <EstimateInsight headline={street.growthContextHeadline} />
      ) : null}

      {!compact && street.ratingTrendHeadline ? (
        <EstimateInsight headline={street.ratingTrendHeadline} />
      ) : null}

      {!compact && street.recentRatingActions?.length ? (
        <RecentRatingActions actions={street.recentRatingActions} />
      ) : null}

      <p className="text-[11px] text-muted">
        {yahooEstimatesAttribution(street.dataAsOf)}
      </p>
    </div>
  );
}

function EstimateMetricCard({
  title,
  estimate,
}: {
  title: string;
  estimate: PeriodEstimate;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/60 px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
        {title}
      </p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
        {formatEstimateRange(estimate)}
      </p>
      <p className="mt-1 text-[11px] text-muted">
        {estimate.analystCount != null
          ? `${estimate.analystCount} analysts`
          : "Analyst count n/a"}
        {formatEstimateGrowth(estimate.growthPct)
          ? ` · ${formatEstimateGrowth(estimate.growthPct)}`
          : ""}
      </p>
    </div>
  );
}

export function StreetEarningsEstimates({
  street,
  embedded = true,
  defaultEstimatePeriod,
}: {
  street: StreetAnalysisSnapshot | null | undefined;
  embedded?: boolean;
  /** Prefer 0q when viewing upcoming earnings for the current quarter. */
  defaultEstimatePeriod?: EstimatePeriodKey;
}) {
  const availablePeriods = useMemo(() => {
    if (!street) return [] as EstimatePeriodKey[];
    return ESTIMATE_PERIOD_KEYS.filter(
      (key) =>
        estimateForPeriod(street.epsEstimates, key)?.avg != null ||
        estimateForPeriod(street.revenueEstimates, key)?.avg != null,
    );
  }, [street]);

  const resolvedDefault = useMemo(() => {
    if (
      defaultEstimatePeriod &&
      availablePeriods.includes(defaultEstimatePeriod)
    ) {
      return defaultEstimatePeriod;
    }
    if (availablePeriods.includes("0q")) return "0q" as EstimatePeriodKey;
    if (availablePeriods.includes("+1q")) return "+1q" as EstimatePeriodKey;
    return availablePeriods[0] ?? ("+1q" as EstimatePeriodKey);
  }, [availablePeriods, defaultEstimatePeriod]);

  const [period, setPeriod] = useState<EstimatePeriodKey>(resolvedDefault);

  useEffect(() => {
    setPeriod(resolvedDefault);
  }, [resolvedDefault]);

  const activePeriod = availablePeriods.includes(period)
    ? period
    : resolvedDefault;

  if (!hasStreetAnalysis(street)) return null;

  const eps =
    estimateForPeriod(street.epsEstimates, activePeriod) ??
    (activePeriod === "+1q" ? street.nextQuarterEps : null);
  const revenue =
    estimateForPeriod(street.revenueEstimates, activePeriod) ??
    (activePeriod === "+1q" ? street.nextQuarterRevenue : null);
  const hasEstimates = eps?.avg != null || revenue?.avg != null;
  const periodLabel =
    eps?.label ?? revenue?.label ?? "Selected period";

  if (
    !hasEstimates &&
    !street.estimateRevisionHeadline &&
    !street.estimateDriftHeadline &&
    !street.growthContextHeadline &&
    !street.ratingTrendHeadline
  ) {
    return null;
  }

  const estimatePeriodHint =
    defaultEstimatePeriod === "0q" && activePeriod === "0q"
      ? "Estimates for the upcoming report quarter"
      : null;

  return (
    <div
      className={cn(
        "space-y-3",
        embedded && "border-t border-border pt-4",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
          Analyst estimates
        </p>
        <EstimatePeriodChips
          periods={availablePeriods}
          selected={activePeriod}
          onSelect={setPeriod}
        />
      </div>

      {hasEstimates ? (
        <p className="text-[11px] text-muted">
          {estimatePeriodHint ?? periodLabel}
        </p>
      ) : null}

      {street.ratingTrendHeadline ? (
        <EstimateInsight headline={street.ratingTrendHeadline} />
      ) : null}

      {street.estimateDriftHeadline ? (
        <EstimateInsight headline={street.estimateDriftHeadline} />
      ) : null}

      {street.estimateRevisionHeadline ? (
        <EstimateInsight headline={street.estimateRevisionHeadline} />
      ) : null}

      {street.growthContextHeadline ? (
        <EstimateInsight headline={street.growthContextHeadline} />
      ) : null}

      {hasEstimates ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {eps?.avg != null ? (
            <EstimateMetricCard title="EPS consensus" estimate={eps} />
          ) : null}
          {revenue?.avg != null ? (
            <EstimateMetricCard title="Revenue consensus" estimate={revenue} />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
