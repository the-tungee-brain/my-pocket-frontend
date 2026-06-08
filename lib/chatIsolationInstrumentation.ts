import type { QueryClient, QueryKey } from "@tanstack/react-query";

const PAGE_QUERY_PREFIXES = [
  "portfolio",
  "portfolio-news",
  "research",
  "research-events",
  "watchlist",
  "symbolIntelligence",
  "symbol-intelligence",
] as const;

const CHAT_QUERY_PREFIXES = [
  "aiChatContext",
  "aiChatStream",
  "aiChatHistory",
  "chat-history",
  "chat-sessions",
] as const;

export function classifyQueryKey(queryKey: QueryKey): "chat" | "page" | "other" {
  const first = Array.isArray(queryKey) ? queryKey[0] : queryKey;
  const prefix = String(first ?? "");
  if (CHAT_QUERY_PREFIXES.some((item) => prefix.startsWith(item))) {
    return "chat";
  }
  if (PAGE_QUERY_PREFIXES.some((item) => prefix.startsWith(item))) {
    return "page";
  }
  return "other";
}

export function installChatIsolationQueryLogger(queryClient: QueryClient) {
  if (
    process.env.NODE_ENV !== "development" ||
    typeof window === "undefined" ||
    window.localStorage.getItem("tomcrest:debug-chat-isolation") !== "1"
  ) {
    return () => {};
  }

  const inflightKeys = new Set<string>();

  return queryClient.getQueryCache().subscribe((event) => {
    if (event.type !== "updated") return;

    const query = event.query;
    const key = JSON.stringify(query.queryKey);
    const fetching = query.state.fetchStatus === "fetching";
    if (!fetching) {
      inflightKeys.delete(key);
      return;
    }
    if (inflightKeys.has(key)) return;
    inflightKeys.add(key);

    const source = classifyQueryKey(query.queryKey);
    console.debug("[chat-isolation:query-refetch]", {
      source,
      queryKey: query.queryKey,
      trigger: source === "chat" ? "chat" : "page-or-background",
      at: new Date().toISOString(),
    });
  });
}
