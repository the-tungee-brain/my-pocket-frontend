import { apiFetch } from "@/lib/apiClient";

export type ResearchSnapshot = {
  symbol: string;
  name: string;
  sector: string;
  country: string;
  price: number;
  changePct: number;
  marketCap: string;
  range52w: string;
  logo?: string;
  weburl?: string;
};

const STORAGE_KEY = "powerpocket-research-snapshots";
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

    const data: ResearchSnapshot = await res.json();
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
