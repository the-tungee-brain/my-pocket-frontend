"use client";

import { Activity, ArrowDownRight, ArrowUpRight, Minus, TrendingUp } from "lucide-react";
import type { PatternTrendForecast } from "@/app/types/intelligence";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { KpiStat } from "@/components/ui/KpiStat";
import {
  formatPatternPercent,
  hasPatternForecast,
  isRankingPortfolioStrategy,
  patternDirectionLabel,
  patternDirectionSubtitle,
  patternDirectionTone,
  patternIndicatorRows,
  patternModelSummary,
  patternPortfolioSummary,
  patternProbabilityRows,
  patternRankingBadgeLabel,
  patternRankingBadgeTone,
  patternRankingScore,
  patternUpProbLabel,
} from "@/lib/patternForecast";
import { formatFriendlyDate } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

type Props = {
  forecast: PatternTrendForecast | null | undefined;
  className?: string;
};

const toneBorderClass = {
  positive: "border-success/25 bg-success/5",
  negative: "border-danger/25 bg-danger/5",
  neutral: "border-border bg-background/40",
  warning: "border-warning/25 bg-warning/5",
} as const;

const toneTextClass = {
  positive: "text-success",
  negative: "text-danger",
  neutral: "text-muted",
  warning: "text-warning",
} as const;

function DirectionIcon({
  forecast,
  className,
}: {
  forecast: PatternTrendForecast;
  className?: string;
}) {
  const tone = patternDirectionTone(forecast);
  const Icon =
    tone === "positive"
      ? ArrowUpRight
      : tone === "negative"
        ? ArrowDownRight
        : Minus;

  return (
    <div
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
        toneBorderClass[tone],
        className,
      )}
    >
      <Icon className={cn("h-5 w-5", toneTextClass[tone])} aria-hidden />
    </div>
  );
}

function ProbabilityBar({
  label,
  value,
  selected,
}: {
  label: string;
  value: number;
  selected: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className={cn("font-medium", selected ? "text-foreground" : "text-muted")}>
          {label}
        </span>
        <span className={cn("tabular-nums", selected ? "text-foreground" : "text-muted")}>
          {formatPatternPercent(value)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-background/70">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            selected ? "bg-accent-strong" : "bg-muted/50",
          )}
          style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }}
        />
      </div>
    </div>
  );
}

export function PatternTrendForecastCard({ forecast, className }: Props) {
  if (!hasPatternForecast(forecast)) return null;

  const directionTone = patternDirectionTone(forecast);
  const rankingBadge = patternRankingBadgeLabel(forecast);
  const rankingTone = patternRankingBadgeTone(forecast);
  const portfolioSummary = patternPortfolioSummary(forecast);
  const modelSummary = patternModelSummary(forecast);
  const indicators = patternIndicatorRows(forecast.indicators);
  const probabilities = patternProbabilityRows(forecast);
  const rankingScore = patternRankingScore(forecast);
  const usesRanking = isRankingPortfolioStrategy(forecast);

  return (
    <ResearchSectionCard
      title="5-day alpha model"
      description={
        usesRanking
          ? "Relative strength + trend ranking for the next 5 trading sessions"
          : "Machine-learning estimate for the next 5 trading sessions"
      }
      icon={TrendingUp}
      className={className}
    >
      <div className="app-stack">
        <div
          className={cn(
            "rounded-xl border p-4",
            toneBorderClass[directionTone],
          )}
        >
          <div className="flex items-start gap-3">
            <DirectionIcon forecast={forecast} />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-semibold text-foreground">
                  {patternDirectionLabel(forecast)}
                </p>
                {rankingBadge ? (
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      toneBorderClass[rankingTone],
                      toneTextClass[rankingTone],
                    )}
                  >
                    {rankingBadge}
                  </span>
                ) : null}
              </div>
              <p className="text-sm leading-relaxed text-muted">
                {patternDirectionSubtitle(forecast)}
              </p>
              {portfolioSummary ? (
                <p className="text-xs text-muted">{portfolioSummary}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {usesRanking ? (
              <KpiStat
                label="Ranking score"
                value={formatPatternPercent(rankingScore)}
                tone={
                  rankingTone === "positive"
                    ? "positive"
                    : rankingTone === "warning"
                      ? "warning"
                      : "default"
                }
              />
            ) : null}
            <KpiStat
              label={patternUpProbLabel(forecast)}
              value={formatPatternPercent(forecast.upProb)}
              tone={directionTone === "positive" ? "positive" : "default"}
            />
            <KpiStat
              label="As of"
              value={formatFriendlyDate(forecast.asOfDate)}
            />
            <KpiStat
              label="Horizon"
              value={`${forecast.horizonDays} sessions`}
            />
          </div>
        </div>

        {!forecast.inTrainingUniverse ? (
          <p className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning">
            This symbol is outside the model&apos;s trained universe (
            {forecast.trainingUniverse?.toUpperCase() ?? "TOP20"}). Treat the
            forecast as exploratory.
          </p>
        ) : null}

        <div className="space-y-3 rounded-xl border border-border bg-background/40 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Class probabilities
          </p>
          <div className="space-y-3">
            {probabilities.map((row) => (
              <ProbabilityBar
                key={row.label}
                label={row.label}
                value={row.value}
                selected={row.selected}
              />
            ))}
          </div>
        </div>

        {indicators.length > 0 ? (
          <div className="space-y-3 rounded-xl border border-border bg-background/40 p-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
              <Activity className="h-3.5 w-3.5" aria-hidden />
              Relative strength & trend
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {indicators.map((row) => (
                <div
                  key={row.key}
                  className="rounded-lg border border-border bg-surface-elevated/40 px-3 py-2"
                >
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
                    {row.label}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
                    {row.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {modelSummary || forecast.modelTrainEndDate ? (
          <p className="text-xs text-muted">
            {modelSummary ? `${modelSummary}. ` : null}
            {forecast.modelTrainEndDate
              ? `Model trained through ${formatFriendlyDate(forecast.modelTrainEndDate)}. `
              : null}
            Not investment advice.
          </p>
        ) : (
          <p className="text-xs text-muted">Not investment advice.</p>
        )}
      </div>
    </ResearchSectionCard>
  );
}
