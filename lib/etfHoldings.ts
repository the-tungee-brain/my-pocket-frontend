import { apiFetch } from "@/lib/apiClient";
import type { EtfHoldingsContext } from "@/app/types/research";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const STORAGE_KEY = "powerpocket-etf-holdings";

type StoredEntry = {
  data: EtfHoldingsContext;
  fetchedAt: number;
};

const memoryCache = new Map<string, EtfHoldingsContext>();
const inflightRequests = new Map<string, Promise<EtfHoldingsContext | null>>();

function normalizeKey(symbol: string): string {
  return symbol.trim().toUpperCase();
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

function cacheKey(symbol: string, limit: number): string {
  return `${normalizeKey(symbol)}:${limit}`;
}

export function getCachedEtfHoldings(
  symbol: string,
  limit = 25,
): EtfHoldingsContext | null {
  const key = cacheKey(symbol, limit);
  const fromMemory = memoryCache.get(key);
  if (fromMemory) return fromMemory;

  const store = readPersistentStore();
  const entry = store[key];
  if (!entry?.data) return null;

  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    delete store[key];
    writePersistentStore(store);
    return null;
  }

  memoryCache.set(key, entry.data);
  return entry.data;
}

async function fetchEtfHoldingsFromApi(
  symbol: string,
  accessToken: string,
  limit: number,
): Promise<EtfHoldingsContext | null> {
  try {
    const params = new URLSearchParams({
      symbol: normalizeKey(symbol),
      limit: String(limit),
    });
    const res = await apiFetch(`/research/etf-holdings?${params.toString()}`, {
      method: "GET",
      accessToken,
    });

    if (res.status === 404) return null;
    if (!res.ok) return null;

    const data = (await res.json()) as EtfHoldingsContext;
    const key = cacheKey(symbol, limit);
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
  limit = 25,
): Promise<EtfHoldingsContext | null> {
  const key = cacheKey(symbol, limit);
  if (!key.startsWith(normalizeKey(symbol))) return null;

  const cached = getCachedEtfHoldings(symbol, limit);
  if (cached) return cached;

  const inflight = inflightRequests.get(key);
  if (inflight) return inflight;

  const request = fetchEtfHoldingsFromApi(symbol, accessToken, limit).finally(
    () => {
      inflightRequests.delete(key);
    },
  );

  inflightRequests.set(key, request);
  return request;
}
