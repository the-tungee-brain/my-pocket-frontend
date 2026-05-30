import { apiFetch } from "@/lib/apiClient";
import type {
  DividendAdvancedSnowballScenario,
  DividendBacktestParams,
  DividendBacktestYearRow,
  DividendHistoryContext,
  DividendPositionParams,
  DividendSnowballParams,
} from "@/app/types/research";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const STORAGE_KEY = "powerpocket-dividend-history:v11";
const MAX_PERSISTENT_CACHE_ENTRIES = 40;
const DEFAULT_SHARES = 100;

export type DividendHistoryVariant = "base" | "snowball" | "backtest";

export type DividendFetchParams = DividendPositionParams & {
  shares?: number | null;
  projectYears?: number | null;
  dividendCagrPct?: number | null;
  historyStartYear?: number | null;
};

type StoredEntry = {
  data: DividendHistoryContext;
  fetchedAt: number;
};

const memoryCache = new Map<string, DividendHistoryContext>();
const inflightRequests = new Map<string, Promise<DividendHistoryContext | null>>();

function normalizeKey(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function hasInvestment(params: DividendFetchParams): boolean {
  return (
    params.investmentUsd != null &&
    params.investmentUsd > 0 &&
    params.sharePrice != null &&
    params.sharePrice > 0
  );
}

export function resolveDividendScenarioShares(params: DividendFetchParams): number {
  if (params.shares != null && params.shares > 0) {
    return params.shares;
  }
  if (hasInvestment(params)) {
    return Math.round((params.investmentUsd! / params.sharePrice!) * 100) / 100;
  }
  return DEFAULT_SHARES;
}

export function scenarioCacheKey(
  symbol: string,
  params: DividendFetchParams,
  variant: DividendHistoryVariant = "snowball",
): string {
  const base = normalizeKey(symbol);
  const shares = resolveDividendScenarioShares(params).toFixed(2);
  const prefix =
    variant === "base"
      ? "base"
      : variant === "backtest"
        ? "backtest"
        : "snowball";

  if (variant === "base") {
    return `${base}|${prefix}|shares:${shares}`;
  }

  const parts = [base, prefix, `shares:${shares}`];

  if (hasInvestment(params)) {
    parts.push(`inv:${params.investmentUsd!.toFixed(2)}`);
    parts.push(`px:${params.sharePrice!.toFixed(2)}`);
  } else if (params.sharePrice != null && params.sharePrice > 0) {
    parts.push(`px:${params.sharePrice.toFixed(2)}`);
  }

  parts.push(params.reinvestDividends ? "drip" : "cash");
  parts.push(
    params.priceCagrPct != null ? `pcagr:${params.priceCagrPct}` : "pcagr:auto",
  );
  parts.push(
    params.annualContributionUsd != null && params.annualContributionUsd > 0
      ? `contrib:${params.annualContributionUsd.toFixed(2)}`
      : "contrib:0",
  );

  if (variant === "snowball") {
    parts.push(`years:${params.projectYears ?? 10}`);
    parts.push(
      params.dividendCagrPct != null ? `dcagr:${params.dividendCagrPct}` : "dcagr:auto",
    );
  }

  if (variant === "backtest") {
    parts.push(
      params.historyStartYear != null
        ? `hist:${Math.round(params.historyStartYear)}`
        : "hist:auto",
    );
  }

  return parts.join("|");
}

function prunePersistentStore(
  store: Record<string, StoredEntry>,
): Record<string, StoredEntry> {
  const now = Date.now();
  const freshEntries = Object.entries(store).filter(
    ([, entry]) => now - entry.fetchedAt <= CACHE_TTL_MS,
  );

  if (freshEntries.length <= MAX_PERSISTENT_CACHE_ENTRIES) {
    return Object.fromEntries(freshEntries);
  }

  freshEntries.sort((left, right) => right[1].fetchedAt - left[1].fetchedAt);
  return Object.fromEntries(freshEntries.slice(0, MAX_PERSISTENT_CACHE_ENTRIES));
}

function readPersistentStore(): Record<string, StoredEntry> {
  if (typeof window === "undefined") return {};

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const store = parsed as Record<string, StoredEntry>;
    const pruned = prunePersistentStore(store);
    if (Object.keys(pruned).length !== Object.keys(store).length) {
      writePersistentStore(pruned);
    }
    return pruned;
  } catch {
    return {};
  }
}

function writePersistentStore(store: Record<string, StoredEntry>): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(prunePersistentStore(store)),
    );
  } catch {
    // ignore quota errors
  }
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizePayments(raw: unknown): DividendHistoryContext["payments"] {
  if (!Array.isArray(raw)) return [];
  const payments: DividendHistoryContext["payments"] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const item = row as Record<string, unknown>;
    const date = typeof item.date === "string" ? item.date : null;
    const amountPerShare = readNumber(item.amountPerShare ?? item.amount_per_share);
    if (!date || amountPerShare == null) continue;
    payments.push({ date, amountPerShare });
  }
  return payments;
}

function normalizeAdvancedScenario(
  raw: unknown,
): DividendAdvancedSnowballScenario | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const initialShares = readNumber(item.initialShares ?? item.initial_shares);
  const finalShares = readNumber(item.finalShares ?? item.final_shares);
  const sharePriceAtStart = readNumber(
    item.sharePriceAtStart ?? item.share_price_at_start,
  );
  const sharePriceLatest = readNumber(
    item.sharePriceLatest ?? item.share_price_latest,
  );
  const priceCagrPct = readNumber(item.priceCagrPct ?? item.price_cagr_pct);
  const annualIncomeLatestDrip = readNumber(
    item.annualIncomeLatestDrip ?? item.annual_income_latest_drip,
  );
  const portfolioValueLatest = readNumber(
    item.portfolioValueLatest ?? item.portfolio_value_latest,
  );
  const totalDividendsReinvested = readNumber(
    item.totalDividendsReinvested ?? item.total_dividends_reinvested,
  );
  const totalAnnualContributionsUsd = readNumber(
    item.totalAnnualContributionsUsd ?? item.total_annual_contributions_usd,
  );
  if (
    initialShares == null ||
    finalShares == null ||
    sharePriceAtStart == null ||
    sharePriceLatest == null ||
    priceCagrPct == null ||
    annualIncomeLatestDrip == null ||
    portfolioValueLatest == null ||
    totalDividendsReinvested == null
  ) {
    return null;
  }

  return {
    enabled: Boolean(item.enabled ?? true),
    initialShares,
    finalShares,
    sharePriceAtStart,
    sharePriceLatest,
    priceCagrPct,
    annualIncomeLatestDrip,
    portfolioValueLatest,
    totalDividendsReinvested,
    totalAnnualContributionsUsd: totalAnnualContributionsUsd ?? 0,
  };
}

function normalizeBacktestYearRow(raw: unknown): DividendBacktestYearRow | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const year = readNumber(item.year);
  const dps = readNumber(item.dps);
  const shares = readNumber(item.shares);
  const dividendIncome = readNumber(item.dividendIncome ?? item.dividend_income);
  const sharePrice = readNumber(item.sharePrice ?? item.share_price);
  const dividendYieldPct =
    readNumber(item.dividendYieldPct ?? item.dividend_yield_pct) ?? 0;
  if (
    year == null ||
    dps == null ||
    shares == null ||
    dividendIncome == null ||
    sharePrice == null
  ) {
    return null;
  }
  return {
    year,
    dps,
    shares,
    dividendIncome,
    sharePrice,
    dividendYieldPct,
  };
}

function normalizeHistoricalBacktest(
  raw: unknown,
): DividendHistoryContext["historicalBacktest"] {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const startYear = readNumber(item.startYear ?? item.start_year);
  const endYear = readNumber(item.endYear ?? item.end_year);
  const cashCollected = readNumber(item.cashCollected ?? item.cash_collected);
  const cashCollectedAnnual = readNumber(
    item.cashCollectedAnnual ?? item.cash_collected_annual,
  );
  const initialShares =
    readNumber(item.initialShares ?? item.initial_shares) ??
    normalizeAdvancedScenario(item.drip)?.initialShares ??
    0;
  if (
    startYear == null ||
    endYear == null ||
    cashCollected == null ||
    cashCollectedAnnual == null
  ) {
    return null;
  }

  const yearlyBreakdownRaw = item.yearlyBreakdown ?? item.yearly_breakdown;
  const yearlyBreakdown: DividendBacktestYearRow[] = [];
  if (Array.isArray(yearlyBreakdownRaw)) {
    for (const row of yearlyBreakdownRaw) {
      const normalized = normalizeBacktestYearRow(row);
      if (normalized) yearlyBreakdown.push(normalized);
    }
  }

  return {
    startYear,
    endYear,
    initialShares,
    cashCollected,
    cashCollectedAnnual,
    yearlyBreakdown,
    drip: normalizeAdvancedScenario(item.drip),
  };
}

export function dividendProjectionWindow(projectYears = 10) {
  const currentYear = new Date().getFullYear();
  const resolvedYears = Math.max(1, Math.min(Math.round(projectYears), 50));

  return {
    currentYear,
    endYear: currentYear + resolvedYears,
    projectYears: resolvedYears,
  };
}

function roundSnowballMetric(value: number): number {
  return Math.round(value * 100) / 100;
}

export function resolveSnowballPriceCagrPct(
  history: DividendHistoryContext,
  overridePct?: number | null,
): number | null {
  if (overridePct != null && Number.isFinite(overridePct)) {
    return overridePct;
  }
  return (
    history.priceCagrPct ??
    history.scenario?.advanced?.priceCagrPct ??
    null
  );
}

export function mergeDividendHistoryContext(
  next: DividendHistoryContext,
  previous: DividendHistoryContext | null,
): DividendHistoryContext {
  const resolvedPriceCagr =
    resolveSnowballPriceCagrPct(next) ??
    (previous ? resolveSnowballPriceCagrPct(previous) : null);
  if (resolvedPriceCagr == null || next.priceCagrPct === resolvedPriceCagr) {
    return next;
  }
  return { ...next, priceCagrPct: resolvedPriceCagr };
}

export function needsProjectionRefetch(
  data: DividendHistoryContext,
  params: DividendFetchParams,
): boolean {
  if (!data.scenario) return false;

  const hasSharePrice =
    (params.sharePrice != null && params.sharePrice > 0) ||
    (data.scenario.sharePrice != null && data.scenario.sharePrice > 0);

  if (!hasSharePrice) return false;

  if (resolveSnowballPriceCagrPct(data) == null) {
    return true;
  }

  const advanced = data.scenario.advanced;
  if (!advanced) return true;

  const reinvestDividends = params.reinvestDividends ?? false;
  const advancedIsDrip = advanced.totalDividendsReinvested > 0;
  return reinvestDividends !== advancedIsDrip;
}

function roundScenarioValue(value: number): number {
  return Math.round(value * 100) / 100;
}

function modeledSharePriceForYear(
  sharePriceAtStart: number,
  priceCagrPct: number,
  startYear: number,
  year: number,
): number {
  if (sharePriceAtStart <= 0) return sharePriceAtStart;
  const yearsFromStart = Math.max(0, year - startYear);
  const rate = priceCagrPct / 100;
  return roundScenarioValue(sharePriceAtStart * (1 + rate) ** yearsFromStart);
}

function annualDpsByYear(history: DividendHistoryContext): Map<number, number> {
  const totals = new Map<number, number>();
  for (const row of history.annualIncome) {
    if (!row.isPartialYear) {
      totals.set(row.year, row.totalPerShare);
    }
  }
  return totals;
}

/** Year-by-year backtest rows from API data, or a client-side replay when missing. */
export function resolveBacktestYearlyBreakdown(
  history: DividendHistoryContext,
  backtest: NonNullable<DividendHistoryContext["historicalBacktest"]>,
  options: {
    reinvestDividends?: boolean;
    shares?: number | null;
    sharePriceAtStart?: number | null;
    currentSharePrice?: number | null;
    priceCagrPct?: number | null;
    annualContributionUsd?: number | null;
  } = {},
): DividendBacktestYearRow[] {
  if (backtest.yearlyBreakdown.length > 0) {
    return backtest.yearlyBreakdown;
  }

  const { startYear, endYear } = backtest;
  const annualTotals = annualDpsByYear(history);
  const drip = backtest.drip;
  const reinvestDividends = options.reinvestDividends ?? Boolean(drip);
  const contribution = Math.max(options.annualContributionUsd ?? 0, 0);

  let shares =
    options.shares != null && options.shares > 0
      ? options.shares
      : backtest.initialShares > 0
        ? backtest.initialShares
        : drip?.initialShares ?? 0;
  if (shares <= 0) return [];

  const currentSharePrice =
    options.currentSharePrice ??
    drip?.sharePriceLatest ??
    history.scenario?.sharePrice ??
    null;

  let sharePriceAtStart =
    options.sharePriceAtStart ??
    drip?.sharePriceAtStart ??
    null;

  const priceCagrPct =
    options.priceCagrPct ??
    drip?.priceCagrPct ??
    resolveSnowballPriceCagrPct(history) ??
    0;

  if (
    (sharePriceAtStart == null || sharePriceAtStart <= 0) &&
    currentSharePrice != null &&
    currentSharePrice > 0
  ) {
    sharePriceAtStart = deriveSharePriceAtStart(
      currentSharePrice,
      priceCagrPct,
      endYear - startYear,
    );
  }

  const resolvedStartPrice =
    sharePriceAtStart != null && sharePriceAtStart > 0
      ? sharePriceAtStart
      : currentSharePrice ?? 0;

  const rows: DividendBacktestYearRow[] = [];

  if (
    reinvestDividends &&
    resolvedStartPrice > 0 &&
    currentSharePrice != null &&
    currentSharePrice > 0 &&
    startYear < endYear
  ) {
    let price = resolvedStartPrice;
    let shareCount = shares;
    const rate = priceCagrPct / 100;

    for (let year = startYear; year <= endYear; year += 1) {
      if (year > startYear && contribution > 0 && price > 0) {
        shareCount += contribution / price;
      }

      const dps = annualTotals.get(year) ?? 0;
      const dividendIncome = dps > 0 ? dps * shareCount : 0;
      const yieldPct = price > 0 && dps > 0 ? (dps / price) * 100 : 0;

      rows.push({
        year,
        dps: roundScenarioValue(dps),
        shares: roundScenarioValue(shareCount),
        dividendIncome: roundScenarioValue(dividendIncome),
        sharePrice: roundScenarioValue(price),
        dividendYieldPct: roundScenarioValue(yieldPct),
      });

      if (dps > 0 && year < endYear && price > 0) {
        shareCount += dividendIncome / price;
      }

      if (year < endYear) {
        price *= 1 + rate;
      }
    }

    return rows;
  }

  for (let year = startYear; year <= endYear; year += 1) {
    const dps = annualTotals.get(year) ?? 0;
    const yearPrice =
      resolvedStartPrice > 0
        ? modeledSharePriceForYear(
            resolvedStartPrice,
            priceCagrPct,
            startYear,
            year,
          )
        : 0;
    const dividendIncome = dps * shares;
    const yieldPct =
      yearPrice > 0 && dps > 0 ? (dps / yearPrice) * 100 : 0;

    rows.push({
      year,
      dps: roundScenarioValue(dps),
      shares: roundScenarioValue(shares),
      dividendIncome: roundScenarioValue(dividendIncome),
      sharePrice: roundScenarioValue(yearPrice),
      dividendYieldPct: roundScenarioValue(yieldPct),
    });
  }

  return rows;
}

/** Modeled share price at the start of a historic backtest window. */
export function deriveSharePriceAtStart(
  currentSharePrice: number,
  priceCagrPct: number,
  yearsElapsed: number,
): number {
  if (yearsElapsed <= 0 || currentSharePrice <= 0) {
    return roundScenarioValue(currentSharePrice);
  }
  const rate = priceCagrPct / 100;
  const denominator = (1 + rate) ** yearsElapsed;
  if (denominator <= 0) {
    return roundScenarioValue(currentSharePrice);
  }
  return roundScenarioValue(currentSharePrice / denominator);
}

export function resolveBacktestDisplayParams(
  params: DividendBacktestParams,
  options: {
    marketSharePrice?: number | null;
    heldShares?: number;
    priceCagrPct?: number | null;
    startYear: number;
    endYear: number;
    modeledSharePriceAtStart?: number | null;
  },
): DividendBacktestParams {
  const effective = resolveEffectiveBacktestParams(params, {
    marketSharePrice: options.marketSharePrice,
    heldShares: options.heldShares ?? 0,
  });

  const latestPrice =
    options.marketSharePrice ?? effective.sharePrice ?? null;
  if (latestPrice == null || latestPrice <= 0) {
    return effective;
  }

  const yearsElapsed = Math.max(0, options.endYear - options.startYear);
  const priceCagrPct = options.priceCagrPct ?? effective.priceCagrPct ?? 0;
  const startPrice =
    options.modeledSharePriceAtStart ??
    deriveSharePriceAtStart(latestPrice, priceCagrPct, yearsElapsed);

  const investmentUsd = effective.investmentUsd;
  let shares = effective.shares;
  if (investmentUsd != null && investmentUsd > 0 && startPrice > 0) {
    shares = roundScenarioValue(investmentUsd / startPrice);
  }

  return {
    ...effective,
    sharePrice: startPrice,
    shares,
  };
}

/** Fill share price, investment, and shares before fetch or display. */
export function resolveEffectivePositionParams<T extends DividendPositionParams>(
  params: T,
  options: {
    marketSharePrice?: number | null;
    heldShares?: number;
    fallbackShares?: number | null;
    fallbackInvestmentUsd?: number | null;
  } = {},
): T {
  const {
    marketSharePrice = null,
    heldShares = 0,
    fallbackShares = null,
    fallbackInvestmentUsd = null,
  } = options;
  const sharePrice = params.sharePrice ?? marketSharePrice ?? null;

  let investmentUsd = params.investmentUsd ?? fallbackInvestmentUsd ?? null;
  if ((investmentUsd == null || investmentUsd <= 0) && sharePrice != null && sharePrice > 0) {
    if (params.shares != null && params.shares > 0) {
      investmentUsd = roundScenarioValue(params.shares * sharePrice);
    } else if (fallbackShares != null && fallbackShares > 0) {
      investmentUsd = roundScenarioValue(fallbackShares * sharePrice);
    } else {
      investmentUsd = defaultDividendInvestmentUsd(heldShares, sharePrice);
    }
  }

  let shares = params.shares ?? fallbackShares ?? null;
  if ((shares == null || shares <= 0) && sharePrice != null && sharePrice > 0) {
    if (investmentUsd != null && investmentUsd > 0) {
      shares = roundScenarioValue(investmentUsd / sharePrice);
    } else {
      shares = defaultDividendScenarioShares(heldShares);
    }
  }

  return {
    ...params,
    sharePrice,
    investmentUsd,
    shares,
  };
}

export function resolveEffectiveSnowballParams(
  params: DividendSnowballParams,
  options: {
    marketSharePrice?: number | null;
    heldShares?: number;
    scenario?: DividendHistoryContext["scenario"] | null;
  } = {},
): DividendSnowballParams {
  const { scenario = null, ...rest } = options;
  return resolveEffectivePositionParams(params, {
    ...rest,
    fallbackShares: scenario?.shares ?? null,
    fallbackInvestmentUsd: scenario?.investmentUsd ?? null,
  });
}

export function resolveEffectiveBacktestParams(
  params: DividendBacktestParams,
  options: {
    marketSharePrice?: number | null;
    heldShares?: number;
  } = {},
): DividendBacktestParams {
  return resolveEffectivePositionParams(params, options);
}

export function snowballParamsMatch(
  draft: DividendSnowballParams,
  applied: DividendSnowballParams,
  options: {
    marketSharePrice?: number | null;
    heldShares?: number;
  } = {},
): boolean {
  const left = resolveEffectiveSnowballParams(draft, options);
  const right = resolveEffectiveSnowballParams(applied, options);
  return (
    left.investmentUsd === right.investmentUsd &&
    left.shares === right.shares &&
    (left.sharePrice ?? null) === (right.sharePrice ?? null) &&
    (left.reinvestDividends ?? true) === (right.reinvestDividends ?? true) &&
    (left.projectYears ?? 10) === (right.projectYears ?? 10) &&
    (left.annualContributionUsd ?? 0) === (right.annualContributionUsd ?? 0) &&
    (left.priceCagrPct ?? null) === (right.priceCagrPct ?? null)
  );
}

export function backtestParamsMatch(
  draft: DividendBacktestParams,
  applied: DividendBacktestParams,
  options: {
    marketSharePrice?: number | null;
    heldShares?: number;
  } = {},
): boolean {
  const left = resolveEffectiveBacktestParams(draft, options);
  const right = resolveEffectiveBacktestParams(applied, options);
  return (
    left.investmentUsd === right.investmentUsd &&
    left.shares === right.shares &&
    (left.sharePrice ?? null) === (right.sharePrice ?? null) &&
    (left.reinvestDividends ?? true) === (right.reinvestDividends ?? true) &&
    (left.annualContributionUsd ?? 0) === (right.annualContributionUsd ?? 0) &&
    (left.priceCagrPct ?? null) === (right.priceCagrPct ?? null) &&
    (left.historyStartYear ?? null) === (right.historyStartYear ?? null)
  );
}

export function resolveDraftBacktestDisplayParams(
  draft: DividendBacktestParams,
  options: {
    marketSharePrice?: number | null;
    heldShares?: number;
    priceCagrPct?: number | null;
    completedYears: number[];
    appliedBacktest?: DividendHistoryContext["historicalBacktest"] | null;
  },
): DividendBacktestParams {
  const endYear =
    options.completedYears.at(-1) ?? options.appliedBacktest?.endYear ?? null;
  if (endYear == null) {
    return resolveEffectiveBacktestParams(draft, options);
  }

  const startYear =
    draft.historyStartYear ??
    options.appliedBacktest?.startYear ??
    historyStartYearForLookback(options.completedYears, 10) ??
    endYear;

  const modeledSharePriceAtStart =
    options.appliedBacktest &&
    startYear === options.appliedBacktest.startYear
      ? (options.appliedBacktest.drip?.sharePriceAtStart ?? null)
      : null;

  return resolveBacktestDisplayParams(draft, {
    marketSharePrice: options.marketSharePrice,
    heldShares: options.heldShares,
    priceCagrPct: options.priceCagrPct,
    startYear,
    endYear,
    modeledSharePriceAtStart,
  });
}

export function dividendScenarioInputsValid(
  params: DividendPositionParams,
  marketSharePrice?: number | null,
): boolean {
  const sharePrice = params.sharePrice ?? marketSharePrice ?? null;
  if (sharePrice == null || sharePrice <= 0) return false;

  const investmentUsd = params.investmentUsd ?? null;
  const shares = params.shares ?? null;
  return (
    (investmentUsd != null && investmentUsd > 0) ||
    (shares != null && shares > 0)
  );
}

/** @deprecated Use resolveEffectiveSnowballParams or resolveEffectiveBacktestParams */
export function resolveEffectiveScenarioParams(
  params: DividendFetchParams,
  options: {
    marketSharePrice?: number | null;
    heldShares?: number;
    scenario?: DividendHistoryContext["scenario"] | null;
  } = {},
): DividendFetchParams {
  return resolveEffectiveSnowballParams(params, options);
}

/** Client-side projection so portfolio metrics stay in sync with DRIP toggle. */
export function resolveSnowballAdvancedMetrics(
  history: DividendHistoryContext,
  params: {
    shares: number;
    sharePrice?: number | null;
    reinvestDividends?: boolean;
    projectYears?: number;
    priceCagrPct?: number | null;
    annualContributionUsd?: number | null;
  },
): DividendAdvancedSnowballScenario | null {
  const { scenario } = history;
  if (!scenario) return null;

  const sharePrice = params.sharePrice ?? scenario.sharePrice ?? null;
  if (sharePrice == null || sharePrice <= 0) return null;

  const shares = params.shares > 0 ? params.shares : scenario.shares;
  if (shares <= 0) return null;
  const projectYears = Math.max(
    1,
    Math.min(Math.round(params.projectYears ?? scenario.projectYears ?? 10), 50),
  );
  const reinvestDividends = params.reinvestDividends ?? false;

  if (scenario.annualIncomeStart <= 0) return null;

  const priceCagrPct =
    params.priceCagrPct ??
    resolveSnowballPriceCagrPct(history) ??
    0;

  const dividendCagrPct = scenario.dividendCagrPct;
  const scenarioShares = scenario.shares > 0 ? scenario.shares : shares;
  const scaledAnnualIncomeStart =
    Math.abs(shares - scenarioShares) > 0.01
      ? scenario.annualIncomeStart * (shares / scenarioShares)
      : scenario.annualIncomeStart;
  const baseDps = scaledAnnualIncomeStart / shares;
  const divRate = dividendCagrPct / 100;
  const priceRate = priceCagrPct / 100;
  const contribution = Math.max(params.annualContributionUsd ?? 0, 0);

  let price = sharePrice;
  let shareCount = shares;
  let totalReinvested = 0;
  let totalContributions = 0;
  let totalProjectedDividends = 0;

  for (let offset = 0; offset <= projectYears; offset += 1) {
    if (offset > 0 && contribution > 0 && price > 0) {
      shareCount += contribution / price;
      totalContributions += contribution;
    }

    const yearDps = baseDps * (1 + divRate) ** offset;
    const dividendCash = yearDps * shareCount;
    totalProjectedDividends += dividendCash;

    if (reinvestDividends && offset < projectYears && price > 0) {
      shareCount += dividendCash / price;
      totalReinvested += dividendCash;
    }

    if (offset < projectYears) {
      price *= 1 + priceRate;
    }
  }

  const finalDps = baseDps * (1 + divRate) ** projectYears;

  return {
    enabled: true,
    initialShares: roundSnowballMetric(shares),
    finalShares: roundSnowballMetric(shareCount),
    sharePriceAtStart: roundSnowballMetric(sharePrice),
    sharePriceLatest: roundSnowballMetric(price),
    priceCagrPct: roundSnowballMetric(priceCagrPct),
    annualIncomeLatestDrip: roundSnowballMetric(finalDps * shareCount),
    portfolioValueLatest: roundSnowballMetric(shareCount * price),
    totalDividendsReinvested: roundSnowballMetric(totalReinvested),
    totalAnnualContributionsUsd: roundSnowballMetric(totalContributions),
    totalProjectedDividends: roundSnowballMetric(totalProjectedDividends),
  };
}

function normalizeScenario(raw: unknown): DividendHistoryContext["scenario"] | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const shares = readNumber(item.shares);
  const latestYearRaw = readNumber(item.latestYear ?? item.latest_year);
  const projectYears = readNumber(item.projectYears ?? item.project_years) ?? 10;
  const projection = dividendProjectionWindow(projectYears);
  let startYear = readNumber(item.startYear ?? item.start_year);
  let latestYear = latestYearRaw;

  // Older API responses used a historical start year (e.g. 2016).
  if (startYear == null || startYear < projection.currentYear) {
    startYear = projection.currentYear;
    latestYear = projection.endYear;
  }
  const totalCollected = readNumber(item.totalCollected ?? item.total_collected);
  const annualIncomeLatest = readNumber(
    item.annualIncomeLatest ?? item.annual_income_latest,
  );
  const annualIncomeStart = readNumber(
    item.annualIncomeStart ?? item.annual_income_start,
  );
  if (
    shares == null ||
    startYear == null ||
    totalCollected == null ||
    annualIncomeLatest == null ||
    annualIncomeStart == null ||
    latestYear == null
  ) {
    return null;
  }

  return {
    shares,
    startYear,
    totalCollected,
    annualIncomeLatest,
    annualIncomeStart,
    latestYear,
    projectYears: projection.projectYears,
    dividendCagrPct:
      readNumber(item.dividendCagrPct ?? item.dividend_cagr_pct) ?? 0,
    investmentUsd: readNumber(item.investmentUsd ?? item.investment_usd),
    sharePrice: readNumber(item.sharePrice ?? item.share_price),
    advanced: normalizeAdvancedScenario(item.advanced),
  };
}

export function normalizeDividendHistoryContext(
  raw: unknown,
): DividendHistoryContext | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const ticker =
    typeof data.ticker === "string" ? data.ticker.trim().toUpperCase() : null;
  const totalDividends = readNumber(data.totalDividends ?? data.total_dividends);
  const scenario = normalizeScenario(data.scenario);
  if (!ticker || totalDividends == null) return null;

  const annualIncomeRaw = data.annualIncome ?? data.annual_income;
  const annualIncome: DividendHistoryContext["annualIncome"] = [];
  if (Array.isArray(annualIncomeRaw)) {
    for (const row of annualIncomeRaw) {
      if (!row || typeof row !== "object") continue;
      const item = row as Record<string, unknown>;
      const year = readNumber(item.year);
      const totalPerShare = readNumber(item.totalPerShare ?? item.total_per_share);
      const incomeOnShares = readNumber(item.incomeOnShares ?? item.income_on_shares);
      if (year == null || totalPerShare == null || incomeOnShares == null) continue;
      annualIncome.push({
        year,
        totalPerShare,
        incomeOnShares,
        isPartialYear: Boolean(item.isPartialYear ?? item.is_partial_year),
      });
    }
  }

  const recentPayments = normalizePayments(data.recentPayments ?? data.recent_payments);
  const payments = normalizePayments(data.payments);
  if (payments.length === 0 && recentPayments.length > 0) {
    payments.push(...recentPayments);
  }

  return {
    ticker,
    totalDividends,
    totalSplits: readNumber(data.totalSplits ?? data.total_splits) ?? 0,
    consecutiveAnnualIncreases:
      readNumber(
        data.consecutiveAnnualIncreases ?? data.consecutive_annual_increases,
      ) ?? 0,
    cagr5yPct: readNumber(data.cagr5yPct ?? data.cagr_5y_pct),
    cagr10yPct: readNumber(data.cagr10yPct ?? data.cagr_10y_pct),
    dividendYieldPct: readNumber(data.dividendYieldPct ?? data.dividend_yield_pct),
    priceCagrPct: readNumber(data.priceCagrPct ?? data.price_cagr_pct),
    annualIncome,
    recentPayments,
    payments,
    scenario,
    historicalBacktest: normalizeHistoricalBacktest(
      data.historicalBacktest ?? data.historical_backtest,
    ),
    dataAsOf:
      typeof data.dataAsOf === "string"
        ? data.dataAsOf
        : typeof data.data_as_of === "string"
          ? data.data_as_of
          : null,
    confidenceScore: readNumber(data.confidenceScore ?? data.confidence_score),
  };
}

export function getCachedDividendHistory(
  symbol: string,
  params: DividendFetchParams = {},
  variant: DividendHistoryVariant = "snowball",
): DividendHistoryContext | null {
  const key = scenarioCacheKey(symbol, params, variant);
  const memory = memoryCache.get(key);
  if (memory) return memory;

  const store = readPersistentStore();
  const entry = store[key];
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    delete store[key];
    writePersistentStore(store);
    return null;
  }

  const normalized = normalizeDividendHistoryContext(entry.data);
  if (!normalized) return null;

  memoryCache.set(key, normalized);
  return normalized;
}

export function resolveCurrentYieldPct(
  history: DividendHistoryContext,
  sharePrice?: number | null,
): number | null {
  if (history.dividendYieldPct != null && Number.isFinite(history.dividendYieldPct)) {
    return history.dividendYieldPct;
  }

  const scenario = history.scenario;
  const resolvedPrice = sharePrice ?? scenario?.sharePrice ?? null;
  if (scenario) {
    const { shares, annualIncomeStart } = scenario;
    if (
      resolvedPrice != null &&
      resolvedPrice > 0 &&
      shares > 0 &&
      annualIncomeStart > 0
    ) {
      const baseDps = annualIncomeStart / shares;
      return Math.round((baseDps / resolvedPrice) * 10000) / 100;
    }
  }

  const latestAnnual = history.annualIncome.at(-1);
  if (
    latestAnnual &&
    resolvedPrice != null &&
    resolvedPrice > 0 &&
    latestAnnual.totalPerShare > 0
  ) {
    return (
      Math.round((latestAnnual.totalPerShare / resolvedPrice) * 10000) / 100
    );
  }

  return null;
}

function buildQueryParams(
  symbol: string,
  params: DividendFetchParams,
  variant: DividendHistoryVariant,
): URLSearchParams {
  const query = new URLSearchParams({
    symbol: normalizeKey(symbol),
    shares: String(resolveDividendScenarioShares(params)),
  });

  if (variant === "base") {
    return query;
  }

  if (params.sharePrice != null && params.sharePrice > 0) {
    query.set("share_price", String(params.sharePrice));
  }
  if (hasInvestment(params)) {
    query.set("investment_usd", String(params.investmentUsd));
  }
  if (params.reinvestDividends) {
    query.set("reinvest_dividends", "true");
  }
  if (params.priceCagrPct != null && Number.isFinite(params.priceCagrPct)) {
    query.set("price_cagr_pct", String(params.priceCagrPct));
  }
  if (
    params.annualContributionUsd != null &&
    Number.isFinite(params.annualContributionUsd) &&
    params.annualContributionUsd > 0
  ) {
    query.set("annual_contribution_usd", String(params.annualContributionUsd));
  }

  if (variant === "snowball") {
    if (params.projectYears != null && Number.isFinite(params.projectYears)) {
      query.set("project_years", String(Math.round(params.projectYears)));
    }
    if (params.dividendCagrPct != null && Number.isFinite(params.dividendCagrPct)) {
      query.set("dividend_cagr_pct", String(params.dividendCagrPct));
    }
  }

  if (variant === "backtest") {
    if (
      params.historyStartYear != null &&
      Number.isFinite(params.historyStartYear)
    ) {
      query.set("history_start_year", String(Math.round(params.historyStartYear)));
    }
  }

  return query;
}

async function fetchDividendHistoryFromApi(
  symbol: string,
  accessToken: string,
  params: DividendFetchParams,
  variant: DividendHistoryVariant,
): Promise<DividendHistoryContext | null> {
  try {
    const query = buildQueryParams(symbol, params, variant);
    const res = await apiFetch(`/research/dividends?${query.toString()}`, {
      method: "GET",
      accessToken,
    });

    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`Dividend history request failed (${res.status})`);
    }

    const raw: unknown = await res.json();
    const data = normalizeDividendHistoryContext(raw);
    if (!data) {
      throw new Error("Dividend history response was invalid.");
    }

    const key = scenarioCacheKey(symbol, params, variant);
    memoryCache.set(key, data);

    const store = readPersistentStore();
    store[key] = { data, fetchedAt: Date.now() };
    writePersistentStore(store);

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Dividend history request failed.");
  }
}

export async function fetchDividendHistory(
  symbol: string,
  accessToken: string,
  params: DividendFetchParams = {},
  variant: DividendHistoryVariant = "snowball",
): Promise<DividendHistoryContext | null> {
  const key = scenarioCacheKey(symbol, params, variant);
  const cached = getCachedDividendHistory(symbol, params, variant);
  if (cached) return cached;

  const inflight = inflightRequests.get(key);
  if (inflight) return inflight;

  const request = fetchDividendHistoryFromApi(symbol, accessToken, params, variant).finally(
    () => {
      inflightRequests.delete(key);
    },
  );

  inflightRequests.set(key, request);
  return request;
}

export function defaultDividendScenarioShares(
  positionShareCount: number | null | undefined,
): number {
  if (positionShareCount != null && positionShareCount > 0) {
    return positionShareCount;
  }
  return DEFAULT_SHARES;
}

export function defaultDividendInvestmentUsd(
  heldShares: number,
  sharePrice: number | null,
): number {
  if (heldShares > 0 && sharePrice != null && sharePrice > 0) {
    return Math.round(heldShares * sharePrice);
  }
  if (sharePrice != null && sharePrice > 0) {
    return Math.round(DEFAULT_SHARES * sharePrice);
  }
  return 10_000;
}

export function completedDividendYears(
  history: DividendHistoryContext,
): number[] {
  return history.annualIncome
    .filter((row) => !row.isPartialYear)
    .map((row) => row.year)
    .sort((left, right) => left - right);
}

export function defaultHistoryStartYear(completedYears: number[]): number | null {
  if (completedYears.length === 0) return null;
  const endYear = completedYears[completedYears.length - 1];
  const firstYear = completedYears[0];
  return Math.max(firstYear, endYear - 9);
}

export function historyStartYearForLookback(
  completedYears: number[],
  lookbackYears: number,
): number | null {
  if (completedYears.length === 0) return null;
  const endYear = completedYears[completedYears.length - 1];
  const firstYear = completedYears[0];
  const span = Math.max(1, Math.round(lookbackYears));
  return Math.max(firstYear, endYear - (span - 1));
}
