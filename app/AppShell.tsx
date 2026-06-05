"use client";

import { ChevronUp, Menu, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { ChatSessionHistory } from "@/components/ChatSessionHistory";
import { ChatBox } from "@/components/ChatBox";
import { ConversationPane } from "@/components/ConversationPane";
import { DesktopNav } from "@/components/DesktopNav";
import { MobileNav } from "@/components/MobileNav";
import { HeaderActions } from "@/components/HeaderActions";
import { HeaderSymbolSearch } from "@/components/HeaderSymbolSearch";
import { IconButton } from "@/components/ui/IconButton";
import { useToast } from "./contexts/ToastContext";
import { useAppChatContext, usePortfolioContext } from "./contextSelectors";
import { researchTabLabel } from "@/components/ResearchTabBar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { appCanvasClass, appChromeClass } from "@/lib/appUi";
import { cn } from "@/lib/utils";
import { resolveActiveChatKey } from "@/lib/chatKeys";
import type { QuickActionMode } from "@/lib/quickActions";
import { OPEN_CHAT_EVENT } from "@/lib/scrollToChat";
import { parseResearchRoute } from "@/lib/symbolRoutes";
import { buildSymbolAlertMap, mergeDisplayAlerts } from "@/lib/intelligence";

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
    proactiveAlerts,
    portfolioBrief,
    sessionAccessToken,
  } = usePortfolioContext();

  const {
    chatBySymbol,
    setChatBySymbol,
    ensureSymbolChatState,
    setChatModel,
    setChatModelMenuOpen,
    sendPrompt,
    sendQuickAction,
    hydrateChatFromServer,
    clearChatHistory,
    restoreChatSession,
    startNewChatSession,
  } = useAppChatContext();

  const symbolAlertMap = useMemo(
    () =>
      buildSymbolAlertMap(
        mergeDisplayAlerts(proactiveAlerts, portfolioBrief),
        portfolioBrief,
      ),
    [proactiveAlerts, portfolioBrief],
  );

  const { showToast } = useToast();

  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isMomentumBreakoutAlertsRoute = pathname.startsWith(
    "/research/momentum-breakout-alerts",
  );
  const researchMatch = isMomentumBreakoutAlertsRoute
    ? null
    : pathname.match(/^\/research\/([^/]+)(?:\/([^/]+))?/);
  const researchSymbol = researchMatch?.[1]?.toUpperCase();
  const { symbol: routeSymbol } = parseResearchRoute(pathname);

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [inputRows, setInputRows] = useState(MIN_ROWS);
  const [mobileChatExpanded, setMobileChatExpanded] = useState(false);

  const activeChatKey = resolveActiveChatKey({
    selectedView,
    selectedSymbol,
    routeSymbol,
  });

  const currentChat =
    activeChatKey === "__NONE__" ? undefined : chatBySymbol[activeChatKey];

  // Mobile chat stays collapsed until the user expands it or OPEN_CHAT_EVENT fires
  // (e.g. Ask AI, playbook, scrollToChat).
  useEffect(() => {
    if (activeChatKey === "__NONE__") {
      setMobileChatExpanded(false);
      return;
    }
    setMobileChatExpanded(false);
  }, [activeChatKey]);

  useEffect(() => {
    const openChat = () => {
      setMobileChatExpanded(true);
    };
    window.addEventListener(OPEN_CHAT_EVENT, openChat);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, openChat);
  }, []);

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

  const chatDisabled =
    selectedView === "research" ? false : !insightsPositions?.length;

  useEffect(() => {
    if (!showChat || activeChatKey === "__NONE__") return;
    void hydrateChatFromServer(activeChatKey, selectedView);
  }, [activeChatKey, showChat, selectedView, hydrateChatFromServer]);

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

  const handleModelChange = useCallback(
    (model: string) => {
      if (activeChatKey === "__NONE__") return;
      setChatModel(activeChatKey, model);
    },
    [activeChatKey, setChatModel],
  );

  const openModelMenu = useCallback(() => {
    if (activeChatKey === "__NONE__") return;
    setChatModelMenuOpen(activeChatKey, true);
  }, [activeChatKey, setChatModelMenuOpen]);

  const closeModelMenu = useCallback(() => {
    if (activeChatKey === "__NONE__") return;
    setChatModelMenuOpen(activeChatKey, false);
  }, [activeChatKey, setChatModelMenuOpen]);

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

  const handleStartNewChat = () => {
    if (activeChatKey === "__NONE__") return;
    if (currentChat?.loading) return;
    startNewChatSession(activeChatKey);
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
      : selectedView === "research" && isMomentumBreakoutAlertsRoute
        ? "MB TRADE PLANS"
        : selectedView === "research"
          ? researchSymbol
          : selectedSymbol;

  const headerLabel =
    selectedView === "portfolio"
      ? "Portfolio"
      : selectedView === "research" && isMomentumBreakoutAlertsRoute
        ? "MB trade plans"
        : selectedView === "research" && researchSymbol
          ? researchSymbol
          : selectedView === "research"
            ? "Research"
            : (selectedSymbol ?? "Position");

  const headerSubtitle =
    selectedView === "portfolio"
      ? `${symbols.length} tracked ${symbols.length === 1 ? "symbol" : "symbols"}`
      : selectedView === "research" && isMomentumBreakoutAlertsRoute
        ? "Active alerts & history"
        : selectedView === "research" && researchSymbol
          ? `Stock research · ${researchTabLabel(pathname.split("/")[3])}`
          : selectedView === "research"
            ? "Search ticker or company name"
            : "Position details and assistant context";

  const showConversation =
    selectedView === "portfolio" ||
    (selectedView === "research" && !!routeSymbol);

  const researchTab = pathname.split("/")[3];
  const isPositionTab =
    selectedView === "research" &&
    researchTab === "position" &&
    !!researchSymbol &&
    (positionMap[researchSymbol]?.length ?? 0) > 0;
  const isOptionsTab =
    selectedView === "research" &&
    researchTab === "options" &&
    !!researchSymbol;

  const quickActionMode: QuickActionMode = isOptionsTab
    ? "options"
    : isPositionTab
      ? "position"
      : selectedView;

  const portfolioSection = searchParams.get("section");
  const chatContextLabel =
    selectedView === "portfolio"
      ? `Portfolio · ${
          portfolioSection === "holdings"
            ? "Holdings"
            : portfolioSection === "activity"
              ? "Activity"
              : "Today"
        }`
      : selectedView === "research" && researchSymbol
        ? `${researchSymbol} · ${researchTabLabel(pathname.split("/")[3])}`
        : selectedSymbol
          ? `${selectedSymbol} · Position`
          : undefined;

  const chatBoxProps = {
    mode: selectedView,
    quickActionMode,
    selectedSymbol:
      selectedView === "research" ? (researchSymbol ?? null) : selectedSymbol,
    currentChat,
    disabled: chatDisabled,
    inputRows,
    onChangeInput: handleChatInputChange,
    onSendPrompt: () => void handleSendMessage(),
    onSendQuickAction: (id: string) => void handleQuickAction(id),
    onOpenModelMenu: openModelMenu,
    onCloseModelMenu: closeModelMenu,
    onModelChange: handleModelChange,
    contextLabel: chatContextLabel,
  };

  const mobileChatLabel =
    selectedView === "portfolio"
      ? "Ask about your portfolio"
      : isPositionTab
        ? `Analyze ${researchSymbol} position`
        : selectedView === "research" && isMomentumBreakoutAlertsRoute
          ? "Ask about MB trade plans"
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

      <main className="flex min-h-screen min-w-0 text-foreground">
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

        <section className="flex min-h-screen min-w-0 flex-1 flex-col">
          <div className={cn("sticky top-0 z-30 border-b", appChromeClass)}>
            {/* Mobile: title + actions, then full-width search */}
            <div className="flex flex-col gap-2.5 px-4 py-2.5 md:hidden">
              <div className="flex items-center gap-3">
                <IconButton
                  onClick={() => setMobileNavOpen(true)}
                  size="sm"
                  aria-label="Open navigation"
                  className="shrink-0"
                >
                  <Menu className="h-4 w-4" aria-hidden="true" />
                </IconButton>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-mono text-xs font-semibold uppercase tracking-wide text-foreground">
                    {headerLabel}
                  </div>
                  <div className="truncate font-mono text-[10px] uppercase tracking-wider text-muted">
                    {headerSubtitle}
                  </div>
                </div>
                <HeaderActions />
              </div>
              <HeaderSymbolSearch
                accessToken={sessionAccessToken}
                className="w-full"
              />
            </div>

            {/* Desktop: equal side columns so search sits in the header center */}
            <div className="hidden min-h-14 grid-cols-[1fr_minmax(14rem,24rem)_1fr] items-center gap-x-4 px-4 md:grid">
              <div className="min-w-0 justify-self-start">
                <div className="truncate font-mono text-xs font-semibold uppercase tracking-wide text-foreground">
                  {headerLabel}
                </div>
                <div className="truncate font-mono text-[10px] uppercase tracking-wider text-muted">
                  {headerSubtitle}
                </div>
              </div>

              <HeaderSymbolSearch
                accessToken={sessionAccessToken}
                className="w-full max-w-md justify-self-center"
              />

              <HeaderActions className="justify-self-end" />
            </div>
          </div>

          <div
            className={cn(
              appCanvasClass,
              "flex min-h-0 min-w-0 flex-1 flex-col",
            )}
          >
            <div
              id="main-content"
              className={cn(
                "relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-5 pt-4 pb-4 sm:px-8",
                "max-md:pb-[calc(5rem+env(safe-area-inset-bottom,0px))]",
              )}
            >
              {children}

              {showConversation && labelSymbol && (
                <div id="assistant-chat">
                  <ConversationPane
                    symbol={labelSymbol}
                    messages={currentChat?.messages ?? []}
                    loading={!!currentChat?.loading}
                    onClear={handleClearChat}
                    onFollowUpPrompt={(prompt) =>
                      void handleFollowUpPrompt(prompt)
                    }
                    historyControl={
                      activeChatKey !== "__NONE__" ? (
                        <ChatSessionHistory
                          activeChatKey={activeChatKey}
                          accessToken={sessionAccessToken}
                          currentSessionId={currentChat?.sessionId}
                          historyRevision={currentChat?.historyRevision ?? 0}
                          showNewChat={
                            (currentChat?.messages.length ?? 0) > 0 &&
                            !currentChat?.loading
                          }
                          onStartNewSession={handleStartNewChat}
                          onRestoreSession={(sessionId, messages) =>
                            restoreChatSession(
                              activeChatKey,
                              sessionId,
                              messages,
                            )
                          }
                        />
                      ) : null
                    }
                  />
                </div>
              )}
            </div>

            {showChat && (
              <div className="safe-area-bottom sticky bottom-14 z-20 shrink-0 md:hidden md:bottom-0">
                <AnimatePresence mode="wait" initial={false}>
                  {!mobileChatExpanded ? (
                    <motion.button
                      key="collapsed"
                      type="button"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.15 }}
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
                      <ChevronUp
                        className="h-4 w-4 shrink-0 text-muted"
                        aria-hidden="true"
                      />
                    </motion.button>
                  ) : (
                    <motion.div
                      key="expanded"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      transition={{ duration: 0.18 }}
                    >
                      <ChatBox
                        {...chatBoxProps}
                        onCollapse={() => setMobileChatExpanded(false)}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {showChat && (
              <div className="sticky bottom-0 z-20 hidden shrink-0 md:block">
                <ChatBox {...chatBoxProps} />
              </div>
            )}
          </div>
        </section>
      </main>
      <MobileBottomNav />
    </>
  );
}
