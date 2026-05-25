import type { ChatMessage } from "@/components/ConversationPane";
import { migrateChatKeyMap } from "@/lib/chatKeys";

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

const STORAGE_VERSION = 2;
const LEGACY_STORAGE_VERSION = 1;
const STORAGE_PREFIX = "powerpocket-chat";
const MAX_MESSAGES_PER_THREAD = 100;
const MAX_INPUT_LENGTH = 4000;

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}:v${STORAGE_VERSION}:${userId}`;
}

function legacyStorageKey(userId: string): string {
  return `${STORAGE_PREFIX}:v${LEGACY_STORAGE_VERSION}:${userId}`;
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

function trimThread(state: PersistedChatState): PersistedChatState {
  return {
    input: state.input.slice(0, MAX_INPUT_LENGTH),
    model: state.model,
    messages:
      state.messages.length > MAX_MESSAGES_PER_THREAD
        ? state.messages.slice(-MAX_MESSAGES_PER_THREAD)
        : state.messages,
  };
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

      result[key] = trimThread({
        input: typeof entry.input === "string" ? entry.input : "",
        messages,
        model: typeof entry.model === "string" ? entry.model : "",
      });
    }

    return result;
  } catch {
    return {};
  }
}

function readLegacySessionChat(userId: string): PersistedChatMap | null {
  if (typeof window === "undefined") return null;

  const raw = sessionStorage.getItem(legacyStorageKey(userId));
  if (!raw) return null;

  return parsePersistedChat(raw);
}

function migratePersistedChat(map: PersistedChatMap): PersistedChatMap {
  return migrateChatKeyMap(map, (existing, incoming) => {
    if (!existing) return incoming;
    if (incoming.messages.length > existing.messages.length) return incoming;
    return existing;
  });
}

export function loadPersistedChat(userId: string): PersistedChatMap {
  if (typeof window === "undefined") return {};

  const raw = localStorage.getItem(storageKey(userId));
  if (raw) return migratePersistedChat(parsePersistedChat(raw));

  const legacy = readLegacySessionChat(userId);
  if (legacy && Object.keys(legacy).length > 0) {
    const migrated = migratePersistedChat(legacy);
    try {
      localStorage.setItem(storageKey(userId), JSON.stringify(migrated));
      sessionStorage.removeItem(legacyStorageKey(userId));
    } catch {
      // ignore migration errors
    }
    return migrated;
  }

  return {};
}

export function persistChatState(
  userId: string,
  chatBySymbol: Record<string, ChatStateForPersistence>,
): void {
  if (typeof window === "undefined") return;

  const toSave: PersistedChatMap = {};

  for (const [key, state] of Object.entries(chatBySymbol)) {
    if (!state.messages.length && !state.input.trim()) continue;

    toSave[key] = trimThread({
      input: state.input,
      messages: state.messages,
      model: state.model,
    });
  }

  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(toSave));
  } catch {
    // localStorage full or unavailable — ignore
  }
}
