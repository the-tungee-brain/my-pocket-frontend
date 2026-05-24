"use client";

import { Menu, Search } from "lucide-react";
import { useRef, useState } from "react";
import { ChatBox } from "@/components/ChatBox";
import { ConversationPane } from "@/components/ConversationPane";
import { DesktopNav } from "@/components/DesktopNav";
import { MobileNav } from "@/components/MobileNav";
import { SchwabConnectCard } from "@/components/SchwabConnectCard";
import { Button } from "@/components/ui/Button";
import { useTabs } from "./contexts/TabContext";
import { usePositionsContext } from "./Providers";

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

  const { activeTab } = useTabs();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [inputRows, setInputRows] = useState(MIN_ROWS);
  const modelMenuRef = useRef<HTMLDivElement | null>(null);

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
    if (currentChat?.loading) return;
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
  const headerLabel =
    selectedView === "portfolio"
      ? "Portfolio"
      : selectedView === "research"
        ? "Research"
        : (selectedSymbol ?? "Position");

  return (
    <main className="flex min-h-screen text-foreground">
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
        <div className="sticky top-0 z-30 border-b border-border bg-secondary/80 backdrop-blur-md">
          <div className="flex min-h-14 items-center justify-between gap-3 px-4">
            <Button
              onClick={() => setMobileNavOpen(true)}
              size="xs"
              variant="ghost"
              aria-label="Open navigation"
              className="text-muted hover:text-foreground md:hidden"
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </Button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-semibold text-foreground">
                  {headerLabel}
                </span>
                {selectedView === "research" && (
                  <Search className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                )}
              </div>
              <div className="truncate text-[11px] text-muted">
                {selectedView === "portfolio"
                  ? `${symbols.length} tracked ${symbols.length === 1 ? "symbol" : "symbols"}`
                  : selectedView === "research"
                    ? "Find a symbol and open its snapshot"
                    : "Position details and assistant context"}
              </div>
            </div>

            <SchwabConnectCard />
          </div>
        </div>

        <div className="flex flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4">
            {children}

            {selectedView !== "research" &&
              activeTab === "assistant" &&
              labelSymbol && (
                <ConversationPane
                  symbol={labelSymbol}
                  messages={currentChat?.messages ?? []}
                  loading={!!currentChat?.loading}
                />
              )}
          </div>

          {selectedView !== "research" &&
            (selectedView === "portfolio" || selectedSymbol) && (
              <div className="sticky bottom-0 z-20 bg-background">
                <ChatBox
                  mode={selectedView}
                  selectedSymbol={selectedSymbol}
                  currentChat={currentChat}
                  inputRows={inputRows}
                  modelMenuRef={modelMenuRef}
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
