import {
  chatDisplayTarget,
  restoreQuickActionDisplayMessage,
} from "@/lib/quickActions";
import {
  isLegacyResearchChatKey,
  PORTFOLIO_CHAT_KEY,
  symbolFromLegacyResearchChatKey,
} from "@/lib/chatKeys";
import type { MainView } from "@/components/NavList";
import type { ChatMessage } from "@/components/ConversationPane";
import type {
  ChatSessionKind,
  ChatSessionSummary,
  ServerChatMessage,
} from "@/app/types/chat";
import {
  listChatSessions,
  getChatSessionMessages,
  deleteChatSession,
  clearChatSessionsByPrefix,
} from "@/lib/apiClient";

export type ChatKeySessionQuery = {
  kind: ChatSessionKind;
  titlePrefix: string;
};

export function chatKeySessionQueries(
  activeChatKey: string,
  _selectedView?: MainView,
): ChatKeySessionQuery[] {
  if (activeChatKey === "__NONE__") return [];

  if (activeChatKey === PORTFOLIO_CHAT_KEY) {
    return [{ kind: "portfolio", titlePrefix: "Portfolio:" }];
  }

  if (isLegacyResearchChatKey(activeChatKey)) {
    const symbol = symbolFromLegacyResearchChatKey(activeChatKey);
    if (!symbol) return [];
    return [
      { kind: "portfolio", titlePrefix: `Symbol:${symbol}:` },
      { kind: "research", titlePrefix: `Research:${symbol}:` },
    ];
  }

  if (activeChatKey.startsWith("__")) return [];

  const symbol = activeChatKey.toUpperCase();
  return [
    { kind: "portfolio", titlePrefix: `Symbol:${symbol}:` },
    { kind: "research", titlePrefix: `Research:${symbol}:` },
  ];
}

export function chatKeySessionQuery(
  activeChatKey: string,
): ChatKeySessionQuery | null {
  return chatKeySessionQueries(activeChatKey)[0] ?? null;
}

export function findLatestSessionForChatKey(
  sessions: ChatSessionSummary[],
  query: ChatKeySessionQuery,
): ChatSessionSummary | null {
  return (
    sessions.find(
      (session) =>
        session.kind === query.kind &&
        (session.title?.startsWith(query.titlePrefix) ?? false),
    ) ?? null
  );
}

export function findLatestSessionForQueries(
  sessions: ChatSessionSummary[],
  queries: ChatKeySessionQuery[],
): ChatSessionSummary | null {
  let latest: ChatSessionSummary | null = null;

  for (const query of queries) {
    const match = findLatestSessionForChatKey(sessions, query);
    if (!match) continue;
    if (
      !latest ||
      new Date(match.updatedAt).getTime() > new Date(latest.updatedAt).getTime()
    ) {
      latest = match;
    }
  }

  return latest;
}

export function mapServerMessages(
  messages: ServerChatMessage[],
  activeChatKey: string,
): ChatMessage[] {
  const target = chatDisplayTarget(activeChatKey);

  return messages
    .filter(
      (message) => message.role === "user" || message.role === "assistant",
    )
    .map((message) => {
      const content =
        message.role === "user"
          ? restoreQuickActionDisplayMessage(message.content, target)
          : message.content;

      return {
        id: `server-${message.id}`,
        role: message.role as "user" | "assistant",
        content,
      };
    });
}

export async function listSessionsForChatKey(
  accessToken: string,
  activeChatKey: string,
  selectedView?: MainView,
): Promise<ChatSessionSummary[]> {
  const queries = chatKeySessionQueries(activeChatKey, selectedView);
  if (!queries.length) return [];

  const kinds = new Set(queries.map((query) => query.kind));
  const merged: ChatSessionSummary[] = [];

  for (const kind of kinds) {
    const resolvedKind = kind === "other" ? "all" : kind;
    const sessionsResponse = await listChatSessions(accessToken, {
      kind: resolvedKind,
    });
    merged.push(
      ...sessionsResponse.sessions.filter((session) =>
        queries.some((query) => session.title?.startsWith(query.titlePrefix)),
      ),
    );
  }

  return merged
    .filter((session, index, all) => {
      const firstIndex = all.findIndex((entry) => entry.id === session.id);
      return firstIndex === index;
    })
    .sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export async function loadChatSessionById(
  accessToken: string,
  activeChatKey: string,
  sessionId: string,
): Promise<{ sessionId: string; messages: ChatMessage[] } | null> {
  const messagesResponse = await getChatSessionMessages(accessToken, sessionId);
  const messages = mapServerMessages(messagesResponse.messages, activeChatKey);
  if (messages.length === 0) return null;
  return { sessionId, messages };
}

export async function loadChatHistoryForKey(
  accessToken: string,
  activeChatKey: string,
  selectedView?: MainView,
): Promise<{ sessionId: string; messages: ChatMessage[] } | null> {
  const queries = chatKeySessionQueries(activeChatKey, selectedView);
  if (!queries.length) return null;

  const kinds = new Set(queries.map((query) => query.kind));
  const mergedSessions: ChatSessionSummary[] = [];

  for (const kind of kinds) {
    const resolvedKind = kind === "other" ? "all" : kind;
    const sessionsResponse = await listChatSessions(accessToken, {
      kind: resolvedKind,
    });
    mergedSessions.push(...sessionsResponse.sessions);
  }

  const session = findLatestSessionForQueries(mergedSessions, queries);
  if (!session) return null;

  const messagesResponse = await getChatSessionMessages(
    accessToken,
    session.id,
  );
  const messages = mapServerMessages(messagesResponse.messages, activeChatKey);
  if (messages.length === 0) return null;

  return { sessionId: session.id, messages };
}

export function shouldApplyServerHistory(
  localMessages: ChatMessage[],
  serverMessages: ChatMessage[],
): boolean {
  if (serverMessages.length === 0) return false;
  if (localMessages.length === 0) return true;
  return serverMessages.length >= localMessages.length;
}

export async function clearChatHistoryForKey(
  accessToken: string,
  activeChatKey: string,
  sessionId?: string | null,
): Promise<void> {
  if (sessionId) {
    await deleteChatSession(accessToken, sessionId);
    return;
  }

  const queries = chatKeySessionQueries(activeChatKey);
  for (const query of queries) {
    await clearChatSessionsByPrefix(accessToken, query.titlePrefix);
  }
}
