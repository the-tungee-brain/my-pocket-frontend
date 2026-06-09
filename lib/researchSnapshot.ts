import { apiFetch } from "@/lib/apiClient";
import { snapshotHasStaleFinnhubLogo } from "@/lib/logoUrl";

export type ResearchSnapshot = {
  symbol: string;
  name: string;
  sector: string;
  country: string;
  price: number;
  changePct: number;
  quoteAsOf?: string | null;
  quoteSource?: string | null;
  quoteStatus?: string | null;
  quoteFetchedAt?: number | null;
  marketCap: string;
  range52w?: string | null;
  logo?: string;
  weburl?: string;
  dividendYieldPct?: number | null;
  rawDividendYield?: number | null;
  rawDividendYieldSource?: string | null;
  peRatio?: number | null;
  volume?: number | null;
  avgVolume?: number | null;
  expenseRatioPct?: number | null;
};

const STORAGE_KEY = "powerpocket-research-snapshots-v10";
const LEGACY_SESSION_KEY = "powerpocket-research-snapshots";
const CACHE_TTL_MS = 5 * 60 * 1000;

type StoredEntry = {
  data: ResearchSnapshot;
  fetchedAt: number;
};

const memoryCache = new Map<string, StoredEntry>();
const inflightRequests = new Map<string, Promise<ResearchSnapshot | null>>();

function normalizeKey(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function readPersistentStore(): Record<string, StoredEntry> {
  if (typeof window === "undefined") return {};

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return migrateLegacySessionStore();
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    return parsed as Record<string, StoredEntry>;
  } catch {
    return {};
  }
}

function readNumber(value: unknown): number | null {
  if (value == null) return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readTimestamp(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    const millis = value > 10_000_000_000 ? value : value * 1000;
    const date = new Date(millis);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  if (typeof value !== "string" || !value.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value.trim() : date.toISOString();
}

function normalizeDividendYieldPct(
  value: number | null,
  rawValue: number | null,
): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  if (value >= 0 && value <= 25) return value;
  if (rawValue != null && Number.isFinite(rawValue) && rawValue > 0) {
    return rawValue <= 25 ? rawValue : rawValue / 100;
  }
  if (value > 25 && value <= 100) return value / 100;
  return value;
}

function normalizeSnapshot(data: Record<string, unknown>): ResearchSnapshot {
  const rawDividendYield = readNumber(
    data.rawDividendYield ?? data.raw_dividend_yield,
  );
  const dividendYieldPct = normalizeDividendYieldPct(
    readNumber(data.dividendYieldPct ?? data.dividend_yield_pct),
    rawDividendYield,
  );

  return {
    symbol: String(data.symbol ?? ""),
    name: String(data.name ?? ""),
    sector: String(data.sector ?? ""),
    country: String(data.country ?? ""),
    price: readNumber(data.price) ?? 0,
    changePct: readNumber(data.changePct ?? data.change_pct) ?? 0,
    quoteAsOf: readTimestamp(
      data.quoteAsOf ??
        data.quote_as_of ??
        data.quoteTimestamp ??
        data.quote_timestamp ??
        data.asOf ??
        data.as_of ??
        data.updatedAt ??
        data.updated_at ??
        data.lastUpdated ??
        data.last_updated,
    ),
    quoteSource: readString(
      data.quoteSource ??
        data.quote_source ??
        data.quoteProvider ??
        data.quote_provider ??
        data.provider ??
        data.source,
    ),
    quoteStatus: readString(
      data.quoteStatus ??
        data.quote_status ??
        data.quoteFreshness ??
        data.quote_freshness ??
        data.priceStatus ??
        data.price_status,
    ),
    quoteFetchedAt: readNumber(data.quoteFetchedAt ?? data.quote_fetched_at),
    marketCap: String(data.marketCap ?? data.market_cap ?? "N/A"),
    range52w:
      typeof data.range52w === "string"
        ? data.range52w
        : typeof data.range_52w === "string"
          ? data.range_52w
          : null,
    logo: typeof data.logo === "string" ? data.logo : undefined,
    weburl: typeof data.weburl === "string" ? data.weburl : undefined,
    dividendYieldPct,
    rawDividendYield,
    rawDividendYieldSource:
      typeof data.rawDividendYieldSource === "string"
        ? data.rawDividendYieldSource
        : typeof data.raw_dividend_yield_source === "string"
          ? data.raw_dividend_yield_source
          : null,
    peRatio: readNumber(data.peRatio ?? data.pe_ratio),
    volume: readNumber(data.volume),
    avgVolume: readNumber(data.avgVolume ?? data.avg_volume),
    expenseRatioPct: readNumber(
      data.expenseRatioPct ?? data.expense_ratio_pct,
    ),
  };
}

function migrateLegacySessionStore(): Record<string, StoredEntry> {
  if (typeof window === "undefined") return {};

  try {
    const raw = sessionStorage.getItem(LEGACY_SESSION_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const store = parsed as Record<string, StoredEntry>;
    writePersistentStore(store);
    sessionStorage.removeItem(LEGACY_SESSION_KEY);
    return store;
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

function getValidPersistentEntry(key: string): ResearchSnapshot | null {
  const store = readPersistentStore();
  const entry = store[key];
  if (!entry?.data) return null;

  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    delete store[key];
    writePersistentStore(store);
    return null;
  }

  return {
    ...entry.data,
    quoteFetchedAt: entry.data.quoteFetchedAt ?? entry.fetchedAt,
  };
}

function getValidMemoryEntry(key: string): ResearchSnapshot | null {
  const entry = memoryCache.get(key);
  if (!entry?.data) return null;

  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    memoryCache.delete(key);
    return null;
  }

  return {
    ...entry.data,
    quoteFetchedAt: entry.data.quoteFetchedAt ?? entry.fetchedAt,
  };
}

function saveMemoryEntry(key: string, data: ResearchSnapshot): void {
  const fetchedAt = Date.now();
  memoryCache.set(key, {
    data: { ...data, quoteFetchedAt: data.quoteFetchedAt ?? fetchedAt },
    fetchedAt,
  });
}

function savePersistentEntry(key: string, data: ResearchSnapshot): void {
  const store = readPersistentStore();
  const fetchedAt = Date.now();
  store[key] = {
    data: { ...data, quoteFetchedAt: data.quoteFetchedAt ?? fetchedAt },
    fetchedAt,
  };
  writePersistentStore(store);
}

export function snapshotMissingKeyStats(snapshot: ResearchSnapshot): boolean {
  if (!snapshot.price || snapshot.price <= 0) return false;
  return snapshot.volume == null && snapshot.avgVolume == null;
}

export function snapshotNeedsRefresh(snapshot: ResearchSnapshot): boolean {
  return (
    snapshotMissingKeyStats(snapshot) ||
    snapshotHasStaleFinnhubLogo(snapshot.symbol, snapshot.logo)
  );
}

function formatTime(value: string | number | null | undefined): string | null {
  if (value == null) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function normalizeQuoteStatusLabel(status: string | null | undefined): string | null {
  if (!status) return null;
  const normalized = status.trim().toLowerCase().replace(/[_-]+/g, " ");
  if (normalized.includes("live") || normalized.includes("real time")) {
    return "Live";
  }
  if (normalized.includes("delay")) return status;
  if (normalized.includes("previous") || normalized.includes("close")) {
    return "Previous close";
  }
  return status;
}

export function quoteFreshnessLabel(snapshot: ResearchSnapshot): string {
  const status = normalizeQuoteStatusLabel(snapshot.quoteStatus);
  const source = snapshot.quoteSource ? ` · ${snapshot.quoteSource}` : "";
  if (status) return `${status}${source}`;

  const asOfTime = formatTime(snapshot.quoteAsOf);
  if (asOfTime) return `Last updated ${asOfTime}${source}`;

  const fetchedTime = formatTime(snapshot.quoteFetchedAt);
  if (fetchedTime) return `Last checked ${fetchedTime}${source}`;

  return `Quote freshness unavailable${source}`;
}

export function getCachedResearchSnapshot(
  symbol: string,
): ResearchSnapshot | null {
  const key = normalizeKey(symbol);
  if (!key) return null;

  const fromMemory = getValidMemoryEntry(key);
  if (fromMemory && !snapshotNeedsRefresh(fromMemory)) return fromMemory;

  const fromStorage = getValidPersistentEntry(key);
  if (fromStorage && !snapshotNeedsRefresh(fromStorage)) {
    saveMemoryEntry(key, fromStorage);
    return fromStorage;
  }

  return null;
}

export function seedResearchSnapshotCache(
  symbol: string,
  snapshot: ResearchSnapshot,
): void {
  const key = normalizeKey(symbol);
  if (!key || snapshotNeedsRefresh(snapshot)) return;
  saveMemoryEntry(key, snapshot);
  savePersistentEntry(key, snapshot);
}

async function fetchResearchSnapshotFromApi(
  key: string,
  accessToken: string,
): Promise<ResearchSnapshot | null> {
  try {
    const res = await apiFetch(
      `/research/snapshot?symbol=${encodeURIComponent(key)}`,
      {
        method: "GET",
        accessToken,
      },
    );

    if (!res.ok) return null;

    const raw: unknown = await res.json();
    const data = normalizeSnapshot(
      raw && typeof raw === "object" && !Array.isArray(raw)
        ? (raw as Record<string, unknown>)
        : {},
    );
    const fetchedAt = Date.now();
    const snapshot = { ...data, quoteFetchedAt: data.quoteFetchedAt ?? fetchedAt };
    saveMemoryEntry(key, snapshot);
    savePersistentEntry(key, snapshot);
    return snapshot;
  } catch {
    return null;
  }
}

export async function fetchResearchSnapshot(
  symbol: string,
  accessToken: string,
): Promise<ResearchSnapshot | null> {
  const key = normalizeKey(symbol);
  if (!key) return null;

  const cached = getCachedResearchSnapshot(key);
  if (cached) return cached;

  const inflight = inflightRequests.get(key);
  if (inflight) return inflight;

  const request = fetchResearchSnapshotFromApi(key, accessToken).finally(() => {
    inflightRequests.delete(key);
  });

  inflightRequests.set(key, request);
  return request;
}
