import type {
  PeriodEstimate,
  StreetAnalysisSnapshot,
} from "@/app/hooks/streetAnalysisTypes";

export function formatStreetPrice(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatStreetUpside(pct: number | null | undefined): string {
  if (pct == null || Number.isNaN(pct)) return "—";
  const prefix = pct >= 0 ? "+" : "";
  return `${prefix}${pct.toFixed(1)}% vs mean target`;
}

export function formatEstimateRange(estimate: PeriodEstimate | null | undefined): string {
  if (!estimate?.avg) return "—";
  const low = estimate.low != null ? formatCompactNumber(estimate.low) : null;
  const high = estimate.high != null ? formatCompactNumber(estimate.high) : null;
  const avg = formatCompactNumber(estimate.avg);
  if (low && high) return `${low} – ${high} (avg ${avg})`;
  return avg;
}

export function formatCompactNumber(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs < 10) return `${sign}$${abs.toFixed(2)}`;
  return `${sign}$${abs.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function formatEstimateGrowth(pct: number | null | undefined): string | null {
  if (pct == null || Number.isNaN(pct)) return null;
  const prefix = pct >= 0 ? "+" : "";
  return `${prefix}${pct.toFixed(1)}% YoY`;
}

export function hasStreetAnalysis(
  street: StreetAnalysisSnapshot | null | undefined,
): street is StreetAnalysisSnapshot {
  if (!street) return false;
  return Boolean(
    street.priceTargets ||
      street.recommendation ||
      street.nextQuarterEps ||
      street.nextQuarterRevenue ||
      street.estimateRevisionHeadline,
  );
}
