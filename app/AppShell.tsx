"use client";

import { useState } from "react";
import { DesktopNav } from "@/components/DesktopNav";
import { MobileNav } from "@/components/MobileNav";
import { SchwabConnectCard } from "@/components/SchwabConnectCard";
import { usePositionsContext } from "./Providers";
import { ChatBox } from "@/components/ChatBox";
import { ConversationPane } from "@/components/ConversationPane";

const MIN_ROWS = 1;
const MAX_ROWS = 24;

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    loading,
    symbols,
    selectedSymbol,
    setSelectedSymbol,
    selectedView,
    setSelectedView,
    positionsForSelectedSymbol,
    allPositions,
    chatBySymbol,
    setChatBySymbol,
    ensureSymbolChatState,
    sendPrompt,
    sendQuickAction,
  } = usePositionsContext();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [inputRows, setInputRows] = useState(MIN_ROWS);
  const modelMenuRef = useState<HTMLDivElement | null>(null)[0];

  const activeChatKey =
    selectedView === "portfolio"
      ? "__PORTFOLIO_CHAT__"
      : (selectedSymbol ?? "__NONE__");

  const currentChat =
    activeChatKey === "__NONE__" ? undefined : chatBySymbol[activeChatKey];

  const handleChatInputChange = (value: string) => {
    if (activeChatKey === "__NONE__") return;

    setChatBySymbol((prev) => ({
      ...prev,
      [activeChatKey]: {
        ...ensureSymbolChatState(activeChatKey, prev[activeChatKey]),
        input: value,
      },
    }));

    const lines = value.split("\n").length;
    const nextRows = Math.min(MAX_ROWS, Math.max(MIN_ROWS, lines));
    setInputRows(nextRows);
  };

  const handleModelChange = (model: string) => {
    if (activeChatKey === "__NONE__") return;
    setChatBySymbol((prev) => {
      const prevState = ensureSymbolChatState(
        activeChatKey,
        prev[activeChatKey],
      );
      return {
        ...prev,
        [activeChatKey]: {
          ...prevState,
          model,
        },
      };
    });
  };

  const toggleModelMenu = () => {
    if (activeChatKey === "__NONE__") return;
    setChatBySymbol((prev) => {
      const prevState = ensureSymbolChatState(
        activeChatKey,
        prev[activeChatKey],
      );
      return {
        ...prev,
        [activeChatKey]: {
          ...prevState,
          modelMenuOpen: !prevState.modelMenuOpen,
        },
      };
    });
  };

  const handleSendMessage = async () => {
    if (activeChatKey === "__NONE__") return;
    const input = (currentChat?.input ?? "").trim();
    if (!input) return;

    await sendPrompt({
      activeChatKey,
      selectedView,
      selectedSymbol,
      positionsForSelectedSymbol:
        selectedView === "portfolio"
          ? allPositions
          : positionsForSelectedSymbol,
      prompt: input,
    });

    setInputRows(MIN_ROWS);
  };

  const handleQuickAction = async (id: string) => {
    if (activeChatKey === "__NONE__") return;

    await sendQuickAction({
      activeChatKey,
      selectedView,
      selectedSymbol,
      positionsForSelectedSymbol:
        selectedView === "portfolio"
          ? allPositions
          : positionsForSelectedSymbol,
      actionId: id,
    });

    setInputRows(MIN_ROWS);
  };

  const labelSymbol =
    selectedView === "portfolio" ? "PORTFOLIO" : selectedSymbol;

  return (
    <main className="flex min-h-screen text-neutral-50">
      <DesktopNav
        loading={loading}
        symbols={symbols}
        selectedSymbol={selectedSymbol}
        setSelectedSymbol={setSelectedSymbol}
        selectedView={selectedView}
        setSelectedView={setSelectedView}
      />

      <MobileNav
        mobileNavOpen={mobileNavOpen}
        setMobileNavOpen={setMobileNavOpen}
        loading={loading}
        symbols={symbols}
        selectedSymbol={selectedSymbol}
        setSelectedSymbol={setSelectedSymbol}
        selectedView={selectedView}
        setSelectedView={setSelectedView}
      />

      <section className="flex min-h-screen flex-1 flex-col">
        <div className="sticky top-0 z-30 border-b border-border bg-secondary">
          <div className="flex items-center justify-between px-4 py-3 md:hidden space-x-4">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="rounded-md border border-border px-2 py-1 text-xs"
            >
              Menu
            </button>
            <SchwabConnectCard />
          </div>

          <div className="hidden px-4 py-3 md:block">
            <SchwabConnectCard />
          </div>
        </div>

        <div className="flex flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4">
            {children}

            {labelSymbol && (
              <ConversationPane
                symbol={labelSymbol}
                messages={currentChat?.messages ?? []}
                loading={!!currentChat?.loading}
              />
            )}
          </div>

          {(selectedView === "portfolio" || selectedSymbol) && (
            <div className="sticky bottom-0 z-20 bg-background">
              <ChatBox
                mode={selectedView}
                selectedSymbol={selectedSymbol}
                currentChat={currentChat}
                inputRows={inputRows}
                modelMenuRef={modelMenuRef as any}
                onChangeInput={handleChatInputChange}
                onSendPrompt={() => void handleSendMessage()}
                onSendQuickAction={(id) => void handleQuickAction(id)}
                onToggleModelMenu={toggleModelMenu}
                onModelChange={handleModelChange}
              />
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
