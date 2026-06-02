import type { PatternIntelligence, PatternTrendForecast } from "@/app/types/intelligence";

export const MODEL_BENCHMARK_SYMBOLS = new Set(["SPY"]);

export const MODEL_BENCHMARK_NOTICE =
  "This symbol is the Model C benchmark. Excess return vs SPY is always zero here, " +
  "so ranking probabilities are undefined — use pattern, trend, and regime context only.";

export function isModelBenchmarkSymbol(symbol: string | null | undefined): boolean {
  if (!symbol) return false;
  return MODEL_BENCHMARK_SYMBOLS.has(symbol.trim().toUpperCase());
}

export function isPatternIntelligenceBenchmark(
  intelligence: PatternIntelligence | null | undefined,
): boolean {
  if (!intelligence) return false;
  return (
    intelligence.isBenchmark === true ||
    intelligence.chartIntelligence?.summary?.outlook?.isBenchmark === true ||
    isModelBenchmarkSymbol(intelligence.symbol)
  );
}

export function isPatternForecastBenchmark(
  forecast: PatternTrendForecast | null | undefined,
  symbol?: string | null,
): boolean {
  if (forecast?.isBenchmark) return true;
  return isModelBenchmarkSymbol(symbol ?? null);
}

export function patternForecastBenchmarkNotice(
  forecast: PatternTrendForecast | null | undefined,
): string {
  return forecast?.benchmarkNotice ?? MODEL_BENCHMARK_NOTICE;
}

export function patternIntelligenceBenchmarkNotice(
  intelligence: PatternIntelligence | null | undefined,
): string {
  return (
    intelligence?.chartIntelligence?.summary?.outlook?.benchmarkNotice ??
    MODEL_BENCHMARK_NOTICE
  );
}

/** RS-vs-SPY features are meaningless on the benchmark itself. */
export function filterBenchmarkIndicators(
  indicators: Record<string, number>,
): Record<string, number> {
  return Object.fromEntries(
    Object.entries(indicators).filter(([key]) => !key.includes("rs_vs_spy")),
  );
}
