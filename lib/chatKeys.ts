import type { MainView } from "@/components/NavList";

export const PORTFOLIO_CHAT_KEY = "__PORTFOLIO_CHAT__";
export const NONE_CHAT_KEY = "__NONE__";

export function normalizeSymbol(symbol: string | null | undefined): string | null {
  if (!symbol) return null;
  const trimmed = symbol.trim();
  return trimmed ? trimmed.toUpperCase() : null;
}

export function symbolChatKey(symbol: string | null | undefined): string | null {
  return normalizeSymbol(symbol);
}

export function legacyResearchChatKey(symbol: string | null | undefined): string | null {
  const normalized = normalizeSymbol(symbol);
  return normalized ? `__RESEARCH_${normalized}__` : null;
}

export function isLegacyResearchChatKey(key: string): boolean {
  return key.startsWith("__RESEARCH_") && key.endsWith("__");
}

export function symbolFromLegacyResearchChatKey(key: string): string | null {
  if (!isLegacyResearchChatKey(key)) return null;
  return key.slice("__RESEARCH_".length, -2).toUpperCase();
}

export function resolveActiveChatKey(opts: {
  selectedView: MainView;
  selectedSymbol: string | null;
  routeSymbol?: string | null;
}): string {
  if (opts.selectedView === "portfolio") {
    return PORTFOLIO_CHAT_KEY;
  }

  const symbol =
    normalizeSymbol(opts.routeSymbol) ?? normalizeSymbol(opts.selectedSymbol);
  return symbol ?? NONE_CHAT_KEY;
}

export function migrateChatKeyMap<T>(
  map: Record<string, T>,
  merge: (existing: T | undefined, incoming: T) => T,
): Record<string, T> {
  const result: Record<string, T> = { ...map };

  for (const [key, value] of Object.entries(map)) {
    const symbol = symbolFromLegacyResearchChatKey(key);
    if (!symbol) continue;

    result[symbol] = merge(result[symbol], value);
    delete result[key];
  }

  return result;
}
