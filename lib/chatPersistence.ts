import type { ChatMessage } from "@/components/ConversationPane";

type PersistedChatState = {
  input: string;
  messages: ChatMessage[];
  model: string;
};

export type PersistedChatMap = Record<string, PersistedChatState>;

type ChatStateForPersistence = {
  loading: boolean;
  input: string;
  messages: ChatMessage[];
  model: string;
  modelMenuOpen: boolean;
};

const STORAGE_VERSION = 1;
const STORAGE_PREFIX = "powerpocket-chat";

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}:v${STORAGE_VERSION}:${userId}`;
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const msg = value as Record<string, unknown>;
  return (
    typeof msg.id === "string" &&
    (msg.role === "user" || msg.role === "assistant") &&
    typeof msg.content === "string"
  );
}

function parsePersistedChat(raw: string): PersistedChatMap {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};

    const result: PersistedChatMap = {};

    for (const [key, value] of Object.entries(parsed)) {
      if (!value || typeof value !== "object") continue;
      const entry = value as Record<string, unknown>;
      const messages = Array.isArray(entry.messages)
        ? entry.messages.filter(isChatMessage)
        : [];

      result[key] = {
        input: typeof entry.input === "string" ? entry.input : "",
        messages,
        model: typeof entry.model === "string" ? entry.model : "",
      };
    }

    return result;
  } catch {
    return {};
  }
}

export function loadPersistedChat(userId: string): PersistedChatMap {
  if (typeof window === "undefined") return {};

  const raw = sessionStorage.getItem(storageKey(userId));
  if (!raw) return {};

  return parsePersistedChat(raw);
}

export function persistChatState(
  userId: string,
  chatBySymbol: Record<string, ChatStateForPersistence>,
): void {
  if (typeof window === "undefined") return;

  const toSave: PersistedChatMap = {};

  for (const [key, state] of Object.entries(chatBySymbol)) {
    if (!state.messages.length && !state.input.trim()) continue;

    toSave[key] = {
      input: state.input,
      messages: state.messages,
      model: state.model,
    };
  }

  try {
    sessionStorage.setItem(storageKey(userId), JSON.stringify(toSave));
  } catch {
    // sessionStorage full or unavailable — ignore
  }
}
