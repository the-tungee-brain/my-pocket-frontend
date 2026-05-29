const STORAGE_PREFIX = "research-overview-etag:";

export function overviewBundleEtagKey(
  symbol: string,
  includeSummary: boolean,
): string {
  return `${STORAGE_PREFIX}${symbol.toUpperCase()}:${includeSummary ? "summary" : "base"}`;
}

export function readOverviewBundleEtag(key: string): string | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeOverviewBundleEtag(key: string, etag: string | null): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    if (!etag) {
      sessionStorage.removeItem(key);
      return;
    }
    sessionStorage.setItem(key, etag);
  } catch {
    // ignore quota / private mode
  }
}

export function parseEtagHeader(header: string | null): string | null {
  if (!header) return null;
  const trimmed = header.trim();
  if (trimmed.startsWith("W/")) {
    return trimmed.slice(2).replace(/^"|"$/g, "") || null;
  }
  return trimmed.replace(/^"|"$/g, "") || null;
}
