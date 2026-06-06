"use client";

import { Activity, TrendingUp } from "lucide-react";
import type { PatternTrendForecast } from "@/app/types/intelligence";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { KpiStat } from "@/components/ui/KpiStat";
import { cn } from "@/lib/utils";
import {
  formatPatternPercent,
  hasPatternForecast,
  isRankingPortfolioStrategy,
  patternIndicatorRows,
  patternModelSummary,
  patternPortfolioSummary,
  patternPredictedClassLabel,
  patternPredictedClassProbability,
  patternProbabilityRows,
  patternDirectionTone,
  patternRankingScore,
  patternUpProbLabel,
} from "@/lib/patternForecast";
import {
  filterBenchmarkIndicators,
  isPatternForecastBenchmark,
  patternForecastBenchmarkNotice,
} from "@/lib/modelBenchmark";
import { formatFriendlyDate } from "@/lib/dateUtils";

type Props = {
  forecast: PatternTrendForecast | null | undefined;
  symbol?: string;
  className?: string;
};

function ProbabilityBar({
  label,
  value,
  selected,
}: {
  label: string;
  value: number;
  selected: boolean;
}) {
  const isSpyUnderperform = label === "Likely weaker than SPY";
  const isSpyOutperform = label === "Likely stronger than SPY";
  const selectedToneClass = isSpyOutperform
    ? "text-success"
    : isSpyUnderperform
      ? "text-danger"
      : "text-foreground";
  const selectedBarClass = isSpyOutperform
    ? "bg-success"
    : isSpyUnderperform
      ? "bg-danger"
      : "bg-accent-strong";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span
          className={cn(
            "font-medium",
            selected ? selectedToneClass : "text-muted",
          )}
        >
          {label}
        </span>
        <span
          className={cn(
            "tabular-nums",
            selected ? selectedToneClass : "text-muted",
          )}
        >
          {formatPatternPercent(value)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-background/70">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            selected ? selectedBarClass : "bg-muted/50",
          )}
          style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }}
        />
      </div>
    </div>
  );
}

export function PatternTrendForecastCard({
  forecast,
  symbol,
  className,
}: Props) {
  if (!hasPatternForecast(forecast)) return null;

  const isBenchmark = isPatternForecastBenchmark(forecast, symbol);
  const benchmarkNotice = patternForecastBenchmarkNotice(forecast);
  const indicators = patternIndicatorRows(
    isBenchmark
      ? filterBenchmarkIndicators(forecast.indicators)
      : forecast.indicators,
  );
  const probabilities = isBenchmark ? [] : patternProbabilityRows(forecast);
  const rankingScore = patternRankingScore(forecast);
  const usesRanking = !isBenchmark && isRankingPortfolioStrategy(forecast);
  const portfolioSummary = isBenchmark
    ? null
    : patternPortfolioSummary(forecast);
  const modelSummary = isBenchmark ? null : patternModelSummary(forecast);
  const predictedClass = isBenchmark
    ? null
    : patternPredictedClassLabel(forecast);
  const predictedTone = isBenchmark
    ? "default"
    : patternDirectionTone(forecast);
  const predictedClassTone =
    predictedTone === "neutral" ? "default" : predictedTone;
  const predictedClassProb = isBenchmark
    ? null
    : patternPredictedClassProbability(forecast);

  return (
    <ResearchSectionCard
      title="Relative strength model"
      description={
        isBenchmark
          ? "Quantitative trend and regime inputs · Model C not applicable"
          : "Market-relative model evidence for the next 5 trading sessions"
      }
      icon={TrendingUp}
      className={className}
    >
      <div className="app-stack">
        {isBenchmark ? (
          <div className="rounded-xl border border-border bg-background/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Benchmark notice
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foreground">
              {benchmarkNotice}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
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
        ) : (
          <div className="rounded-xl border border-border bg-background/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Relative strength model
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              This measures market-relative strength, not whether the stock must
              go up.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {usesRanking ? (
                <KpiStat
                  label="Ranking score"
                  value={formatPatternPercent(rankingScore)}
                />
              ) : null}
              <KpiStat
                label={patternUpProbLabel(forecast)}
                value={formatPatternPercent(forecast.upProb)}
              />
              {predictedClass ? (
                <KpiStat
                  label="Relative strength class"
                  value={predictedClass}
                  tone={predictedClassTone}
                  subValue={
                    predictedClassProb != null
                      ? formatPatternPercent(predictedClassProb)
                      : undefined
                  }
                />
              ) : null}
              <KpiStat
                label="As of"
                value={formatFriendlyDate(forecast.asOfDate)}
              />
              <KpiStat
                label="Horizon"
                value={`${forecast.horizonDays} sessions`}
              />
            </div>
            {portfolioSummary ? (
              <p className="mt-3 text-xs text-muted">{portfolioSummary}</p>
            ) : null}
          </div>
        )}

        {!isBenchmark && !forecast.inTrainingUniverse ? (
          <p className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning">
            This symbol is outside the model&apos;s trained universe (
            {forecast.trainingUniverse?.toUpperCase() ?? "TOP20"}). Treat the
            forecast as exploratory.
          </p>
        ) : null}

        {!isBenchmark ? (
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
        ) : null}

        {indicators.length > 0 ? (
          <div className="space-y-3 rounded-xl border border-border bg-background/40 p-3">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
              <Activity className="h-3.5 w-3.5" aria-hidden />
              {isBenchmark ? "Trend indicators" : "Relative strength & trend"}
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
