"use client";

import { Activity } from "lucide-react";
import type { PatternTrendForecast } from "@/app/types/intelligence";
import {
  ResearchMetricList,
  ResearchSection,
} from "@/components/research/ResearchMemoPrimitives";
import { formatFriendlyDate } from "@/lib/dateUtils";
import {
  filterBenchmarkIndicators,
  isPatternForecastBenchmark,
  patternForecastBenchmarkNotice,
} from "@/lib/modelBenchmark";
import {
  formatPatternPercent,
  hasPatternForecast,
  isOutperformSpyScheme,
  isRankingPortfolioStrategy,
  patternIndicatorRows,
  patternPredictedClassLabel,
  patternPredictedClassProbability,
  patternProbabilityRows,
  patternRankingScore,
} from "@/lib/patternForecast";
import { cn } from "@/lib/utils";

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
      <div className="h-1.5 overflow-hidden bg-muted/20">
        <div
          className={cn(
            "h-full transition-all",
            selected ? selectedBarClass : "bg-muted/50",
          )}
          style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }}
        />
      </div>
    </div>
  );
}

function marketStrengthExplanation(forecast: PatternTrendForecast): string {
  if (isOutperformSpyScheme(forecast.labelScheme)) {
    return forecast.prediction === 1
      ? "This stock has recently shown stronger market strength than SPY."
      : "This stock has recently lagged the broader market.";
  }
  if (forecast.prediction === 1) {
    return "Recent price behavior points to improving short-term strength.";
  }
  if (forecast.prediction === -1) {
    return "Recent price behavior points to weaker short-term strength.";
  }
  return "Recent price behavior looks mixed, with no clear strength edge.";
}

function probabilityLabel(forecast: PatternTrendForecast): string {
  return isOutperformSpyScheme(forecast.labelScheme)
    ? "Performance vs market"
    : "Chance of moving up";
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
  const predictedClass = isBenchmark
    ? null
    : patternPredictedClassLabel(forecast);
  const predictedClassProb = isBenchmark
    ? null
    : patternPredictedClassProbability(forecast);
  const summaryItems = isBenchmark
    ? [
        { label: "As of", value: formatFriendlyDate(forecast.asOfDate) },
        { label: "Horizon", value: `${forecast.horizonDays} sessions` },
      ]
    : [
        ...(usesRanking
          ? [
              {
                label: "Relative strength score",
                value: formatPatternPercent(rankingScore),
              },
            ]
          : []),
        {
          label: probabilityLabel(forecast),
          value: formatPatternPercent(forecast.upProb),
        },
        ...(predictedClass
          ? [
              {
                label: "Strength vs SPY",
                value: predictedClass,
                note:
                  predictedClassProb != null
                    ? formatPatternPercent(predictedClassProb)
                    : undefined,
              },
            ]
          : []),
        { label: "As of", value: formatFriendlyDate(forecast.asOfDate) },
        { label: "Horizon", value: `${forecast.horizonDays} sessions` },
      ];

  return (
    <ResearchSection title="Market strength" className={className}>
      <div className="space-y-5">
        {isBenchmark ? (
          <div className="space-y-3 border-b border-border/60 pb-5">
            <p className="mt-2 text-sm leading-relaxed text-foreground">
              {benchmarkNotice}
            </p>
            <ResearchMetricList items={summaryItems} columns={2} />
          </div>
        ) : (
          <div className="space-y-3 border-b border-border/60 pb-5">
            <p className="text-sm leading-relaxed text-foreground">
              {marketStrengthExplanation(forecast)}
            </p>
            <p className="text-xs leading-relaxed text-muted">
              Technical details: this measures whether the stock is stronger or
              weaker than SPY, not a guaranteed direction call.
            </p>
            <ResearchMetricList items={summaryItems} columns={3} />
          </div>
        )}

        {!isBenchmark && !forecast.inTrainingUniverse ? (
          <p className="border-b border-border/60 pb-5 text-xs text-warning">
            This symbol is outside the model&apos;s trained universe (
            {forecast.trainingUniverse?.toUpperCase() ?? "TOP20"}). Treat the
            forecast as exploratory.
          </p>
        ) : null}

        {!isBenchmark ? (
          <div className="space-y-3 border-b border-border/60 pb-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Technical detail
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
          <div className="space-y-3 border-b border-border/60 pb-5">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
              <Activity className="h-3.5 w-3.5" aria-hidden />
              {isBenchmark ? "Technical inputs" : "Technical inputs"}
            </div>
            <ResearchMetricList
              items={indicators.map((row) => ({
                label: row.label,
                value: row.value,
              }))}
              columns={3}
            />
          </div>
        ) : null}
      </div>
    </ResearchSection>
  );
}
