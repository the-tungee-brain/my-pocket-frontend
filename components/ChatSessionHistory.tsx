"use client";

import { useEffect, useState } from "react";
import { Clock, Loader2 } from "lucide-react";
import type { ChatSessionSummary } from "@/app/types/chat";
import type { ChatMessage } from "@/components/ConversationPane";
import { listSessionsForChatKey, loadChatSessionById } from "@/lib/chatHistory";
import { formatRelativeUpdatedAt } from "@/lib/timeUtils";
import { compactTextButtonClass } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Props = {
  activeChatKey: string;
  accessToken?: string | null;
  currentSessionId?: string | null;
  onRestoreSession: (sessionId: string, messages: ChatMessage[]) => void;
  className?: string;
};

export function ChatSessionHistory({
  activeChatKey,
  accessToken,
  currentSessionId,
  onRestoreSession,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !accessToken) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const rows = await listSessionsForChatKey(accessToken!, activeChatKey);
        if (!cancelled) setSessions(rows);
      } catch {
        if (!cancelled) setSessions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [open, accessToken, activeChatKey]);

  const handleRestore = async (sessionId: string) => {
    if (!accessToken) return;
    setRestoringId(sessionId);
    try {
      const loaded = await loadChatSessionById(
        accessToken,
        activeChatKey,
        sessionId,
      );
      if (loaded) {
        onRestoreSession(sessionId, loaded.messages);
        setOpen(false);
      }
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        className={compactTextButtonClass}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Clock className="h-3.5 w-3.5" aria-hidden />
        History
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-72 overflow-hidden rounded-xl border border-border bg-background shadow-lg">
          <div className="border-b border-border px-3 py-2">
            <p className="text-xs font-semibold text-foreground">
              Chat history
            </p>
            <p className="text-[10px] text-muted">
              Resume a previous conversation
            </p>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {loading && (
              <div className="flex items-center gap-2 px-3 py-4 text-xs text-muted">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                Loading sessions…
              </div>
            )}

            {!loading && sessions.length === 0 && (
              <p className="px-3 py-4 text-xs text-muted">
                No saved sessions for this view yet.
              </p>
            )}

            {!loading &&
              sessions.map((session) => {
                const isCurrent = session.id === currentSessionId;
                const isRestoring = restoringId === session.id;

                return (
                  <button
                    key={session.id}
                    type="button"
                    disabled={isRestoring}
                    onClick={() => void handleRestore(session.id)}
                    className={cn(
                      "flex w-full flex-col items-start gap-0.5 border-b border-border/60 px-3 py-2.5 text-left transition hover:bg-muted-bg/60 disabled:opacity-60",
                      isCurrent && "bg-accent-muted/20",
                    )}
                  >
                    <span className="line-clamp-2 text-xs font-medium text-foreground">
                      {session.title?.replace(/^[^:]+:\s*/, "") ??
                        "Untitled chat"}
                    </span>
                    <span className="text-[10px] text-muted">
                      {formatRelativeUpdatedAt(
                        new Date(session.updatedAt).getTime(),
                      )}
                      {isCurrent ? " · current" : ""}
                    </span>
                  </button>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
