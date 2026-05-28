import type {
  EstimatePeriodKey,
  PeriodEstimate,
  StreetAnalysisSnapshot,
} from "@/app/hooks/streetAnalysisTypes";

/** Footnote for analyst consensus blocks. */
export const ANALYST_DATA_ATTRIBUTION = "Estimates from Yahoo Finance";

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
      (street.epsEstimates?.length ?? 0) > 0 ||
      (street.revenueEstimates?.length ?? 0) > 0 ||
      street.estimateRevisionHeadline ||
      street.estimateDriftHeadline ||
      street.growthContextHeadline ||
      street.ratingTrendHeadline ||
      (street.recentRatingActions?.length ?? 0) > 0 ||
      hasOwnership(street.ownership),
  );
}

export function hasOwnership(
  ownership: StreetAnalysisSnapshot["ownership"],
): boolean {
  if (!ownership) return false;
  return Boolean(
    ownership.insidersPctHeld != null ||
      ownership.institutionsPctHeld != null ||
      (ownership.topInstitutional?.length ?? 0) > 0 ||
      (ownership.recentInsiderTransactions?.length ?? 0) > 0,
  );
}

export function estimateForPeriod(
  estimates: PeriodEstimate[] | undefined,
  periodKey: EstimatePeriodKey,
): PeriodEstimate | null {
  return estimates?.find((row) => row.periodKey === periodKey) ?? null;
}

export function formatPctHeld(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toFixed(2)}%`;
}

export function formatHolderShares(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M sh`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K sh`;
  return `${value.toLocaleString()} sh`;
}

export function formatRatingActionDate(isoDate: string): string {
  const parsed = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRatingActionLine(action: {
  firm: string;
  toGrade: string;
  fromGrade?: string | null;
  action?: string | null;
}): string {
  const move =
    action.fromGrade != null && action.fromGrade !== ""
      ? `${action.fromGrade} → ${action.toGrade}`
      : action.toGrade;
  return `${action.firm}: ${move}`;
}
