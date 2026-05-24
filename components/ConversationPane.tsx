"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, User } from "lucide-react";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { ThinkingSpinner } from "@/components/ui/ThinkingSpinner";
import { cn } from "@/lib/utils";

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
  const prevLoadingRef = useRef(loading);
  const prevMessageCountRef = useRef(messages.length);
  const [liveAnnouncement, setLiveAnnouncement] = useState("");

  useEffect(() => {
    if (!messages.length) return;

    const lastUserIndex = [...messages]
      .map((m, i) => ({ ...m, i }))
      .filter((m) => m.role === "user")
      .at(-1)?.i;

    if (lastUserIndex == null) return;

    const el = lastUserRef.current;
    if (!el) return;

    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [messages.length, messages]);

  useEffect(() => {
    const lastMessage = messages.at(-1);

    if (messages.length > prevMessageCountRef.current && lastMessage?.role === "user") {
      setLiveAnnouncement("Your message was sent.");
    } else if (loading && !prevLoadingRef.current) {
      setLiveAnnouncement("Assistant is responding.");
    } else if (!loading && prevLoadingRef.current) {
      setLiveAnnouncement("Assistant finished responding.");
    }

    prevLoadingRef.current = loading;
    prevMessageCountRef.current = messages.length;
  }, [messages, loading]);

  if (!symbol) return null;

  const label = symbol === "PORTFOLIO" ? "portfolio" : symbol;

  if (messages.length === 0 && !loading) {
    return (
      <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-dashed border-border bg-muted-bg/30 px-6 py-10 text-center">
        <Bot className="mx-auto mb-3 h-8 w-8 text-muted" aria-hidden="true" />
        <p className="text-sm font-medium text-foreground">
          Ask anything about your {label}
        </p>
        <p className="mt-1 text-xs text-muted">
          Use quick prompts below or type your own question
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-4 max-w-3xl py-3">
      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {liveAnnouncement}
      </div>

      <div className="mb-4 text-xs font-medium uppercase tracking-wide text-muted">
        Conversation
      </div>
      <div
        className="space-y-4 pr-1"
        role="log"
        aria-label={`Conversation about your ${label}`}
      >
        {messages.map((m, idx) => {
          const isAssistant = m.role === "assistant";
          const isLastUser =
            m.role === "user" &&
            messages.findLastIndex((mm) => mm.role === "user") === idx;

          return (
            <div
              key={m.id}
              ref={isLastUser ? lastUserRef : null}
              style={{ scrollMarginTop: "4rem" }}
              className={cn(
                "flex gap-3",
                isAssistant ? "justify-start" : "justify-end",
              )}
            >
              {isAssistant && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent-strong">
                  <Bot className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
              )}

              <div
                aria-label={isAssistant ? "Assistant message" : "Your message"}
                className={cn(
                  "min-w-0 max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  isAssistant
                    ? "border border-border bg-surface-elevated text-foreground"
                    : "bg-secondary text-foreground",
                )}
              >
                <MarkdownRenderer content={m.content} />
              </div>

              {!isAssistant && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted-bg text-muted">
                  <User className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3" aria-busy="true" aria-label="Assistant is responding">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent-strong">
              <Bot className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <ThinkingSpinner />
          </div>
        )}
      </div>
    </div>
  );
}
