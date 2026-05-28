import type {
  EstimatePeriodKey,
  PeriodEstimate,
  StreetAnalysisSnapshot,
} from "@/app/hooks/streetAnalysisTypes";

/** Footnote for analyst consensus blocks (no as-of date). */
export const ANALYST_DATA_ATTRIBUTION = "Estimates from Yahoo Finance";

export function formatYahooDataAsOf(
  iso: string | null | undefined,
): string | null {
  if (!iso) return null;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function yahooEstimatesAttribution(
  dataAsOf?: string | null,
): string {
  const asOf = formatYahooDataAsOf(dataAsOf);
  return asOf
    ? `${ANALYST_DATA_ATTRIBUTION} · as of ${asOf}`
    : ANALYST_DATA_ATTRIBUTION;
}

export function yahooFundProfileAttribution(
  dataAsOf?: string | null,
): string {
  const base = "Fund profile from Yahoo Finance";
  const asOf = formatYahooDataAsOf(dataAsOf);
  return asOf ? `${base} · as of ${asOf}` : base;
}

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

function hasRecommendationBreakdown(
  recommendation: StreetAnalysisSnapshot["recommendation"],
): boolean {
  if (!recommendation) return false;
  const total =
    (recommendation.strongBuy ?? 0) +
    (recommendation.buy ?? 0) +
    (recommendation.hold ?? 0) +
    (recommendation.sell ?? 0) +
    (recommendation.strongSell ?? 0);
  return total > 0;
}

function hasPriceTargets(
  targets: StreetAnalysisSnapshot["priceTargets"],
): boolean {
  if (!targets) return false;
  return (
    targets.mean != null ||
    targets.low != null ||
    targets.high != null ||
    targets.median != null ||
    targets.current != null ||
    targets.upsideToMeanPct != null
  );
}

function hasPeriodEstimates(estimates: PeriodEstimate[] | undefined): boolean {
  return estimates?.some((row) => row.avg != null) ?? false;
}

/** True when Yahoo returned analyst consensus data (excludes ownership-only payloads). */
export function hasStreetAnalysis(
  street: StreetAnalysisSnapshot | null | undefined,
): street is StreetAnalysisSnapshot {
  if (!street) return false;
  return Boolean(
    hasPriceTargets(street.priceTargets) ||
      (street.consensusLabel?.trim()?.length ?? 0) > 0 ||
      hasRecommendationBreakdown(street.recommendation) ||
      street.nextQuarterEps?.avg != null ||
      street.nextQuarterRevenue?.avg != null ||
      hasPeriodEstimates(street.epsEstimates) ||
      hasPeriodEstimates(street.revenueEstimates) ||
      (street.estimateRevisionHeadline?.trim()?.length ?? 0) > 0 ||
      (street.estimateDriftHeadline?.trim()?.length ?? 0) > 0 ||
      (street.growthContextHeadline?.trim()?.length ?? 0) > 0 ||
      (street.ratingTrendHeadline?.trim()?.length ?? 0) > 0 ||
      (street.recentRatingActions?.length ?? 0) > 0,
  );
}

/** EPS/revenue consensus and estimate headlines shown on the Earnings tab. */
export function hasStreetEarningsEstimates(
  street: StreetAnalysisSnapshot | null | undefined,
): street is StreetAnalysisSnapshot {
  if (!street) return false;
  const hasPeriodData =
    street.nextQuarterEps?.avg != null ||
    street.nextQuarterRevenue?.avg != null ||
    hasPeriodEstimates(street.epsEstimates) ||
    hasPeriodEstimates(street.revenueEstimates);
  const hasHeadlines = Boolean(
    street.estimateRevisionHeadline?.trim() ||
      street.estimateDriftHeadline?.trim() ||
      street.growthContextHeadline?.trim() ||
      street.ratingTrendHeadline?.trim(),
  );
  return hasPeriodData || hasHeadlines;
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

function trimTrailingDecimalZeros(formatted: string): string {
  if (!formatted.includes(".")) return formatted;
  let result = formatted.replace(/0+$/, "");
  if (result.endsWith(".")) {
    result = result.slice(0, -1);
  }
  return result;
}

function formatShareMagnitude(
  abs: number,
  divisor: number,
  suffix: string,
  sign: string,
  unit: string,
): string {
  return `${sign}${trimTrailingDecimalZeros((abs / divisor).toFixed(2))}${suffix}${unit}`;
}

/** Share counts with up to 2 decimal places; T/B/M/K abbreviations below 1,000 use grouping. */
export function formatShareCount(
  value: number | null | undefined,
  options?: { unit?: string },
): string {
  if (value == null || Number.isNaN(value)) return "";

  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  const unit = options?.unit ? ` ${options.unit}` : "";

  if (abs >= 1_000_000_000_000) {
    return formatShareMagnitude(abs, 1_000_000_000_000, "T", sign, unit);
  }
  if (abs >= 1_000_000_000) {
    return formatShareMagnitude(abs, 1_000_000_000, "B", sign, unit);
  }
  if (abs >= 1_000_000) {
    return formatShareMagnitude(abs, 1_000_000, "M", sign, unit);
  }
  if (abs >= 1_000) {
    return formatShareMagnitude(abs, 1_000, "K", sign, unit);
  }

  const localized = trimTrailingDecimalZeros(
    abs.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }),
  );
  return `${sign}${localized}${unit}`;
}

export function formatHolderShares(value: number | null | undefined): string {
  return formatShareCount(value);
}

export function formatInstitutionalHolderShares(
  value: number | null | undefined,
): string {
  return formatShareCount(value, { unit: "shares" });
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
