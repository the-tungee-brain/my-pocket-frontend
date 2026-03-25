"use client";

import { useEffect, useRef } from "react";
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
}

export function ConversationPane({
  symbol,
  messages,
  loading,
}: ConversationPaneProps) {
  const lastUserRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!messages.length) return;

    const lastUserIndex = [...messages]
      .map((m, i) => ({ ...m, i }))
      .filter((m) => m.role === "user")
      .at(-1)?.i;

    if (lastUserIndex == null) return;

    const el = lastUserRef.current;
    if (!el) return;

    const paddingTop = 50;
    const rect = el.getBoundingClientRect();
    const absoluteTop = rect.top + window.scrollY;

    window.scrollTo({
      top: absoluteTop - paddingTop,
      behavior: "smooth",
    });
  }, [messages.length, messages, symbol]);

  if (!symbol) return null;

  const label = symbol === "PORTFOLIO" ? "portfolio" : symbol;

  return (
    <div className="mx-auto mt-4 max-w-3xl py-3">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-foreground">
        Conversation for {label}
      </div>
      <div className="space-y-6 pr-1">
        {messages.map((m, idx) => {
          const isAssistant = m.role === "assistant";
          const isLastUser =
            m.role === "user" &&
            messages.findLastIndex((mm) => mm.role === "user") === idx;

          return (
            <div
              key={m.id}
              ref={isLastUser ? lastUserRef : null}
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

        <div />
      </div>
    </div>
  );
}
