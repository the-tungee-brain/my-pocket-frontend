import { apiFetch } from "@/lib/apiClient";
import type { AssetType } from "@/app/types/research";

const STORAGE_PREFIX = "powerpocket-asset-type:";
const memoryCache = new Map<string, AssetType | null>();

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

export function getCachedAssetType(symbol: string): AssetType | null | undefined {
  const key = normalizeKey(symbol);
  if (!key) return undefined;

  if (memoryCache.has(key)) {
    return memoryCache.get(key) ?? null;
  }

  if (typeof window === "undefined") return undefined;

  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (raw === null) return undefined;
    if (raw === "") {
      memoryCache.set(key, null);
      return null;
    }
    const parsed = readAssetType(raw);
    memoryCache.set(key, parsed);
    return parsed;
  } catch {
    return undefined;
  }
}

export function rememberAssetType(
  symbol: string,
  assetType: AssetType | null | undefined,
): void {
  const key = normalizeKey(symbol);
  if (!key) return;

  const resolved = assetType ?? null;
  memoryCache.set(key, resolved);

  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${key}`, resolved ?? "");
  } catch {
    // ignore quota errors
  }
}

export async function fetchAssetType(
  symbol: string,
  accessToken: string,
): Promise<AssetType | null> {
  const key = normalizeKey(symbol);
  if (!key) return null;

  const cached = getCachedAssetType(key);
  if (cached !== undefined) return cached;

  try {
    const params = new URLSearchParams({ q: key, limit: "10" });
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
      if (itemSymbol !== key) continue;

      const assetType = readAssetType(record.assetType ?? record.asset_type);
      rememberAssetType(key, assetType);
      return assetType;
    }

    rememberAssetType(key, null);
    return null;
  } catch {
    return null;
  }
}

export function isEtfAssetType(assetType: AssetType | null | undefined): boolean {
  return assetType === "ETF";
}
