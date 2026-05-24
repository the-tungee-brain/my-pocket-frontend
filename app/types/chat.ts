export type ChatSessionKind = "portfolio" | "research" | "other";

export type ChatSessionSummary = {
  id: string;
  title: string | null;
  model: string;
  kind: ChatSessionKind;
  createdAt: string;
  updatedAt: string;
};

export type ServerChatMessage = {
  id: number;
  role: string;
  content: string;
  createdAt: string;
};

export type ChatSessionsResponse = {
  sessions: ChatSessionSummary[];
};

export type ChatSessionMessagesResponse = {
  sessionId: string;
  messages: ServerChatMessage[];
};
