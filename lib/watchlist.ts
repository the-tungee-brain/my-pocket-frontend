const STORAGE_KEY = "powerpocket-watchlist";
const WATCHLIST_EVENT = "powerpocket-watchlist-updated";

function normalize(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function readWatchlist(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((s) => typeof s === "string").map(normalize))].sort();
  } catch {
    return [];
  }
}

function writeWatchlist(symbols: string[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(symbols));
    window.dispatchEvent(new Event(WATCHLIST_EVENT));
  } catch {
    // ignore
  }
}

export function getWatchlist(): string[] {
  return readWatchlist();
}

export function isWatchlisted(symbol: string): boolean {
  const upper = normalize(symbol);
  return readWatchlist().includes(upper);
}

export function addToWatchlist(symbol: string): string[] {
  const upper = normalize(symbol);
  if (!upper) return readWatchlist();

  const next = [...new Set([...readWatchlist(), upper])].sort();
  writeWatchlist(next);
  return next;
}

export function removeFromWatchlist(symbol: string): string[] {
  const upper = normalize(symbol);
  const next = readWatchlist().filter((item) => item !== upper);
  writeWatchlist(next);
  return next;
}

export function toggleWatchlist(symbol: string): {
  symbols: string[];
  added: boolean;
} {
  if (isWatchlisted(symbol)) {
    return { symbols: removeFromWatchlist(symbol), added: false };
  }
  return { symbols: addToWatchlist(symbol), added: true };
}

export const WATCHLIST_UPDATED_EVENT = WATCHLIST_EVENT;
