import { apiFetch } from "@/lib/apiClient";
import type {
  DividendAdvancedSnowballScenario,
  DividendHistoryContext,
  DividendScenarioParams,
} from "@/app/types/research";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const STORAGE_KEY = "powerpocket-dividend-history:v5";
const MAX_PERSISTENT_CACHE_ENTRIES = 40;
const DEFAULT_SHARES = 100;

export type DividendFetchParams = DividendScenarioParams & {
  shares?: number | null;
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

export function scenarioCacheKey(symbol: string, params: DividendFetchParams): string {
  const base = normalizeKey(symbol);
  const shares = resolveDividendScenarioShares(params).toFixed(2);

  if (hasInvestment(params)) {
    return [
      base,
      `inv:${params.investmentUsd!.toFixed(2)}`,
      `px:${params.sharePrice!.toFixed(2)}`,
      `shares:${shares}`,
      `years:${params.projectYears ?? 10}`,
      params.reinvestDividends ? "drip" : "cash",
      params.priceCagrPct != null ? `pcagr:${params.priceCagrPct}` : "pcagr:auto",
      params.dividendCagrPct != null ? `dcagr:${params.dividendCagrPct}` : "dcagr:auto",
    ].join("|");
  }

  if (params.sharePrice != null && params.sharePrice > 0) {
    return [
      base,
      `shares:${shares}`,
      `px:${params.sharePrice.toFixed(2)}`,
      `years:${params.projectYears ?? 10}`,
      params.reinvestDividends ? "drip" : "cash",
    ].join("|");
  }

  return [
    base,
    `shares:${shares}`,
    `years:${params.projectYears ?? 10}`,
    params.reinvestDividends ? "drip" : "cash",
  ].join("|");
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
  if (
    startYear == null ||
    endYear == null ||
    cashCollected == null ||
    cashCollectedAnnual == null
  ) {
    return null;
  }

  return {
    startYear,
    endYear,
    cashCollected,
    cashCollectedAnnual,
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
  if (!ticker || totalDividends == null || !scenario) return null;

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
): DividendHistoryContext | null {
  const key = scenarioCacheKey(symbol, params);
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

  const resolvedPrice = sharePrice ?? history.scenario.sharePrice ?? null;
  const { shares, annualIncomeStart } = history.scenario;
  if (
    resolvedPrice == null ||
    resolvedPrice <= 0 ||
    shares <= 0 ||
    annualIncomeStart <= 0
  ) {
    return null;
  }

  const baseDps = annualIncomeStart / shares;
  return Math.round((baseDps / resolvedPrice) * 10000) / 100;
}

function buildQueryParams(symbol: string, params: DividendFetchParams): URLSearchParams {
  const query = new URLSearchParams({
    symbol: normalizeKey(symbol),
    shares: String(resolveDividendScenarioShares(params)),
  });

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
  if (params.projectYears != null && Number.isFinite(params.projectYears)) {
    query.set("project_years", String(Math.round(params.projectYears)));
  }
  if (params.dividendCagrPct != null && Number.isFinite(params.dividendCagrPct)) {
    query.set("dividend_cagr_pct", String(params.dividendCagrPct));
  }

  return query;
}

async function fetchDividendHistoryFromApi(
  symbol: string,
  accessToken: string,
  params: DividendFetchParams,
): Promise<DividendHistoryContext | null> {
  try {
    const query = buildQueryParams(symbol, params);
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

    const key = scenarioCacheKey(symbol, params);
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
): Promise<DividendHistoryContext | null> {
  const key = scenarioCacheKey(symbol, params);
  const cached = getCachedDividendHistory(symbol, params);
  if (cached) return cached;

  const inflight = inflightRequests.get(key);
  if (inflight) return inflight;

  const request = fetchDividendHistoryFromApi(symbol, accessToken, params).finally(
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
