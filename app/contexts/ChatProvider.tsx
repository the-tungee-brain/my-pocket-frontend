"use client";

import { createContext, useContext, type ReactNode } from "react";
import {
  useChatState,
  type UseChatStateParams,
} from "@/app/hooks/useChatState";
import type { ChatContextValue } from "@/app/contexts/chatContextTypes";

const ChatContext = createContext<ChatContextValue | null>(null);

type Props = UseChatStateParams & { children: ReactNode };

/** Standalone chat provider; portfolio shell uses `useChatState` via `PositionsProvider`. */
export function ChatProvider({ children, ...params }: Props) {
  const value = useChatState(params);
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChatContext must be used within ChatProvider");
  }
  return ctx;
}

/** Alias used by portfolio shell consumers. */
export function useAppChatContext() {
  return useChatContext();
}
