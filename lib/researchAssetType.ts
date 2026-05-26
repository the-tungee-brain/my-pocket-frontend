import { apiFetch } from "@/lib/apiClient";
import type { AssetType } from "@/app/types/research";

const STORAGE_PREFIX = "powerpocket-asset-type:";
const memoryCache = new Map<string, AssetType>();

const VALID_ASSET_TYPES = new Set<string>([
  "STOCK",
  "ETF",
  "MUTUAL_FUND",
  "INDEX",
  "CRYPTO",
  "ADR",
  "BOND",
  "OPTION",
]);

function normalizeKey(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function readAssetType(value: unknown): AssetType | null {
  if (typeof value !== "string" || !VALID_ASSET_TYPES.has(value)) {
    return null;
  }
  return value as AssetType;
}

function readAssetTypeFromRecord(record: Record<string, unknown>): AssetType | null {
  return readAssetType(record.assetType ?? record.asset_type);
}

/** Returns a cached asset type, or undefined when a fresh lookup is needed. */
export function getCachedAssetType(symbol: string): AssetType | undefined {
  const key = normalizeKey(symbol);
  if (!key) return undefined;

  const fromMemory = memoryCache.get(key);
  if (fromMemory) return fromMemory;

  if (typeof window === "undefined") return undefined;

  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!raw) return undefined;
    if (raw === "") {
      sessionStorage.removeItem(`${STORAGE_PREFIX}${key}`);
      return undefined;
    }
    const parsed = readAssetType(raw);
    if (parsed) {
      memoryCache.set(key, parsed);
      return parsed;
    }
    sessionStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    return undefined;
  } catch {
    return undefined;
  }
}

export function rememberAssetType(
  symbol: string,
  assetType: AssetType | null | undefined,
): void {
  const key = normalizeKey(symbol);
  if (!key || !assetType) return;

  memoryCache.set(key, assetType);

  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, assetType);
  } catch {
    // ignore quota errors
  }
}

async function fetchSymbolLookup(
  symbol: string,
  accessToken: string,
): Promise<AssetType | null> {
  try {
    const params = new URLSearchParams({ symbol });
    const res = await apiFetch(`/symbols/lookup?${params.toString()}`, {
      method: "GET",
      accessToken,
    });

    if (res.status === 404) return null;
    if (!res.ok) return null;

    const data = (await res.json()) as Record<string, unknown>;
    return readAssetTypeFromRecord(data);
  } catch {
    return null;
  }
}

export async function probeEtfHoldings(
  symbol: string,
  accessToken: string,
): Promise<boolean> {
  try {
    const params = new URLSearchParams({ symbol, limit: "1" });
    const res = await apiFetch(`/research/etf-holdings?${params.toString()}`, {
      method: "GET",
      accessToken,
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function fetchAssetTypeFromSearch(
  symbol: string,
  accessToken: string,
): Promise<AssetType | null> {
  try {
    const params = new URLSearchParams({ q: symbol, limit: "10" });
    const res = await apiFetch(`/symbols/search?${params.toString()}`, {
      method: "GET",
      accessToken,
    });

    if (!res.ok) return null;

    const data: unknown = await res.json();
    const items = Array.isArray(data) ? data : [];

    for (const item of items) {
      if (typeof item !== "object" || item === null) continue;
      const record = item as Record<string, unknown>;
      const itemSymbol =
        typeof record.symbol === "string"
          ? record.symbol.trim().toUpperCase()
          : null;
      if (itemSymbol !== symbol) continue;
      return readAssetTypeFromRecord(record);
    }

    return null;
  } catch {
    return null;
  }
}

export async function fetchAssetType(
  symbol: string,
  accessToken: string,
): Promise<AssetType | null> {
  const key = normalizeKey(symbol);
  if (!key) return null;

  const cached = getCachedAssetType(key);
  if (cached) return cached;

  const lookupType = await fetchSymbolLookup(key, accessToken);
  if (lookupType) {
    rememberAssetType(key, lookupType);
    return lookupType;
  }

  if (await probeEtfHoldings(key, accessToken)) {
    rememberAssetType(key, "ETF");
    return "ETF";
  }

  const searchType = await fetchAssetTypeFromSearch(key, accessToken);
  if (searchType) {
    rememberAssetType(key, searchType);
    return searchType;
  }

  return null;
}

export function isEtfAssetType(assetType: AssetType | null | undefined): boolean {
  return assetType === "ETF";
}

export function clearCachedAssetType(symbol: string): void {
  const key = normalizeKey(symbol);
  if (!key) return;
  memoryCache.delete(key);
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  } catch {
    // ignore
  }
}
