"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, Loader2, Plus } from "lucide-react";
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
  historyRevision?: number;
  showNewChat?: boolean;
  onRestoreSession: (sessionId: string, messages: ChatMessage[]) => void;
  onStartNewSession: () => void;
  className?: string;
};

export function ChatSessionHistory({
  activeChatKey,
  accessToken,
  currentSessionId,
  historyRevision = 0,
  showNewChat = false,
  onRestoreSession,
  onStartNewSession,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !accessToken) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setSessions([]);
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
  }, [open, accessToken, activeChatKey, historyRevision]);

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

  const handleStartNew = () => {
    onStartNewSession();
    setOpen(false);
  };

  return (
    <div ref={menuRef} className={cn("relative", className)}>
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
          <div className="flex items-start justify-between gap-2 border-b border-border px-3 py-2">
            <div>
              <p className="text-xs font-semibold text-foreground">
                Chat history
              </p>
              <p className="text-[10px] text-muted">
                {showNewChat
                  ? "Start fresh or resume a past conversation"
                  : "Resume a past conversation"}
              </p>
            </div>
            {showNewChat && (
              <button
                type="button"
                onClick={handleStartNew}
                className="inline-flex shrink-0 items-center gap-1 rounded-md border border-accent/30 bg-accent-muted/40 px-2 py-1 text-[10px] font-medium text-accent-strong transition hover:border-accent/50 hover:bg-accent-muted"
              >
                <Plus className="h-3 w-3" aria-hidden />
                New chat
              </button>
            )}
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
                No saved sessions yet. Start a chat to create one.
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
