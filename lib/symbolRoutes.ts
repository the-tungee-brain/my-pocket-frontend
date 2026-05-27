import type { ResearchTabId } from "@/components/ResearchTabBar";

export function symbolHubPath(
  symbol: string,
  tab: ResearchTabId = "overview",
): string {
  const encoded = encodeURIComponent(symbol.trim().toUpperCase());
  return `/research/${encoded}/${tab}`;
}

export function parseResearchRoute(pathname: string): {
  symbol: string | null;
  tab: string | null;
} {
  const match = pathname.match(/^\/research\/([^/]+)(?:\/([^/]+))?/);
  if (!match) {
    return { symbol: null, tab: null };
  }

  return {
    symbol: decodeURIComponent(match[1]).toUpperCase(),
    tab: match[2] ?? null,
  };
}
