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

export function chatKeySessionQuery(
  activeChatKey: string,
): ChatKeySessionQuery | null {
  if (activeChatKey === "__NONE__") return null;

  if (activeChatKey === "__PORTFOLIO_CHAT__") {
    return { kind: "portfolio", titlePrefix: "Portfolio:" };
  }

  if (activeChatKey.startsWith("__RESEARCH_") && activeChatKey.endsWith("__")) {
    const symbol = activeChatKey.slice("__RESEARCH_".length, -2).toUpperCase();
    return { kind: "research", titlePrefix: `Research:${symbol}:` };
  }

  if (activeChatKey.startsWith("__")) return null;

  return {
    kind: "portfolio",
    titlePrefix: `Symbol:${activeChatKey.toUpperCase()}:`,
  };
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

export function mapServerMessages(messages: ServerChatMessage[]): ChatMessage[] {
  return messages
    .filter(
      (message) => message.role === "user" || message.role === "assistant",
    )
    .map((message) => ({
      id: `server-${message.id}`,
      role: message.role as "user" | "assistant",
      content: message.content,
    }));
}

export async function loadChatHistoryForKey(
  accessToken: string,
  activeChatKey: string,
): Promise<{ sessionId: string; messages: ChatMessage[] } | null> {
  const query = chatKeySessionQuery(activeChatKey);
  if (!query) return null;

  const kind = query.kind === "other" ? "all" : query.kind;
  const sessionsResponse = await listChatSessions(accessToken, { kind });
  const session = findLatestSessionForChatKey(
    sessionsResponse.sessions,
    query,
  );
  if (!session) return null;

  const messagesResponse = await getChatSessionMessages(
    accessToken,
    session.id,
  );
  const messages = mapServerMessages(messagesResponse.messages);
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

  const query = chatKeySessionQuery(activeChatKey);
  if (!query) return;

  await clearChatSessionsByPrefix(accessToken, query.titlePrefix);
}
