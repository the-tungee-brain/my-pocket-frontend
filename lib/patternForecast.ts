import type { PatternTrendForecast } from "@/app/types/intelligence";

export type PatternDirectionTone = "positive" | "negative" | "neutral" | "warning";

const INDICATOR_ROWS: Array<{
  key: string;
  label: string;
  format: "price" | "decimal" | "percent";
  decimals?: number;
}> = [
  { key: "rsi_14", label: "RSI (14)", format: "decimal", decimals: 1 },
  { key: "sma_20", label: "SMA 20", format: "price" },
  { key: "sma_200", label: "SMA 200", format: "price" },
  { key: "macd", label: "MACD", format: "decimal", decimals: 3 },
  { key: "bb_pct", label: "Bollinger %B", format: "percent" },
];

export function hasPatternForecast(
  forecast: PatternTrendForecast | null | undefined,
): forecast is PatternTrendForecast {
  return !!forecast?.asOfDate;
}

export function isBinaryPatternScheme(labelScheme: string | undefined): boolean {
  return labelScheme === "binary_updown";
}

export function patternDirectionLabel(forecast: PatternTrendForecast): string {
  if (isBinaryPatternScheme(forecast.labelScheme)) {
    return forecast.prediction === 1 ? "Up" : "Down";
  }

  switch (forecast.prediction) {
    case 1:
      return "Bullish";
    case -1:
      return "Bearish";
    default:
      return "Neutral";
  }
}

export function patternDirectionSubtitle(forecast: PatternTrendForecast): string {
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
  if (isBinaryPatternScheme(forecast.labelScheme)) {
    return [
      {
        label: "Down",
        value: forecast.probabilities["0"] ?? 0,
        selected: forecast.prediction === 0,
      },
      {
        label: "Up",
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
