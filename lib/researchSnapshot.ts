import { apiFetch } from "@/lib/apiClient";

export type ResearchSnapshot = {
  symbol: string;
  name: string;
  sector: string;
  country: string;
  price: number;
  changePct: number;
  marketCap: string;
  range52w?: string | null;
  logo?: string;
  weburl?: string;
  dividendYieldPct?: number | null;
  peRatio?: number | null;
  volume?: number | null;
  avgVolume?: number | null;
  expenseRatioPct?: number | null;
};

const STORAGE_KEY = "powerpocket-research-snapshots-v2";
const LEGACY_SESSION_KEY = "powerpocket-research-snapshots";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type StoredEntry = {
  data: ResearchSnapshot;
  fetchedAt: number;
};

const memoryCache = new Map<string, ResearchSnapshot>();
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

function normalizeSnapshot(data: Record<string, unknown>): ResearchSnapshot {
  return {
    symbol: String(data.symbol ?? ""),
    name: String(data.name ?? ""),
    sector: String(data.sector ?? ""),
    country: String(data.country ?? ""),
    price: readNumber(data.price) ?? 0,
    changePct: readNumber(data.changePct ?? data.change_pct) ?? 0,
    marketCap: String(data.marketCap ?? data.market_cap ?? "N/A"),
    range52w:
      typeof data.range52w === "string"
        ? data.range52w
        : typeof data.range_52w === "string"
          ? data.range_52w
          : null,
    logo: typeof data.logo === "string" ? data.logo : undefined,
    weburl: typeof data.weburl === "string" ? data.weburl : undefined,
    dividendYieldPct: readNumber(
      data.dividendYieldPct ?? data.dividend_yield_pct,
    ),
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

  return entry.data;
}

function savePersistentEntry(key: string, data: ResearchSnapshot): void {
  const store = readPersistentStore();
  store[key] = { data, fetchedAt: Date.now() };
  writePersistentStore(store);
}

export function getCachedResearchSnapshot(
  symbol: string,
): ResearchSnapshot | null {
  const key = normalizeKey(symbol);
  if (!key) return null;

  const fromMemory = memoryCache.get(key);
  if (fromMemory) return fromMemory;

  const fromStorage = getValidPersistentEntry(key);
  if (fromStorage) {
    memoryCache.set(key, fromStorage);
    return fromStorage;
  }

  return null;
}

export function seedResearchSnapshotCache(
  symbol: string,
  snapshot: ResearchSnapshot,
): void {
  const key = normalizeKey(symbol);
  if (!key) return;
  memoryCache.set(key, snapshot);
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
    memoryCache.set(key, data);
    savePersistentEntry(key, data);
    return data;
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
