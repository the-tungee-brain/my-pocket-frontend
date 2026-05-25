import type { TickerSymbolItem } from "@/app/hooks/useSymbolSearch";

function readSymbol(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value.trim().toUpperCase();
  }

  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    for (const key of ["symbol", "ticker", "name"]) {
      const candidate = record[key];
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.trim().toUpperCase();
      }
    }
  }

  return null;
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
      created_at:
        typeof item === "object" &&
        item !== null &&
        typeof (item as Record<string, unknown>).created_at === "string"
          ? ((item as Record<string, unknown>).created_at as string)
          : "",
    });
  }

  return normalized;
}
