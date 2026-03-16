"use client";

import { RefObject } from "react";
import { QuickAnalysisBar } from "@/components/QuickAnalysisBar";
import { Dropdown } from "@/components/Dropdown";
import { ChatMessage } from "@/components/ConversationPane";

type SymbolChatState = {
  loading: boolean;
  input: string;
  messages: ChatMessage[];
  model: string;
  modelMenuOpen: boolean;
};

type MainView = "portfolio" | "symbol";

const MODEL_OPTIONS = [
  { id: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
  { id: "gpt-4.1", label: "GPT-4.1" },
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

  return (
    <div className="sticky bottom-0 z-20 px-4 pb-4 scrollbar-dark bg-background">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 rounded-2xl border border-border bg-secondary/95 p-4 backdrop-blur">
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
            className="w-full resize-none bg-transparent text-base leading-relaxed tracking-wide text-foreground outline-none placeholder:text-neutral-500"
            placeholder={`Ask anything about ${placeholderLabel}…`}
            value={currentChat?.input ?? ""}
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

          <div className="flex items-center justify-between gap-3">
            <div className="flex-1" />

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
                <span className="max-w-[120px] truncate text-neutral-200">
                  {MODEL_OPTIONS.find(
                    (m) => m.id === (currentChat?.model || "gpt-4.1-mini"),
                  )?.label ?? "GPT-4.1 Mini"}
                </span>
                <span className="text-[10px] text-neutral-400">▾</span>
              </button>

              <Dropdown
                open={!!currentChat?.modelMenuOpen}
                options={MODEL_OPTIONS}
                value={currentChat?.model || "gpt-4.1-mini"}
                onChange={onModelChange}
                onClose={onToggleModelMenu}
              />

              <button
                type="submit"
                disabled={
                  currentChat?.loading || !(currentChat?.input ?? "").trim()
                }
                className="ml-1 rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-neutral-900 disabled:opacity-60"
              >
                {currentChat?.loading ? "Analyzing…" : "Send"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
