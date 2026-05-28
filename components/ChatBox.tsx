"use client";

import { ChevronDown, SendHorizontal, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import { flushSync } from "react-dom";
import { useSession } from "next-auth/react";
import type { ChatMessage } from "@/components/ConversationPane";
import { ModelPicker } from "@/components/ModelPicker";
import { QuickAnalysisBar } from "@/components/QuickAnalysisBar";
import { useAccountPlan } from "@/app/hooks/useAccountPlan";
import type { MainView } from "./NavList";
import type { QuickActionMode } from "@/lib/quickActions";
import { IconButton } from "@/components/ui/IconButton";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { pageShellClass } from "@/lib/pageLayout";
import { ASSISTANT_CHAT_INPUT_CLASS } from "@/lib/scrollToChat";
import { DEFAULT_CHAT_MODEL, getModelButtonLabel } from "@/lib/chatModels";
import {
  lockMainContentWhileModelMenuOpen,
  markModelMenuDismissed,
  registerModelMenuDismissListener,
} from "@/lib/chatModelMenu";

export { DEFAULT_CHAT_MODEL };

type SymbolChatState = {
  loading: boolean;
  input: string;
  messages: ChatMessage[];
  model: string;
  modelMenuOpen: boolean;
};

interface ChatBoxProps {
  mode: MainView;
  quickActionMode?: QuickActionMode;
  selectedSymbol: string | null;
  currentChat: SymbolChatState | undefined;
  disabled?: boolean;
  inputRows: number;
  onChangeInput: (value: string) => void;
  onSendPrompt: () => void;
  onSendQuickAction: (actionId: string) => void;
  onOpenModelMenu: () => void;
  onCloseModelMenu: () => void;
  onModelChange: (model: string) => void;
  onCollapse?: () => void;
  contextLabel?: string;
}

export function ChatBox({
  mode,
  quickActionMode,
  selectedSymbol,
  currentChat,
  disabled = false,
  inputRows,
  onChangeInput,
  onSendPrompt,
  onSendQuickAction,
  onOpenModelMenu,
  onCloseModelMenu,
  onModelChange,
  onCollapse,
  contextLabel,
}: ChatBoxProps) {
  const { data: session } = useSession();
  const { isPaid, plan } = useAccountPlan(session?.accessToken);
  const placeholderLabel =
    mode === "portfolio"
      ? "your portfolio"
      : mode === "research"
        ? (selectedSymbol ?? "this symbol")
        : selectedSymbol
          ? `your ${selectedSymbol} position`
          : "this position";
  const inputValue = currentChat?.input ?? "";
  const isChatLoading = !!currentChat?.loading;
  const isBusy = isChatLoading || disabled;
  const canSend = !isBusy && inputValue.trim().length > 0;
  const selectedModel = currentChat?.model || DEFAULT_CHAT_MODEL;
  const modelMenuOpen = !!currentChat?.modelMenuOpen;
  const modelButtonLabel = getModelButtonLabel(selectedModel);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const onCloseModelMenuRef = useRef(onCloseModelMenu);

  onCloseModelMenuRef.current = onCloseModelMenu;

  const dismissModelMenu = () => {
    markModelMenuDismissed();
    flushSync(() => {
      onCloseModelMenuRef.current();
    });
  };

  useEffect(() => {
    if (!modelMenuOpen || !modelMenuRef.current) return;

    const root = modelMenuRef.current;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismissModelMenu();
    };

    const unregisterDismiss = registerModelMenuDismissListener(root, () => {
      flushSync(() => {
        onCloseModelMenuRef.current();
      });
    });
    const unlockMainContent = lockMainContentWhileModelMenuOpen();

    document.addEventListener("keydown", handleEscape);

    return () => {
      unlockMainContent();
      unregisterDismiss();
      document.removeEventListener("keydown", handleEscape);
    };
  }, [modelMenuOpen]);

  return (
    <div className="bg-linear-to-t from-background via-background px-4 pb-4 pt-2 scrollbar-dark">
      <Card
        as="div"
        surface="subtle"
        className={cn(
          "flex flex-col gap-3 overflow-visible p-3 shadow-lg shadow-black/10 backdrop-blur",
          pageShellClass,
        )}
      >
        <CardBody flush className="flex flex-col gap-3 p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-muted">
              <Sparkles
                className="h-3.5 w-3.5 text-accent-strong"
                aria-hidden="true"
              />
              Assistant
            </div>
            {contextLabel && (
              <span className="rounded-full border border-border bg-background/60 px-2 py-0.5 text-[10px] font-medium normal-case tracking-normal text-foreground">
                {contextLabel}
              </span>
            )}
            {!isPaid && (
              <Badge variant="muted" className="normal-case tracking-normal">
                Free · Simple & Standard
              </Badge>
            )}
          </div>
          {onCollapse && (
            <IconButton
              size="sm"
              aria-label="Collapse assistant"
              onClick={onCollapse}
              className="md:hidden"
            >
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </IconButton>
          )}
        </div>

        {disabled ? (
          <p className="rounded-lg border border-dashed border-border bg-muted-bg/30 px-3 py-2 text-xs text-muted">
            {mode === "research"
              ? "Sign in to ask questions about this symbol."
              : "Connect Schwab in Settings to load holdings, then ask about your portfolio."}
          </p>
        ) : (
          <QuickAnalysisBar
            actionMode={quickActionMode ?? mode}
            symbol={mode === "portfolio" ? "PORTFOLIO" : (selectedSymbol ?? "")}
            loading={isBusy}
            onRunAction={(id) => void onSendQuickAction(id)}
          />
        )}

        <form
          className="flex flex-col gap-3 text-foreground"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSend) onSendPrompt();
          }}
        >
          <textarea
            rows={inputRows}
            disabled={isBusy}
            aria-label={`Ask about ${placeholderLabel}`}
            className={cn(
              ASSISTANT_CHAT_INPUT_CLASS,
              "max-h-52 min-h-12 w-full resize-none rounded-xl bg-background/60 px-3 py-2 text-sm leading-relaxed text-foreground outline-none ring-1 ring-transparent transition placeholder:text-muted focus:ring-border disabled:cursor-not-allowed disabled:opacity-60",
            )}
            placeholder={
              disabled
                ? "Load holdings to start chatting…"
                : isChatLoading
                  ? "Waiting for response…"
                  : `Ask anything about ${placeholderLabel}…`
            }
            value={inputValue}
            onChange={(e) => onChangeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (canSend) onSendPrompt();
              }
            }}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-[11px] text-muted">
              Enter to send · Shift Enter for a new line
            </div>

            <div
              ref={modelMenuRef}
              data-model-menu-root
              className="relative flex items-center gap-2"
            >
              <button
                type="button"
                disabled={isBusy}
                aria-expanded={modelMenuOpen}
                aria-haspopup="listbox"
                aria-label={`Model: ${modelButtonLabel}`}
                onPointerDown={(event) => {
                  if (!modelMenuOpen) return;
                  event.preventDefault();
                  dismissModelMenu();
                }}
                onClick={() => {
                  if (modelMenuOpen) return;
                  onOpenModelMenu();
                }}
                className={cn(
                  "inline-flex max-w-44 items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-muted transition-all duration-200 ease-out hover:bg-muted-bg hover:text-foreground sm:max-w-none",
                  "disabled:opacity-60",
                  modelMenuOpen && "bg-muted-bg text-foreground",
                )}
              >
                <span className="truncate">{modelButtonLabel}</span>
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform",
                    modelMenuOpen && "rotate-180",
                  )}
                  aria-hidden="true"
                />
              </button>

              <ModelPicker
                open={modelMenuOpen}
                value={selectedModel}
                onChange={onModelChange}
                isPaid={isPaid}
                anchorRef={modelMenuRef}
              />

              <button
                type="submit"
                disabled={!canSend}
                aria-busy={isChatLoading}
                className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isChatLoading ? (
                  "Analyzing…"
                ) : (
                  <>
                    Send
                    <SendHorizontal
                      className="h-3.5 w-3.5"
                      aria-hidden="true"
                    />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
        </CardBody>
      </Card>
    </div>
  );
}
