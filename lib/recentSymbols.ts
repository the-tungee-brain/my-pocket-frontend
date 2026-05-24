const STORAGE_KEY = "powerpocket-recent-symbols";
const RECENT_EVENT = "powerpocket-recent-symbols-updated";
const MAX_RECENT = 8;

function normalize(symbol: string): string {
  return symbol.trim().toUpperCase();
}

function readRecent(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((s) => typeof s === "string").map(normalize);
  } catch {
    return [];
  }
}

function writeRecent(symbols: string[]): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(symbols));
    window.dispatchEvent(new Event(RECENT_EVENT));
  } catch {
    // ignore
  }
}

export function getRecentSymbols(): string[] {
  return readRecent();
}

export function addRecentSymbol(symbol: string): string[] {
  const upper = normalize(symbol);
  if (!upper) return readRecent();

  const next = [upper, ...readRecent().filter((item) => item !== upper)].slice(
    0,
    MAX_RECENT,
  );
  writeRecent(next);
  return next;
}

export function clearRecentSymbols(): string[] {
  writeRecent([]);
  return [];
}

export const RECENT_SYMBOLS_UPDATED_EVENT = RECENT_EVENT;
