import type { Position } from "@/app/types/schwab";

const STORAGE_PREFIX = "tomcrest:insights:v1:";

export const INSIGHTS_POSITION_TTL_MS = 30 * 60 * 1000;
export const INSIGHTS_PORTFOLIO_TTL_MS = 45 * 60 * 1000;

export type InsightsCacheEntry = {
  content: string;
  fetchedAt: number;
};

export function insightsCacheTtlMs(label: string): number {
  return label === "PORTFOLIO"
    ? INSIGHTS_PORTFOLIO_TTL_MS
    : INSIGHTS_POSITION_TTL_MS;
}

export function buildInsightsCacheKey(
  label: string,
  positions: Position[],
  structuredAnalyze = false,
): string {
  return JSON.stringify({
    label,
    structuredAnalyze: !!structuredAnalyze,
    positions: positions.map((position) => ({
      symbol: position.instrument.symbol,
      longQuantity: position.longQuantity,
      shortQuantity: position.shortQuantity,
    })),
  });
}

function hashCacheKey(cacheKey: string): string {
  let hash = 0;
  for (let index = 0; index < cacheKey.length; index += 1) {
    hash = (Math.imul(31, hash) + cacheKey.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(36);
}

function sessionStorageKey(cacheKey: string): string {
  return `${STORAGE_PREFIX}${hashCacheKey(cacheKey)}`;
}

export function isInsightsEntryStale(
  fetchedAt: number,
  label: string,
  now = Date.now(),
): boolean {
  return now - fetchedAt > insightsCacheTtlMs(label);
}

export function readInsightsCache(
  cacheKey: string,
  label: string,
): InsightsCacheEntry | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(sessionStorageKey(cacheKey));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as InsightsCacheEntry;
    if (
      typeof parsed.content !== "string" ||
      typeof parsed.fetchedAt !== "number" ||
      !parsed.content.trim()
    ) {
      window.sessionStorage.removeItem(sessionStorageKey(cacheKey));
      return null;
    }

    if (isInsightsEntryStale(parsed.fetchedAt, label)) {
      window.sessionStorage.removeItem(sessionStorageKey(cacheKey));
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function writeInsightsCache(
  cacheKey: string,
  content: string,
): InsightsCacheEntry {
  const entry: InsightsCacheEntry = {
    content,
    fetchedAt: Date.now(),
  };

  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(
        sessionStorageKey(cacheKey),
        JSON.stringify(entry),
      );
    } catch {
      // Ignore quota or private-mode storage failures.
    }
  }

  return entry;
}

export function clearInsightsCache(cacheKey: string): void {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.removeItem(sessionStorageKey(cacheKey));
  } catch {
    // Ignore storage failures.
  }
}

export function formatInsightsAnalyzedAt(
  fetchedAt: number,
  now = Date.now(),
): string {
  const elapsedMs = Math.max(0, now - fetchedAt);
  const minutes = Math.floor(elapsedMs / 60_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
