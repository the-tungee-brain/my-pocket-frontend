"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronUp, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { TomcrestLogo } from "@/components/brand/TomcrestLogo";
import { ChatBox } from "@/components/ChatBox";
import { ChatSessionHistory } from "@/components/ChatSessionHistory";
import { ConversationPane } from "@/components/ConversationPane";
import { HeaderActions } from "@/components/HeaderActions";
import { HeaderSymbolSearch } from "@/components/HeaderSymbolSearch";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { researchTabLabel } from "@/components/ResearchTabBar";
import { appCanvasClass, appChromeClass } from "@/lib/appUi";
import { resolveActiveChatKey } from "@/lib/chatKeys";
import type { QuickActionMode } from "@/lib/quickActions";
import { OPEN_CHAT_EVENT } from "@/lib/scrollToChat";
import { parseResearchRoute } from "@/lib/symbolRoutes";
import { cn } from "@/lib/utils";
import { useAppChatContext, usePortfolioContext } from "./contextSelectors";
import { useToast } from "./contexts/ToastContext";

const MIN_ROWS = 1;
const MAX_ROWS = 24;

const topNavItems = [
  {
    href: "/portfolio",
    label: "Portfolio",
    isActive: (pathname: string) => pathname.startsWith("/portfolio"),
    view: "portfolio" as const,
  },
  {
    href: "/watchlist",
    label: "Watchlist",
    isActive: (pathname: string) => pathname === "/watchlist",
    view: "research" as const,
  },
  {
    href: "/research",
    label: "Research",
    isActive: (pathname: string) =>
      pathname.startsWith("/research") && pathname !== "/watchlist",
    view: "research" as const,
  },
  {
    href: "/top-movers",
    label: "Top Movers",
    isActive: (pathname: string) => pathname.startsWith("/top-movers"),
    view: "research" as const,
  },
  {
    href: "/emerging-leaders",
    label: "Emerging Leaders",
    isActive: (pathname: string) => pathname.startsWith("/emerging-leaders"),
    view: "research" as const,
  },
  {
    href: "/settings",
    label: "Settings",
    isActive: (pathname: string) => pathname.startsWith("/settings"),
    view: "research" as const,
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    selectedSymbol,
    setSelectedSymbol,
    selectedView,
    setSelectedView,
    positionsForSelectedSymbol,
    allPositions,
    positionMap,
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

  const [inputRows, setInputRows] = useState(MIN_ROWS);
  const [mobileChatExpanded, setMobileChatExpanded] = useState(false);
  const [portfolioAssistantOpen, setPortfolioAssistantOpen] = useState(false);

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

  const isPortfolioPage = pathname === "/portfolio";

  useEffect(() => {
    const openChat = () => {
      if (isPortfolioPage) {
        setPortfolioAssistantOpen(true);
        return;
      }
      setMobileChatExpanded(true);
    };
    window.addEventListener(OPEN_CHAT_EVENT, openChat);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, openChat);
  }, [isPortfolioPage]);

  useEffect(() => {
    if (!isPortfolioPage) {
      setPortfolioAssistantOpen(false);
    }
  }, [isPortfolioPage]);

  useEffect(() => {
    if (!portfolioAssistantOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPortfolioAssistantOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [portfolioAssistantOpen]);

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

  const showEmbeddedConversation = showConversation && !isPortfolioPage;
  const showEmbeddedChatBox = showChat && !isPortfolioPage;
  const showPortfolioFloatingAssistant = showChat && isPortfolioPage;

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
        <section className="flex min-h-screen min-w-0 flex-1 flex-col">
          <div className={cn("sticky top-0 z-30 border-b", appChromeClass)}>
            <div className="flex flex-col gap-4 px-5 py-4 md:px-8 xl:px-10">
              <div className="flex min-w-0 items-center gap-5">
                <Link
                  href="/portfolio"
                  onClick={() => {
                    setSelectedView("portfolio");
                    setSelectedSymbol(null);
                  }}
                  className="shrink-0"
                  aria-label="Tomcrest portfolio"
                >
                  <TomcrestLogo size="sm" />
                </Link>

                <nav
                  aria-label="Primary"
                  className="hidden min-w-0 flex-1 items-center gap-6 overflow-x-auto text-sm font-medium md:flex"
                >
                  {topNavItems.map((item) => {
                    const active = item.isActive(pathname);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        onClick={() => {
                          setSelectedView(item.view);
                          setSelectedSymbol(null);
                        }}
                        className={cn(
                          "whitespace-nowrap border-b py-1.5 transition-colors",
                          active
                            ? "border-foreground text-foreground"
                            : "border-transparent text-muted hover:text-foreground",
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>

                <HeaderSymbolSearch
                  accessToken={sessionAccessToken}
                  className="hidden w-full max-w-sm md:block"
                />
                <HeaderActions />
              </div>

              <div className="flex flex-col gap-3 md:hidden">
                <HeaderSymbolSearch
                  accessToken={sessionAccessToken}
                  className="w-full"
                />
                <nav
                  aria-label="Primary"
                  className="-mx-1 flex min-w-0 gap-4 overflow-x-auto px-1 text-sm font-medium"
                >
                  {topNavItems.map((item) => {
                    const active = item.isActive(pathname);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        onClick={() => {
                          setSelectedView(item.view);
                          setSelectedSymbol(null);
                        }}
                        className={cn(
                          "shrink-0 border-b py-1.5 transition-colors",
                          active
                            ? "border-foreground text-foreground"
                            : "border-transparent text-muted",
                        )}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>
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
                "relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-5 pt-8 pb-8 md:px-10 xl:px-14",
                "max-md:pb-[calc(5rem+env(safe-area-inset-bottom,0px))]",
              )}
            >
              {children}

              {showEmbeddedConversation && labelSymbol && (
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

            {showEmbeddedChatBox && (
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
                      className="flex w-full items-center justify-between gap-3 border-t border-border bg-background px-4 py-3"
                    >
                      <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
                        <Sparkles
                          className="h-4 w-4 shrink-0 text-foreground"
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

            {showEmbeddedChatBox && (
              <div className="sticky bottom-0 z-20 hidden shrink-0 md:block">
                <ChatBox {...chatBoxProps} />
              </div>
            )}
          </div>
        </section>
      </main>
      {showPortfolioFloatingAssistant && (
        <>
          <button
            type="button"
            aria-label="Open portfolio AI assistant"
            onClick={() => setPortfolioAssistantOpen(true)}
            className={cn(
              "fixed right-5 z-40 border border-border bg-foreground px-4 py-2 text-sm font-medium text-background shadow-lg shadow-black/20 transition hover:opacity-90",
              "bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:bottom-6 md:right-6",
              portfolioAssistantOpen && "hidden",
            )}
          >
            Ask AI
          </button>

          {portfolioAssistantOpen && labelSymbol && (
            <div
              className="fixed inset-0 z-50 bg-background/35 backdrop-blur-sm"
              aria-hidden="true"
              onClick={() => setPortfolioAssistantOpen(false)}
            />
          )}

          {portfolioAssistantOpen && labelSymbol && (
            <section
              id="assistant-chat"
              aria-label="Portfolio AI assistant"
              className="fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] top-20 z-50 flex flex-col border border-border bg-background shadow-2xl shadow-black/30 md:inset-auto md:bottom-6 md:right-6 md:top-24 md:h-[min(44rem,calc(100vh-8rem))] md:w-[30rem]"
            >
              <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                    Portfolio assistant
                  </p>
                  <p className="text-sm text-muted">
                    Ask about risk, concentration, taxes, and what changed.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close portfolio AI assistant"
                  onClick={() => setPortfolioAssistantOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center border border-border text-muted transition hover:text-foreground"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-4">
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
                          restoreChatSession(activeChatKey, sessionId, messages)
                        }
                      />
                    ) : null
                  }
                />
              </div>

              <ChatBox
                {...chatBoxProps}
                onCollapse={() => setPortfolioAssistantOpen(false)}
              />
            </section>
          )}
        </>
      )}
      <MobileBottomNav />
    </>
  );
}
