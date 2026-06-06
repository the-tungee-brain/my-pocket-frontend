import type { PatternTrendForecast } from "@/app/types/intelligence";

export type PatternDirectionTone =
  | "positive"
  | "negative"
  | "neutral"
  | "warning";

const INDICATOR_ROWS: Array<{
  key: string;
  label: string;
  format: "price" | "decimal" | "percent";
  decimals?: number;
}> = [
  { key: "rs_vs_spy_21d", label: "RS vs SPY (21d)", format: "percent" },
  { key: "rs_vs_spy_63d", label: "RS vs SPY (63d)", format: "percent" },
  { key: "rs_vs_spy_126d", label: "RS vs SPY (126d)", format: "percent" },
  { key: "close_vs_sma20", label: "Close vs SMA 20", format: "percent" },
  { key: "close_vs_sma200", label: "Close vs SMA 200", format: "percent" },
  { key: "ret_21d", label: "Return (21d)", format: "percent" },
  { key: "ret_63d", label: "Return (63d)", format: "percent" },
];

export function hasPatternForecast(
  forecast: PatternTrendForecast | null | undefined,
): forecast is PatternTrendForecast {
  return !!forecast?.asOfDate;
}

export function isBinaryPatternScheme(
  labelScheme: string | undefined,
): boolean {
  return (
    labelScheme === "binary_updown" || labelScheme === "binary_outperform_spy"
  );
}

export function isOutperformSpyScheme(
  labelScheme: string | undefined,
): boolean {
  return labelScheme === "binary_outperform_spy";
}

function binaryClassLabels(labelScheme: string | undefined): {
  down: string;
  up: string;
} {
  if (isOutperformSpyScheme(labelScheme)) {
    return {
      down: "Likely weaker than SPY",
      up: "Likely stronger than SPY",
    };
  }
  return { down: "Down", up: "Up" };
}

/** Factual predicted class label for Trend Analysis (not a narrative headline). */
export function patternPredictedClassLabel(
  forecast: PatternTrendForecast,
): string {
  return patternDirectionLabel(forecast);
}

export function patternPredictedClassProbability(
  forecast: PatternTrendForecast,
): number | null {
  const rows = patternProbabilityRows(forecast);
  const selected = rows.find((row) => row.selected);
  return selected?.value ?? forecast.upProb ?? null;
}

export function patternDirectionLabel(forecast: PatternTrendForecast): string {
  if (isOutperformSpyScheme(forecast.labelScheme)) {
    return forecast.prediction === 1
      ? "Likely stronger than SPY"
      : "Likely weaker than SPY";
  }

  if (isBinaryPatternScheme(forecast.labelScheme)) {
    return forecast.prediction === 1 ? "Up" : "Down";
  }

  switch (forecast.prediction) {
    case 1:
      return "Upward setup";
    case -1:
      return "Downward setup";
    default:
      return "Range/flat setup";
  }
}

export function patternDirectionSubtitle(
  forecast: PatternTrendForecast,
): string {
  if (isOutperformSpyScheme(forecast.labelScheme)) {
    return forecast.prediction === 1
      ? "Model expects this name to show stronger relative performance than SPY over the next 5 trading days."
      : "Model expects this name to show weaker relative performance than SPY over the next 5 trading days.";
  }

  if (isBinaryPatternScheme(forecast.labelScheme)) {
    return forecast.prediction === 1
      ? "Model expects a positive move over the next 5 trading days."
      : "Model expects a negative move over the next 5 trading days.";
  }

  switch (forecast.prediction) {
    case 1:
      return "Model expects a move above +0.5% over the next 5 trading days.";
    case -1:
      return "Model expects a move below −0.5% over the next 5 trading days.";
    default:
      return "Model expects a flat move within ±0.5% over the next 5 trading days.";
  }
}

export function patternDirectionTone(
  forecast: PatternTrendForecast,
): PatternDirectionTone {
  if (isBinaryPatternScheme(forecast.labelScheme)) {
    return forecast.prediction === 1 ? "positive" : "negative";
  }

  switch (forecast.prediction) {
    case 1:
      return "positive";
    case -1:
      return "negative";
    default:
      return "neutral";
  }
}

export function formatPatternPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

export function formatIndicatorValue(
  key: string,
  value: number | undefined,
): string {
  if (value == null || Number.isNaN(value)) return "—";

  const row = INDICATOR_ROWS.find((item) => item.key === key);
  if (!row) return value.toFixed(2);

  switch (row.format) {
    case "price":
      return value >= 1000
        ? `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
        : `$${value.toFixed(2)}`;
    case "percent":
      return `${(value * 100).toFixed(1)}%`;
    default:
      return value.toFixed(row.decimals ?? 2);
  }
}

export function patternIndicatorRows(
  indicators: Record<string, number>,
): Array<{ key: string; label: string; value: string }> {
  return INDICATOR_ROWS.filter((row) => indicators[row.key] != null).map(
    (row) => ({
      key: row.key,
      label: row.label,
      value: formatIndicatorValue(row.key, indicators[row.key]),
    }),
  );
}

export function patternProbabilityRows(
  forecast: PatternTrendForecast,
): Array<{ label: string; value: number; selected: boolean }> {
  const labels = binaryClassLabels(forecast.labelScheme);

  if (isBinaryPatternScheme(forecast.labelScheme)) {
    return [
      {
        label: labels.down,
        value: forecast.probabilities["0"] ?? 0,
        selected: forecast.prediction === 0,
      },
      {
        label: labels.up,
        value: forecast.probabilities["1"] ?? forecast.upProb ?? 0,
        selected: forecast.prediction === 1,
      },
    ];
  }

  return [
    {
      label: "Down",
      value: forecast.probabilities["-1"] ?? 0,
      selected: forecast.prediction === -1,
    },
    {
      label: "Flat",
      value: forecast.probabilities["0"] ?? 0,
      selected: forecast.prediction === 0,
    },
    {
      label: "Up",
      value: forecast.probabilities["1"] ?? 0,
      selected: forecast.prediction === 1,
    },
  ];
}

export function patternRankingScore(
  forecast: PatternTrendForecast,
): number | null {
  if (forecast.rankingScore != null) return forecast.rankingScore;
  return forecast.upProb ?? null;
}

export function isRankingPortfolioStrategy(
  forecast: PatternTrendForecast,
): boolean {
  return forecast.portfolioStrategy?.strategyType === "ranking";
}

export function patternRankingBadgeLabel(
  forecast: PatternTrendForecast,
): string | null {
  if (!isRankingPortfolioStrategy(forecast)) {
    return patternTradeSignalLabel(forecast);
  }

  const score = patternRankingScore(forecast);
  if (score == null) return null;
  if (score >= 0.65) return "Top-tier rank";
  if (score >= 0.5) return "Mid rank";
  return "Lower rank";
}

export function patternRankingBadgeTone(
  forecast: PatternTrendForecast,
): PatternDirectionTone {
  if (!isRankingPortfolioStrategy(forecast)) {
    return patternTradeSignalTone(forecast);
  }

  const score = patternRankingScore(forecast);
  if (score == null) return "neutral";
  if (score >= 0.65) return "positive";
  if (score >= 0.5) return "neutral";
  return "warning";
}

export function patternPortfolioSummary(
  forecast: PatternTrendForecast,
): string | null {
  const strategy = forecast.portfolioStrategy;
  if (!strategy) return null;

  const universe = strategy.universe.toUpperCase();
  return `Ranking portfolio · ${universe} · top ${strategy.topN} · ${strategy.rebalanceDays}d rebalance`;
}

export function patternModelSummary(
  forecast: PatternTrendForecast,
): string | null {
  if (forecast.modelLabel && forecast.modelKey) {
    const featureCount =
      forecast.nFeatures != null ? ` · ${forecast.nFeatures} features` : "";
    return `Model ${forecast.modelKey} · ${forecast.modelLabel}${featureCount}`;
  }
  if (forecast.modelLabel) return forecast.modelLabel;
  return null;
}

export function patternUpProbLabel(forecast: PatternTrendForecast): string {
  return isOutperformSpyScheme(forecast.labelScheme)
    ? "P(stronger than SPY)"
    : "P(up)";
}

export function patternTradeSignalLabel(
  forecast: PatternTrendForecast,
): string | null {
  if (forecast.tradeSignal == null) return null;
  return forecast.tradeSignal ? "Trade signal" : "Below threshold";
}

export function patternTradeSignalTone(
  forecast: PatternTrendForecast,
): PatternDirectionTone {
  if (forecast.tradeSignal == null) return "neutral";
  return forecast.tradeSignal ? "positive" : "warning";
}
