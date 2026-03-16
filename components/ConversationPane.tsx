"use client";

import { useEffect, RefObject } from "react";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { ThinkingSpinner } from "@/components/ui/ThinkingSpinner";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

interface ConversationPaneProps {
  symbol: string | null;
  messages: ChatMessage[];
  loading: boolean;
  conversationEndRef: RefObject<HTMLDivElement | null>;
}

export function ConversationPane({
  symbol,
  messages,
  loading,
  conversationEndRef,
}: ConversationPaneProps) {
  useEffect(() => {
    if (!messages.length) return;
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, conversationEndRef]);

  if (!symbol) return null;

  return (
    <div className="mx-auto mt-4 max-w-3xl py-3">
      <div className="mb-3 text-xs font-semibold text-foreground tracking-wide uppercase">
        Conversation for {symbol}
      </div>
      <div className="space-y-6 pr-1">
        {messages.map((m) => {
          const isAssistant = m.role === "assistant";
          return (
            <div
              key={m.id}
              className={
                isAssistant ? "flex justify-start" : "flex justify-end"
              }
            >
              <div
                className={
                  isAssistant
                    ? "w-full max-w-3xl rounded-2xl bg-transparent text-base leading-relaxed text-foreground"
                    : "inline-block max-w-[80%] rounded-2xl bg-secondary px-4 pt-3 text-base leading-relaxed text-foreground"
                }
              >
                <MarkdownRenderer content={m.content} />
              </div>
            </div>
          );
        })}

        {loading && <ThinkingSpinner />}

        <div ref={conversationEndRef} />
      </div>
    </div>
  );
}
