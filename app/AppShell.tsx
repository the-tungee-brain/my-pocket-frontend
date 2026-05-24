"use client";

import { ChevronUp, Menu, Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { ChatBox } from "@/components/ChatBox";
import { ConversationPane } from "@/components/ConversationPane";
import { DesktopNav } from "@/components/DesktopNav";
import { MobileNav } from "@/components/MobileNav";
import { HeaderActions } from "@/components/HeaderActions";
import { TopTabBar } from "@/components/TopTabBar";
import { Button } from "@/components/ui/Button";
import { useTabs } from "./contexts/TabContext";
import { useToast } from "./contexts/ToastContext";
import { usePositionsContext } from "./Providers";
import { researchTabLabel } from "@/components/ResearchTabBar";
import { cn } from "@/lib/utils";
import {
  buildSymbolAlertMap,
  mergeDisplayAlerts,
} from "@/lib/intelligence";

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
    positionMap,
    chatBySymbol,
    setChatBySymbol,
    ensureSymbolChatState,
    sendPrompt,
    sendQuickAction,
    hydrateChatFromServer,
    clearChatHistory,
    proactiveAlerts,
    portfolioBrief,
  } = usePositionsContext();

  const symbolAlertMap = useMemo(
    () =>
      buildSymbolAlertMap(
        mergeDisplayAlerts(proactiveAlerts, portfolioBrief),
        portfolioBrief,
      ),
    [proactiveAlerts, portfolioBrief],
  );

  const { showToast } = useToast();

  const { activeTab, setActiveTab } = useTabs();
  const pathname = usePathname();

  const researchMatch = pathname.match(/^\/research\/([^/]+)(?:\/([^/]+))?/);
  const researchSymbol = researchMatch?.[1]?.toUpperCase();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [inputRows, setInputRows] = useState(MIN_ROWS);
  const [mobileChatExpanded, setMobileChatExpanded] = useState(false);

  const activeChatKey =
    selectedView === "portfolio"
      ? "__PORTFOLIO_CHAT__"
      : selectedView === "research" && researchSymbol
        ? `__RESEARCH_${researchSymbol}__`
        : (selectedSymbol ?? "__NONE__");

  const currentChat =
    activeChatKey === "__NONE__" ? undefined : chatBySymbol[activeChatKey];

  useEffect(() => {
    setMobileChatExpanded(false);
  }, [activeChatKey]);

  useEffect(() => {
    if ((currentChat?.messages.length ?? 0) > 0 || currentChat?.loading) {
      setMobileChatExpanded(true);
    }
  }, [currentChat?.loading, currentChat?.messages.length, activeChatKey]);

  const researchPositions =
    researchSymbol && positionMap[researchSymbol]
      ? positionMap[researchSymbol]
      : [];

  const insightsPositions =
    selectedView === "portfolio"
      ? allPositions
      : selectedView === "research"
        ? researchPositions
        : positionsForSelectedSymbol;

  const showChat =
    selectedView === "research"
      ? !!researchSymbol
      : selectedView === "portfolio" || !!selectedSymbol;

  const hasChatPositions =
    selectedView === "research" ? true : !!insightsPositions?.length;

  const chatDisabled =
    selectedView === "research"
      ? false
      : !insightsPositions?.length;

  useEffect(() => {
    if (!showChat || activeChatKey === "__NONE__") return;
    void hydrateChatFromServer(activeChatKey);
  }, [activeChatKey, showChat, hydrateChatFromServer]);

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

  const resolveChatContext = () => {
    if (selectedView === "research" && researchSymbol) {
      return {
        view: "research" as const,
        symbol: researchSymbol,
        positions: researchPositions,
      };
    }
    return {
      view: selectedView,
      symbol: selectedSymbol,
      positions:
        selectedView === "portfolio"
          ? allPositions
          : positionsForSelectedSymbol,
    };
  };

  const handleSendMessage = async () => {
    if (activeChatKey === "__NONE__") return;
    if (currentChat?.loading || chatDisabled) return;
    const input = (currentChat?.input ?? "").trim();
    if (!input) return;

    const ctx = resolveChatContext();

    await sendPrompt({
      activeChatKey,
      selectedView: ctx.view,
      selectedSymbol: ctx.symbol,
      positionsForSelectedSymbol: ctx.positions,
      prompt: input,
    });

    setInputRows(MIN_ROWS);
  };

  const handleFollowUpPrompt = async (prompt: string) => {
    if (activeChatKey === "__NONE__") return;
    if (currentChat?.loading || chatDisabled) return;

    const ctx = resolveChatContext();

    await sendPrompt({
      activeChatKey,
      selectedView: ctx.view,
      selectedSymbol: ctx.symbol,
      positionsForSelectedSymbol: ctx.positions,
      prompt,
    });

    setInputRows(MIN_ROWS);
  };

  const handleQuickAction = async (id: string) => {
    if (activeChatKey === "__NONE__") return;
    if (currentChat?.loading || chatDisabled) return;

    const ctx = resolveChatContext();

    await sendQuickAction({
      activeChatKey,
      selectedView: ctx.view,
      selectedSymbol: ctx.symbol,
      positionsForSelectedSymbol: ctx.positions,
      actionId: id,
    });

    setInputRows(MIN_ROWS);
  };

  const handleClearChat = () => {
    if (activeChatKey === "__NONE__") return;
    if (currentChat?.loading) return;

    void (async () => {
      const cleared = await clearChatHistory(activeChatKey);
      if (!cleared) {
        showToast("Couldn't clear chat history. Try again.");
        return;
      }
      setInputRows(MIN_ROWS);
    })();
  };

  const labelSymbol =
    selectedView === "portfolio"
      ? "PORTFOLIO"
      : selectedView === "research"
        ? researchSymbol
        : selectedSymbol;

  const headerLabel =
    selectedView === "portfolio"
      ? "Portfolio"
      : selectedView === "research" && researchSymbol
        ? researchSymbol
        : selectedView === "research"
          ? "Research"
          : (selectedSymbol ?? "Position");

  const headerSubtitle =
    selectedView === "portfolio"
      ? `${symbols.length} tracked ${symbols.length === 1 ? "symbol" : "symbols"}`
      : selectedView === "research" && researchSymbol
        ? `Stock research · ${researchTabLabel(pathname.split("/")[3])}`
        : selectedView === "research"
          ? "Find a symbol and open its snapshot"
          : "Position details and assistant context";

  const showConversation =
    (selectedView !== "research" && activeTab === "assistant") ||
    selectedView === "research";

  const chatBoxProps = {
    mode: selectedView,
    selectedSymbol:
      selectedView === "research"
        ? researchSymbol ?? null
        : selectedSymbol,
    currentChat,
    disabled: chatDisabled,
    inputRows,
    onChangeInput: handleChatInputChange,
    onSendPrompt: () => void handleSendMessage(),
    onSendQuickAction: (id: string) => void handleQuickAction(id),
    onToggleModelMenu: toggleModelMenu,
    onModelChange: handleModelChange,
  };

  const mobileChatLabel =
    selectedView === "portfolio"
      ? "Ask about your portfolio"
      : selectedView === "research"
        ? `Ask about ${researchSymbol ?? "this symbol"}`
        : `Ask about ${selectedSymbol ?? "this position"}`;

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-secondary focus:px-3 focus:py-2 focus:text-sm focus:shadow-lg"
      >
        Skip to content
      </a>

      <main className="flex min-h-screen text-foreground">
        <DesktopNav
          loading={loading}
          symbols={symbols}
          selectedSymbol={selectedSymbol}
          setSelectedSymbol={setSelectedSymbol}
          selectedView={selectedView}
          setSelectedView={setSelectedView}
          symbolAlertMap={symbolAlertMap}
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
          symbolAlertMap={symbolAlertMap}
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
                  {selectedView === "research" && !researchSymbol && (
                    <Search
                      className="h-3.5 w-3.5 text-muted"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <div className="truncate text-[11px] text-muted">
                  {headerSubtitle}
                </div>
              </div>

              <HeaderActions />
            </div>

            {selectedView !== "research" && (
              <div className="border-t border-border px-4 py-2 md:hidden">
                <TopTabBar
                  activeTab={activeTab}
                  onChange={setActiveTab}
                  showNews={selectedView === "symbol"}
                />
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col">
            <div
              id="main-content"
              className={cn("flex-1 overflow-y-auto px-4 pt-3 pb-2")}
            >
              {children}

              {showConversation && labelSymbol && (
                <ConversationPane
                  symbol={labelSymbol}
                  messages={currentChat?.messages ?? []}
                  loading={!!currentChat?.loading}
                  onClear={handleClearChat}
                  onFollowUpPrompt={(prompt) => void handleFollowUpPrompt(prompt)}
                />
              )}
            </div>

            {showChat && (
              <div className="sticky bottom-0 z-20 md:hidden">
                {!mobileChatExpanded ? (
                  <button
                    type="button"
                    onClick={() => setMobileChatExpanded(true)}
                    className="flex w-full items-center justify-between gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
                      <Sparkles
                        className="h-4 w-4 shrink-0 text-accent-strong"
                        aria-hidden="true"
                      />
                      <span className="truncate">{mobileChatLabel}</span>
                    </span>
                    <ChevronUp className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                  </button>
                ) : (
                  <ChatBox
                    {...chatBoxProps}
                    onCollapse={() => setMobileChatExpanded(false)}
                  />
                )}
              </div>
            )}

            {showChat && (
              <div className="sticky bottom-0 z-20 hidden bg-background md:block">
                <ChatBox {...chatBoxProps} />
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
