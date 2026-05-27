"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Check, Copy, Trash2, User } from "lucide-react";
import { ConversationalMarkdown } from "@/components/ui/ConversationalMarkdown";
import { ChatFollowUpChips } from "@/components/ChatFollowUpChips";
import { ThinkingSpinner } from "@/components/ui/ThinkingSpinner";
import {
  getVisibleAssistantContent,
  parseChatFollowUps,
  shouldShowFollowUpSuggestions,
} from "@/lib/chatFollowUpSuggestions";
import { compactTextButtonClass } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { pageShellClass } from "@/lib/pageLayout";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

interface ConversationPaneProps {
  symbol: string | null;
  messages: ChatMessage[];
  loading: boolean;
  onClear?: () => void;
  onFollowUpPrompt?: (prompt: string) => void;
  historyControl?: React.ReactNode;
}

function CopyMessageButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      aria-label={copied ? "Copied" : "Copy message"}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-muted transition hover:bg-muted-bg hover:text-foreground"
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-success" aria-hidden="true" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3 w-3" aria-hidden="true" />
          Copy
        </>
      )}
    </button>
  );
}

export function ConversationPane({
  symbol,
  messages,
  loading,
  onClear,
  onFollowUpPrompt,
  historyControl,
}: ConversationPaneProps) {
  const lastUserRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const prevLoadingRef = useRef(loading);
  const prevMessageCountRef = useRef(messages.length);
  const prevUserMessageCountRef = useRef(0);
  const [liveAnnouncement, setLiveAnnouncement] = useState("");

  useEffect(() => {
    const userMessageCount = messages.filter((m) => m.role === "user").length;

    if (userMessageCount > prevUserMessageCountRef.current) {
      setLiveAnnouncement("Your message was sent.");
      lastUserRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (loading && !prevLoadingRef.current) {
      setLiveAnnouncement("Assistant is responding.");
    } else if (!loading && prevLoadingRef.current) {
      setLiveAnnouncement("Assistant finished responding.");
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }

    prevLoadingRef.current = loading;
    prevMessageCountRef.current = messages.length;
    prevUserMessageCountRef.current = userMessageCount;
  }, [messages, loading]);

  if (!symbol) return null;

  const label = symbol === "PORTFOLIO" ? "portfolio" : symbol;
  const canClear = !!onClear && messages.length > 0 && !loading;

  if (messages.length === 0 && !loading) {
    return (
      <div className={cn("mx-auto mt-6", pageShellClass)}>
        {historyControl && (
          <div className="mb-4 flex items-center justify-end gap-2">
            {historyControl}
          </div>
        )}
        <EmptyState
          icon={Bot}
          title={`Ask anything about ${label === "portfolio" ? "your portfolio" : label}`}
          description="Use quick prompts below or type your own question"
        />
      </div>
    );
  }

  return (
    <div className={cn("mx-auto mt-4 py-3", pageShellClass)}>
      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      >
        {liveAnnouncement}
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-xs font-medium uppercase tracking-wide text-muted">
          Conversation
        </div>
        <div className="flex items-center gap-2">
          {historyControl}
          {canClear && (
            <button
              type="button"
              className={compactTextButtonClass}
              onClick={onClear}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Clear
            </button>
          )}
        </div>
      </div>

      <div
        className="space-y-4 pr-1"
        role="log"
        aria-label={`Conversation about ${label === "portfolio" ? "your portfolio" : label}`}
      >
        {messages.map((m, idx) => {
          const isAssistant = m.role === "assistant";
          const isLastAssistant =
            isAssistant &&
            messages.findLastIndex((mm) => mm.role === "assistant") === idx;
          const isLastUser =
            m.role === "user" &&
            messages.findLastIndex((mm) => mm.role === "user") === idx;
          const showFollowUps =
            isAssistant && shouldShowFollowUpSuggestions(messages, idx, loading);
          const followUpSuggestions = showFollowUps
            ? parseChatFollowUps(m.content)
            : [];

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
                  "min-w-0 rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  isAssistant
                    ? "max-w-[min(100%,42rem)] border border-border bg-surface-elevated text-foreground"
                    : "max-w-[85%] bg-secondary text-foreground",
                )}
              >
                {isAssistant ? (
                  <ConversationalMarkdown
                    content={m.content}
                    isStreaming={loading && isLastAssistant}
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                    {m.content}
                  </p>
                )}
                {isAssistant && m.content && !loading && (
                  <div className="mt-2 border-t border-border pt-2">
                    <CopyMessageButton
                      content={getVisibleAssistantContent(m.content)}
                    />
                  </div>
                )}
                {isAssistant && onFollowUpPrompt && showFollowUps && (
                  <ChatFollowUpChips
                    suggestions={followUpSuggestions}
                    disabled={loading}
                    onSelect={onFollowUpPrompt}
                  />
                )}
              </div>

              {!isAssistant && (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted-bg text-muted">
                  <User className="h-3.5 w-3.5" aria-hidden="true" />
                </div>
              )}
            </div>
          );
        })}

        {loading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex gap-3" aria-busy="true" aria-label="Assistant is responding">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent-strong">
              <Bot className="h-3.5 w-3.5" aria-hidden="true" />
            </div>
            <ThinkingSpinner />
          </div>
        )}
        <div ref={endRef} aria-hidden="true" />
      </div>
    </div>
  );
}
