"use client";

import { ChevronDown, SendHorizontal, Sparkles } from "lucide-react";
import type { RefObject } from "react";
import type { ChatMessage } from "@/components/ConversationPane";
import { Dropdown } from "@/components/Dropdown";
import { QuickAnalysisBar } from "@/components/QuickAnalysisBar";
import type { MainView } from "./NavList";

type SymbolChatState = {
  loading: boolean;
  input: string;
  messages: ChatMessage[];
  model: string;
  modelMenuOpen: boolean;
};

const MODEL_OPTIONS = [
  "gpt-5.4",
  "gpt-5.1",
  "gpt-5-mini",
  "gpt-5-nano",
  "o3",
  "o4-mini",
  "gpt-4.1",
  "gpt-4.1-mini",
  "gpt-4.1-nano",
  "gpt-4o",
  "gpt-4o-mini",
];

interface ChatBoxProps {
  mode: MainView;
  selectedSymbol: string | null;
  currentChat: SymbolChatState | undefined;
  inputRows: number;
  modelMenuRef: RefObject<HTMLDivElement | null>;
  onChangeInput: (value: string) => void;
  onSendPrompt: () => void;
  onSendQuickAction: (actionId: string) => void;
  onToggleModelMenu: () => void;
  onModelChange: (model: string) => void;
}

export function ChatBox({
  mode,
  selectedSymbol,
  currentChat,
  inputRows,
  modelMenuRef,
  onChangeInput,
  onSendPrompt,
  onSendQuickAction,
  onToggleModelMenu,
  onModelChange,
}: ChatBoxProps) {
  const placeholderLabel =
    mode === "portfolio"
      ? "your portfolio"
      : selectedSymbol
        ? `your ${selectedSymbol} position`
        : "this position";
  const inputValue = currentChat?.input ?? "";
  const canSend = !currentChat?.loading && inputValue.trim().length > 0;

  return (
    <div className="bg-gradient-to-t from-background via-background px-4 pb-4 pt-2 scrollbar-dark">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 rounded-2xl border border-border bg-secondary/95 p-3 shadow-lg shadow-black/10 backdrop-blur">
        <div className="flex items-center gap-2 px-1 text-[11px] font-medium uppercase tracking-wide text-muted">
          <Sparkles
            className="h-3.5 w-3.5 text-accent-strong"
            aria-hidden="true"
          />
          Assistant prompts
        </div>

        <QuickAnalysisBar
          symbol={mode === "portfolio" ? "PORTFOLIO" : (selectedSymbol ?? "")}
          loading={!!currentChat?.loading}
          onRunAction={(id) => void onSendQuickAction(id)}
        />

        <form
          className="flex flex-col gap-3 text-foreground"
          onSubmit={(e) => {
            e.preventDefault();
            onSendPrompt();
          }}
        >
          <textarea
            rows={inputRows}
            aria-label={`Ask about ${placeholderLabel}`}
            className="max-h-52 min-h-12 w-full resize-none rounded-xl bg-background/60 px-3 py-2 text-sm leading-relaxed text-foreground outline-none ring-1 ring-transparent transition placeholder:text-neutral-500 focus:ring-border"
            placeholder={`Ask anything about ${placeholderLabel}…`}
            value={inputValue}
            onChange={(e) => onChangeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (
                  !currentChat?.loading &&
                  (currentChat?.input ?? "").trim().length > 0
                ) {
                  onSendPrompt();
                }
              }
            }}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-[11px] text-neutral-500">
              Enter to send · Shift Enter for a new line
            </div>

            <div
              ref={modelMenuRef}
              className="relative flex items-center gap-2"
            >
              <button
                type="button"
                disabled={currentChat?.loading}
                onClick={onToggleModelMenu}
                className={[
                  "flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-foreground",
                  "disabled:opacity-60",
                  "transition-all duration-200 ease-out",
                  currentChat?.modelMenuOpen
                    ? "bg-neutral-800/90"
                    : "hover:bg-neutral-800/90",
                ].join(" ")}
              >
                <span className="max-w-30 truncate text-neutral-200">
                  {currentChat?.model || "gpt-5-mini"}
                </span>
                <ChevronDown
                  className="h-3 w-3 text-neutral-400"
                  aria-hidden="true"
                />
              </button>

              <Dropdown
                open={!!currentChat?.modelMenuOpen}
                options={MODEL_OPTIONS}
                value={currentChat?.model || "gpt-5-mini"}
                onChange={onModelChange}
                onClose={onToggleModelMenu}
              />

              <button
                type="submit"
                disabled={!canSend}
                className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-neutral-900 transition hover:opacity-90 disabled:opacity-60"
              >
                {currentChat?.loading ? (
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
      </div>
    </div>
  );
}
