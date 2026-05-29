import { apiFetch } from "@/lib/apiClient";
import type { EtfHoldingItem, EtfHoldingsContext } from "@/app/types/research";
import { rankEtfHoldingsByQuality, withQualityScore } from "@/lib/etfHoldingsQuality";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const STORAGE_KEY = "powerpocket-etf-holdings:v4";
const DEFAULT_QUALITY_LIMIT = 5;
export const MAX_ETF_HOLDINGS_FETCH = 25;

type StoredEntry = {
  data: EtfHoldingsContext;
  fetchedAt: number;
};

const memoryCache = new Map<string, EtfHoldingsContext>();
const inflightRequests = new Map<string, Promise<EtfHoldingsContext | null>>();

function normalizeKey(symbol: string): string {
  return symbol.trim().toUpperCase();
}

/** Correct legacy/API values that scaled percent-form ratios by 100 (e.g. 6.00% → 0.06%). */
export function formatExpenseRatio(value: string | null | undefined): string | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d+(?:\.\d+)?)%$/);
  if (!match) return trimmed;

  const pct = Number(match[1]);
  if (!Number.isFinite(pct)) return trimmed;
  if (pct >= 4) {
    return `${(pct / 100).toFixed(2)}%`;
  }
  return trimmed;
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

function cacheKey(symbol: string): string {
  return normalizeKey(symbol);
}

function sliceEtfHoldingsContext(
  full: EtfHoldingsContext,
  limit: number,
): EtfHoldingsContext {
  const resolvedLimit = Math.max(1, Math.min(limit, full.holdings.length || limit));
  return {
    ...full,
    holdings: full.holdings.slice(0, resolvedLimit),
  };
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeHolding(raw: unknown): EtfHoldingItem | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Record<string, unknown>;
  const name = typeof item.name === "string" ? item.name : null;
  const weight = readNumber(item.weight_pct ?? item.weightPct);
  if (!name || weight == null) return null;

  const ticker =
    typeof item.ticker === "string" ? item.ticker.trim().toUpperCase() : null;

  return withQualityScore({
    ticker,
    name,
    weight_pct: weight,
    sector: typeof item.sector === "string" ? item.sector : null,
    market_cap:
      typeof item.market_cap === "string"
        ? item.market_cap
        : typeof item.marketCap === "string"
          ? item.marketCap
          : null,
    piotroskiF: readNumber(item.piotroskiF ?? item.piotroski_f),
    altmanZ: readNumber(item.altmanZ ?? item.altman_z),
    qualityScore: readNumber(item.qualityScore ?? item.quality_score),
  });
}

function normalizeHoldingsList(raw: unknown): EtfHoldingItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizeHolding)
    .filter((item): item is EtfHoldingItem => item != null);
}

export function normalizeEtfHoldingsContext(
  raw: unknown,
  fallbackLimit = 25,
): EtfHoldingsContext | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;

  const ticker =
    typeof data.ticker === "string" ? data.ticker.trim().toUpperCase() : null;
  const totalHoldings = readNumber(data.total_holdings ?? data.totalHoldings);
  if (!ticker || totalHoldings == null) return null;

  const holdings = normalizeHoldingsList(data.holdings);
  let strongestHoldings = normalizeHoldingsList(
    data.strongestHoldings ?? data.strongest_holdings,
  );
  let weakestHoldings = normalizeHoldingsList(
    data.weakestHoldings ?? data.weakest_holdings,
  );

  if (strongestHoldings.length === 0 && weakestHoldings.length === 0) {
    const ranked = rankEtfHoldingsByQuality(holdings, DEFAULT_QUALITY_LIMIT);
    strongestHoldings = ranked.strongest;
    weakestHoldings = ranked.weakest;
  }

  const sectorBreakdownRaw =
    data.sector_breakdown ?? data.sectorBreakdown ?? {};
  const sector_breakdown: Record<string, number> = {};
  if (sectorBreakdownRaw && typeof sectorBreakdownRaw === "object") {
    for (const [sector, weight] of Object.entries(
      sectorBreakdownRaw as Record<string, unknown>,
    )) {
      const parsed = readNumber(weight);
      if (parsed != null) sector_breakdown[sector] = parsed;
    }
  }

  return {
    ticker,
    total_holdings: Math.trunc(totalHoldings),
    aum: typeof data.aum === "string" ? data.aum : null,
    sector_breakdown,
    holdings: holdings.slice(0, Math.max(1, fallbackLimit)),
    strongestHoldings,
    weakestHoldings,
    dividend_yield:
      typeof data.dividend_yield === "string"
        ? data.dividend_yield
        : typeof data.dividendYield === "string"
          ? data.dividendYield
          : null,
    expense_ratio: formatExpenseRatio(
      typeof data.expense_ratio === "string"
        ? data.expense_ratio
        : typeof data.expenseRatio === "string"
          ? data.expenseRatio
          : null,
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

export function seedEtfHoldingsCache(
  symbol: string,
  holdings: EtfHoldingsContext,
): void {
  const key = cacheKey(symbol);
  if (!key) return;
  const normalized = normalizeEtfHoldingsContext(
    holdings,
    MAX_ETF_HOLDINGS_FETCH,
  );
  if (normalized) {
    memoryCache.set(key, normalized);
  }
}

export function getCachedEtfHoldings(
  symbol: string,
  limit = MAX_ETF_HOLDINGS_FETCH,
): EtfHoldingsContext | null {
  const key = cacheKey(symbol);
  const fromMemory = memoryCache.get(key);
  if (fromMemory) {
    return sliceEtfHoldingsContext(fromMemory, limit);
  }

  const store = readPersistentStore();
  const entry = store[key];
  if (!entry?.data) return null;

  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    delete store[key];
    writePersistentStore(store);
    return null;
  }

  const normalized = normalizeEtfHoldingsContext(entry.data, MAX_ETF_HOLDINGS_FETCH);
  if (!normalized) return null;

  memoryCache.set(key, normalized);
  return sliceEtfHoldingsContext(normalized, limit);
}

async function fetchEtfHoldingsFromApi(
  symbol: string,
  accessToken: string,
): Promise<EtfHoldingsContext | null> {
  try {
    const params = new URLSearchParams({
      symbol: normalizeKey(symbol),
      limit: String(MAX_ETF_HOLDINGS_FETCH),
    });
    const res = await apiFetch(`/research/etf-holdings?${params.toString()}`, {
      method: "GET",
      accessToken,
    });

    if (res.status === 404) return null;
    if (!res.ok) return null;

    const raw: unknown = await res.json();
    const data = normalizeEtfHoldingsContext(raw, MAX_ETF_HOLDINGS_FETCH);
    if (!data) return null;

    const key = cacheKey(symbol);
    memoryCache.set(key, data);

    const store = readPersistentStore();
    store[key] = { data, fetchedAt: Date.now() };
    writePersistentStore(store);

    return data;
  } catch {
    return null;
  }
}

export async function fetchEtfHoldings(
  symbol: string,
  accessToken: string,
  limit = MAX_ETF_HOLDINGS_FETCH,
): Promise<EtfHoldingsContext | null> {
  const key = cacheKey(symbol);

  const cached = getCachedEtfHoldings(symbol, limit);
  if (cached) return cached;

  const inflight = inflightRequests.get(key);
  if (inflight) {
    const full = await inflight;
    return full ? sliceEtfHoldingsContext(full, limit) : null;
  }

  const request = fetchEtfHoldingsFromApi(symbol, accessToken).finally(() => {
    inflightRequests.delete(key);
  });

  inflightRequests.set(key, request);
  const full = await request;
  return full ? sliceEtfHoldingsContext(full, limit) : null;
}
