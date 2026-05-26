import type { TickerSymbolItem } from "@/app/hooks/useSymbolSearch";
import type { AssetType } from "@/app/types/research";

function readSymbol(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value.trim().toUpperCase();
  }

  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    for (const key of ["symbol", "ticker"]) {
      const candidate = record[key];
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.trim().toUpperCase();
      }
    }
  }

  return null;
}

function readTitle(value: unknown): string | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  for (const key of ["title", "name", "companyName", "description"]) {
    const candidate = record[key];
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return null;
}

function readAssetType(value: unknown): AssetType | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  const candidate = record.assetType ?? record.asset_type;
  if (typeof candidate !== "string") return null;
  const normalized = candidate.trim().toUpperCase();
  const allowed: AssetType[] = [
    "STOCK",
    "ETF",
    "MUTUAL_FUND",
    "INDEX",
    "CRYPTO",
    "ADR",
    "BOND",
    "OPTION",
  ];
  return allowed.includes(normalized as AssetType)
    ? (normalized as AssetType)
    : null;
}

export function normalizeSymbolSearchResults(data: unknown): TickerSymbolItem[] {
  const rawItems = Array.isArray(data)
    ? data
    : typeof data === "object" && data !== null
      ? ((data as Record<string, unknown>).results ??
        (data as Record<string, unknown>).symbols ??
        (data as Record<string, unknown>).items ??
        [])
      : [];

  if (!Array.isArray(rawItems)) return [];

  const seen = new Set<string>();
  const normalized: TickerSymbolItem[] = [];

  for (const item of rawItems) {
    const symbol = readSymbol(item);
    if (!symbol || seen.has(symbol)) continue;
    seen.add(symbol);
    normalized.push({
      symbol,
      title: readTitle(item),
      assetType: readAssetType(item),
    });
  }

  return normalized;
}
