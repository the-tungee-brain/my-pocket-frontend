import { apiFetch } from "@/lib/apiClient";
import type { DividendHistoryContext } from "@/app/types/research";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const STORAGE_KEY = "powerpocket-dividend-history:v2";
const DEFAULT_SHARES = 100;

type StoredEntry = {
  data: DividendHistoryContext;
  fetchedAt: number;
};

const memoryCache = new Map<string, DividendHistoryContext>();
const inflightRequests = new Map<string, Promise<DividendHistoryContext | null>>();

function normalizeKey(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function cacheKey(symbol: string, shares: number): string {
  return `${normalizeKey(symbol)}:${shares}`;
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
    return parsed as Record<string, StoredEntry>;
  } catch {
    return {};
  }
}

function writePersistentStore(store: Record<string, StoredEntry>): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
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

function normalizeScenario(raw: unknown): DividendHistoryContext["scenario"] | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const shares = readNumber(item.shares);
  const startYear = readNumber(item.startYear ?? item.start_year);
  const totalCollected = readNumber(item.totalCollected ?? item.total_collected);
  const annualIncomeLatest = readNumber(
    item.annualIncomeLatest ?? item.annual_income_latest,
  );
  const annualIncomeStart = readNumber(
    item.annualIncomeStart ?? item.annual_income_start,
  );
  const latestYear = readNumber(item.latestYear ?? item.latest_year);
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
    annualIncome,
    recentPayments,
    payments,
    scenario,
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
  shares = DEFAULT_SHARES,
): DividendHistoryContext | null {
  const key = cacheKey(symbol, shares);
  const memory = memoryCache.get(key);
  if (memory) return memory;

  const store = readPersistentStore();
  const entry = store[key];
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) return null;

  const normalized = normalizeDividendHistoryContext(entry.data);
  if (!normalized) return null;

  memoryCache.set(key, normalized);
  return normalized;
}

async function fetchDividendHistoryFromApi(
  symbol: string,
  accessToken: string,
  shares: number,
): Promise<DividendHistoryContext | null> {
  try {
    const params = new URLSearchParams({
      symbol: normalizeKey(symbol),
      shares: String(shares),
    });
    const res = await apiFetch(`/research/dividends?${params.toString()}`, {
      method: "GET",
      accessToken,
    });

    if (res.status === 404) return null;
    if (!res.ok) return null;

    const raw: unknown = await res.json();
    const data = normalizeDividendHistoryContext(raw);
    if (!data) return null;

    const key = cacheKey(symbol, shares);
    memoryCache.set(key, data);

    const store = readPersistentStore();
    store[key] = { data, fetchedAt: Date.now() };
    writePersistentStore(store);

    return data;
  } catch {
    return null;
  }
}

export async function fetchDividendHistory(
  symbol: string,
  accessToken: string,
  shares = DEFAULT_SHARES,
): Promise<DividendHistoryContext | null> {
  const key = cacheKey(symbol, shares);
  const cached = getCachedDividendHistory(symbol, shares);
  if (cached) return cached;

  const inflight = inflightRequests.get(key);
  if (inflight) return inflight;

  const request = fetchDividendHistoryFromApi(symbol, accessToken, shares).finally(
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
    return Math.round(positionShareCount);
  }
  return DEFAULT_SHARES;
}
