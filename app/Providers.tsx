"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { apiFetch, fetchAccountPositions, streamAnalysis, streamResearchChat } from "@/lib/apiClient";
import type { PositionMap } from "@/components/AccountPositionList";
import type { ChatMessage } from "@/components/ConversationPane";
import { DEFAULT_CHAT_MODEL } from "@/lib/chatModels";
import {
  loadPersistedChat,
  persistChatState,
} from "@/lib/chatPersistence";
import { formatQuickActionMessage, getQuickActionApiAction, isFreeFormQuickAction } from "@/lib/quickActions";
import {
  Position,
  SchwabAccounts,
  CashSecuredPutSummary,
  AssignmentRiskSummary,
  RecentActivitySummary,
} from "./types/schwab";
import type { ProactiveAlert, PortfolioIntelligence } from "./types/intelligence";
import { summarizeCspCashReserves } from "@/lib/cspReservedCash";
import {
  loadChatHistoryForKey,
  shouldApplyServerHistory,
  clearChatHistoryForKey,
} from "@/lib/chatHistory";
import { MainView } from "@/components/NavList";
import { usePathname } from "next/navigation";

type SymbolChatState = {
  loading: boolean;
  input: string;
  messages: ChatMessage[];
  model: string;
  modelMenuOpen: boolean;
  sessionId?: string | null;
  historyHydrated?: boolean;
};

type ChatStateMap = Record<string, SymbolChatState>;

type PositionsContextValue = {
  sessionAccessToken: string;
  loading: boolean;
  error: string | null;
  positionMap: PositionMap;
  symbols: string[];
  allPositions: Position[];
  selectedSymbol: string | null;
  setSelectedSymbol: (s: string | null) => void;
  selectedView: MainView;
  setSelectedView: (v: MainView) => void;
  positionsForSelectedSymbol: Position[] | null;
  chatBySymbol: ChatStateMap;
  setChatBySymbol: React.Dispatch<React.SetStateAction<ChatStateMap>>;
  ensureSymbolChatState: (
    key: string,
    base?: Partial<SymbolChatState>,
  ) => SymbolChatState;
  sendPrompt: (opts: {
    activeChatKey: string;
    selectedView: MainView;
    selectedSymbol: string | null;
    positionsForSelectedSymbol: Position[] | null;
    prompt: string;
  }) => Promise<void>;
  sendQuickAction: (opts: {
    activeChatKey: string;
    selectedView: MainView;
    selectedSymbol: string | null;
    positionsForSelectedSymbol: Position[] | null;
    actionId: string;
  }) => Promise<void>;
  hydrateChatFromServer: (activeChatKey: string) => Promise<void>;
  clearChatHistory: (activeChatKey: string) => Promise<boolean>;
  account: SchwabAccounts | null;
  cashSecuredPutSummary: CashSecuredPutSummary | null;
  assignmentRiskSummary: AssignmentRiskSummary | null;
  recentActivity: RecentActivitySummary | null;
  proactiveAlerts: ProactiveAlert[];
  portfolioBrief: PortfolioIntelligence | null;
  refreshPositions: (refresh?: boolean) => Promise<void>;
};

const PositionsContext = createContext<PositionsContextValue | null>(null);

const PERSIST_DEBOUNCE_MS = 500;

type SetChatBySymbol = React.Dispatch<React.SetStateAction<ChatStateMap>>;

function createStreamingAssistantUpdater(
  activeChatKey: string,
  setChatBySymbol: SetChatBySymbol,
  ensureSymbolChatState: (
    key: string,
    base?: Partial<SymbolChatState>,
  ) => SymbolChatState,
  idSuffix = "",
) {
  const assistantContent = { current: "" };
  const assistantId = `assistant-${activeChatKey}${idSuffix ? `-${idSuffix}` : ""}-${Date.now()}`;
  let rafId: number | null = null;

  const flush = () => {
    rafId = null;
    const content = assistantContent.current;

    setChatBySymbol((prev) => {
      const prevState = ensureSymbolChatState(activeChatKey, prev[activeChatKey]);
      const messages = [...prevState.messages];
      const last = messages[messages.length - 1];

      if (last?.role === "assistant" && last.id === assistantId) {
        messages[messages.length - 1] = { ...last, content };
      } else {
        messages.push({
          id: assistantId,
          role: "assistant",
          content,
        });
      }

      return {
        ...prev,
        [activeChatKey]: {
          ...prevState,
          messages,
          loading: true,
        },
      };
    });
  };

  const appendChunk = (chunk: string) => {
    assistantContent.current += chunk;
    if (rafId == null) {
      rafId = requestAnimationFrame(flush);
    }
  };

  const flushNow = () => {
    if (rafId != null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (assistantContent.current) {
      flush();
    }
  };

  return { appendChunk, flushNow, assistantContent };
}

export function usePositionsContext() {
  const ctx = useContext(PositionsContext);
  if (!ctx)
    throw new Error(
      "usePositionsContext must be used within PositionsProvider",
    );
  return ctx;
}

export function PositionsProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [positionMap, setPositionMap] = useState<PositionMap>({});
  const [account, setAccount] = useState<SchwabAccounts | null>(null);
  const [cashSecuredPutSummary, setCashSecuredPutSummary] =
    useState<CashSecuredPutSummary | null>(null);
  const [assignmentRiskSummary, setAssignmentRiskSummary] =
    useState<AssignmentRiskSummary | null>(null);
  const [recentActivity, setRecentActivity] =
    useState<RecentActivitySummary | null>(null);
  const [proactiveAlerts, setProactiveAlerts] = useState<ProactiveAlert[]>([]);
  const [portfolioBrief, setPortfolioBrief] =
    useState<PortfolioIntelligence | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<MainView>("research");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatBySymbol, setChatBySymbol] = useState<ChatStateMap>({});
  const chatHydratedRef = useRef(false);
  const chatBySymbolRef = useRef(chatBySymbol);
  const persistTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serverHydrateInflightRef = useRef<Set<string>>(new Set());
  chatBySymbolRef.current = chatBySymbol;
  const accessToken = session?.accessToken ?? "";
  const chatUserId = session?.user?.email ?? session?.user?.id ?? null;
  const initialRefreshRef = useRef<boolean | null>(null);
  if (initialRefreshRef.current === null && typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    initialRefreshRef.current =
      params.get("refresh") === "1" ||
      params.get("status") === "success" ||
      params.get("schwab") === "connected";
  }

  const applyPositionsPayload = useCallback(
    (data: Awaited<ReturnType<typeof fetchAccountPositions>>) => {
      const map = data.schwab_positions ?? {};
      const loadedAccount = data.account ?? null;
      const flatPositions = Object.values(map).flat().filter(Boolean) as Position[];
      const cashBalance =
        loadedAccount?.securitiesAccount.currentBalances.cashBalance ?? null;

      setPositionMap(map);
      setAccount(loadedAccount);
      setCashSecuredPutSummary(
        data.cashSecuredPutSummary ??
          summarizeCspCashReserves(flatPositions, cashBalance),
      );
      setAssignmentRiskSummary(data.assignmentRiskSummary ?? null);
      setRecentActivity(data.recentActivity ?? null);
      setProactiveAlerts(data.proactiveAlerts ?? []);
      setPortfolioBrief(data.portfolioBrief ?? null);

      const symbolsOnly = Object.keys(map).sort();
      setSelectedSymbol((current) =>
        current && symbolsOnly.includes(current)
          ? current
          : (symbolsOnly[0] ?? null),
      );
    },
    [],
  );

  const refreshPositions = useCallback(
    async (refresh = false) => {
      if (!accessToken) return;

      try {
        setLoading(true);
        setError(null);
        const data = await fetchAccountPositions(accessToken, { refresh });
        applyPositionsPayload(data);
      } catch {
        setError("Failed to load positions");
        setPositionMap({});
        setAccount(null);
        setCashSecuredPutSummary(null);
        setAssignmentRiskSummary(null);
        setRecentActivity(null);
        setProactiveAlerts([]);
        setPortfolioBrief(null);
        setSelectedSymbol(null);
      } finally {
        setLoading(false);
      }
    },
    [accessToken, applyPositionsPayload],
  );

  const ensureSymbolChatState = useCallback(
    (key: string, base?: Partial<SymbolChatState>): SymbolChatState => ({
      loading: false,
      input: "",
      messages: [],
      model: DEFAULT_CHAT_MODEL,
      modelMenuOpen: false,
      ...base,
    }),
    [],
  );

  useEffect(() => {
    if (!chatUserId) {
      chatHydratedRef.current = false;
      return;
    }

    chatHydratedRef.current = false;

    const loaded = loadPersistedChat(chatUserId);
    if (Object.keys(loaded).length === 0) {
      chatHydratedRef.current = true;
      return;
    }

    setChatBySymbol((prev) => {
      const merged = { ...prev };
      for (const [key, saved] of Object.entries(loaded)) {
        merged[key] = ensureSymbolChatState(key, saved);
      }
      return merged;
    });
    chatHydratedRef.current = true;
  }, [chatUserId, ensureSymbolChatState]);

  useEffect(() => {
    if (!chatUserId || !chatHydratedRef.current) return;

    if (persistTimeoutRef.current) {
      clearTimeout(persistTimeoutRef.current);
    }

    persistTimeoutRef.current = setTimeout(() => {
      persistChatState(chatUserId, chatBySymbolRef.current);
      persistTimeoutRef.current = null;
    }, PERSIST_DEBOUNCE_MS);

    return () => {
      if (persistTimeoutRef.current) {
        clearTimeout(persistTimeoutRef.current);
        persistTimeoutRef.current = null;
      }
    };
  }, [chatBySymbol, chatUserId]);

  useEffect(() => {
    if (!chatUserId) return;

    const flushPersist = () => {
      if (!chatHydratedRef.current) return;
      persistChatState(chatUserId, chatBySymbolRef.current);
    };

    window.addEventListener("beforeunload", flushPersist);
    return () => {
      window.removeEventListener("beforeunload", flushPersist);
      flushPersist();
    };
  }, [chatUserId]);

  useEffect(() => {
    if (!pathname) return;

    const segments = pathname.split("/").filter(Boolean);
    const first = segments[0];

    if (first === "research") {
      setSelectedView("research");
    } else if (first === "portfolio") {
      setSelectedView(segments[1] === "positions" ? "symbol" : "portfolio");
    } else {
      setSelectedView("research");
    }
  }, [pathname]);

  useEffect(() => {
    if (!accessToken) return;

    const shouldRefresh = initialRefreshRef.current ?? false;
    initialRefreshRef.current = false;

    if (shouldRefresh && typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("refresh");
      url.searchParams.delete("status");
      url.searchParams.delete("schwab");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }

    void refreshPositions(shouldRefresh);
  }, [accessToken, refreshPositions]);

  const allPositions: Position[] = useMemo(
    () => Object.values(positionMap).flat().filter(Boolean) as Position[],
    [positionMap],
  );

  const symbols = useMemo(() => Object.keys(positionMap).sort(), [positionMap]);

  const positionsForSelectedSymbol: Position[] | null = useMemo(() => {
    if (selectedView === "portfolio") return allPositions;
    if (!selectedSymbol) return null;
    return positionMap[selectedSymbol] ?? null;
  }, [selectedView, selectedSymbol, positionMap, allPositions]);

  const hydrateChatFromServer = useCallback(
    async (activeChatKey: string) => {
      if (!accessToken || activeChatKey === "__NONE__") return;
      if (serverHydrateInflightRef.current.has(activeChatKey)) return;

      const currentState =
        chatBySymbolRef.current[activeChatKey] ??
        ensureSymbolChatState(activeChatKey);
      if (currentState.loading) return;

      serverHydrateInflightRef.current.add(activeChatKey);
      try {
        const loaded = await loadChatHistoryForKey(accessToken, activeChatKey);
        if (!loaded) {
          setChatBySymbol((prev) => ({
            ...prev,
            [activeChatKey]: {
              ...ensureSymbolChatState(activeChatKey, prev[activeChatKey]),
              historyHydrated: true,
            },
          }));
          return;
        }

        setChatBySymbol((prev) => {
          const prevState = ensureSymbolChatState(
            activeChatKey,
            prev[activeChatKey],
          );
          if (prevState.loading) return prev;
          if (
            !shouldApplyServerHistory(prevState.messages, loaded.messages)
          ) {
            return {
              ...prev,
              [activeChatKey]: {
                ...prevState,
                sessionId: loaded.sessionId,
                historyHydrated: true,
              },
            };
          }

          return {
            ...prev,
            [activeChatKey]: {
              ...prevState,
              messages: loaded.messages,
              sessionId: loaded.sessionId,
              historyHydrated: true,
            },
          };
        });
      } catch {
        setChatBySymbol((prev) => ({
          ...prev,
          [activeChatKey]: {
            ...ensureSymbolChatState(activeChatKey, prev[activeChatKey]),
            historyHydrated: true,
          },
        }));
      } finally {
        serverHydrateInflightRef.current.delete(activeChatKey);
      }
    },
    [accessToken, ensureSymbolChatState],
  );

  const clearChatHistory = useCallback(
    async (activeChatKey: string): Promise<boolean> => {
      if (!accessToken || activeChatKey === "__NONE__") return false;

      const currentState =
        chatBySymbolRef.current[activeChatKey] ??
        ensureSymbolChatState(activeChatKey);
      if (currentState.loading) return false;

      try {
        await clearChatHistoryForKey(
          accessToken,
          activeChatKey,
          currentState.sessionId,
        );
      } catch {
        return false;
      }

      serverHydrateInflightRef.current.delete(activeChatKey);
      setChatBySymbol((prev) => ({
        ...prev,
        [activeChatKey]: ensureSymbolChatState(activeChatKey, {
          messages: [],
          input: "",
          loading: false,
          modelMenuOpen: false,
          sessionId: null,
          historyHydrated: true,
        }),
      }));
      return true;
    },
    [accessToken, ensureSymbolChatState],
  );

  const sendPrompt: PositionsContextValue["sendPrompt"] = useCallback(
    async ({
      activeChatKey,
      selectedView,
      selectedSymbol,
      positionsForSelectedSymbol,
      prompt,
    }) => {
      if (!accessToken) return;
      if (
        !positionsForSelectedSymbol?.length &&
        selectedView !== "research"
      )
        return;
      if (activeChatKey === "__NONE__") return;

      const state =
        chatBySymbol[activeChatKey] ?? ensureSymbolChatState(activeChatKey);
      if (state.loading) return;

      const userInput = prompt.trim();
      if (!userInput) return;

      setChatBySymbol((prev) => {
        const prevState = ensureSymbolChatState(
          activeChatKey,
          prev[activeChatKey],
        );
        const userMessage: ChatMessage = {
          id: `user-${activeChatKey}-${Date.now()}`,
          role: "user",
          content: userInput,
        };

        return {
          ...prev,
          [activeChatKey]: {
            ...prevState,
            messages: [...prevState.messages, userMessage],
            input: "",
            loading: true,
          },
        };
      });

      const symbolForApi =
        selectedView === "portfolio"
          ? null
          : selectedView === "research"
            ? selectedSymbol
            : (selectedSymbol ?? "UNKNOWN");

      const streamer = createStreamingAssistantUpdater(
        activeChatKey,
        setChatBySymbol,
        ensureSymbolChatState,
      );

      try {
        if (selectedView === "research") {
          if (!symbolForApi) return;

          await streamResearchChat(
            {
              symbol: symbolForApi,
              prompt: userInput,
              model: state.model,
            },
            accessToken,
            streamer.appendChunk,
          );
        } else {
          await streamAnalysis(
            {
              account: account,
              positions: positionsForSelectedSymbol,
              symbol: symbolForApi,
              action: "free-form",
              prompt: userInput,
              model: state.model,
              session_id: state.sessionId ?? undefined,
            },
            accessToken,
            streamer.appendChunk,
          );
        }

        if (!streamer.assistantContent.current.trim()) {
          streamer.appendChunk(
            "Sorry, I didn't get a response back. Please try again or rephrase your question.",
          );
        }

        streamer.flushNow();
        await hydrateChatFromServer(activeChatKey);
      } catch {
        setChatBySymbol((prev) => {
          const prevState = ensureSymbolChatState(
            activeChatKey,
            prev[activeChatKey],
          );
          return {
            ...prev,
            [activeChatKey]: {
              ...prevState,
              loading: false,
              messages: [
                ...prevState.messages,
                {
                  id: `error-${activeChatKey}-${Date.now()}`,
                  role: "assistant",
                  content:
                    selectedView === "research"
                      ? "Sorry, something went wrong while researching this stock."
                      : "Sorry, something went wrong while analyzing this position.",
                },
              ],
            },
          };
        });
        return;
      }

      setChatBySymbol((prev) => {
        const prevState = ensureSymbolChatState(
          activeChatKey,
          prev[activeChatKey],
        );
        return {
          ...prev,
          [activeChatKey]: {
            ...prevState,
            loading: false,
          },
        };
      });
    },
    [accessToken, account, chatBySymbol, ensureSymbolChatState, hydrateChatFromServer],
  );

  const sendQuickAction: PositionsContextValue["sendQuickAction"] = useCallback(
    async ({
      activeChatKey,
      selectedView,
      selectedSymbol,
      positionsForSelectedSymbol,
      actionId,
    }) => {
      if (!accessToken) return;
      if (
        !positionsForSelectedSymbol?.length &&
        selectedView !== "research"
      )
        return;
      if (activeChatKey === "__NONE__") return;

      const state =
        chatBySymbol[activeChatKey] ?? ensureSymbolChatState(activeChatKey);
      if (state.loading) return;

      const target =
        selectedView === "portfolio"
          ? "my portfolio"
          : selectedView === "research"
            ? (selectedSymbol ?? "this symbol")
            : (selectedSymbol ?? "this position");

      const userMessage: ChatMessage = {
        id: `user-${activeChatKey}-${actionId}-${Date.now()}`,
        role: "user",
        content: formatQuickActionMessage(actionId, target),
      };

      setChatBySymbol((prev) => {
        const prevState = ensureSymbolChatState(
          activeChatKey,
          prev[activeChatKey],
        );
        return {
          ...prev,
          [activeChatKey]: {
            ...prevState,
            messages: [...prevState.messages, userMessage],
            loading: true,
          },
        };
      });

      const symbolForApi =
        selectedView === "portfolio"
          ? null
          : selectedView === "research"
            ? selectedSymbol
            : (selectedSymbol ?? "UNKNOWN");

      const freeForm = isFreeFormQuickAction(actionId);

      const streamer = createStreamingAssistantUpdater(
        activeChatKey,
        setChatBySymbol,
        ensureSymbolChatState,
        actionId,
      );

      try {
        if (selectedView === "research") {
          if (!symbolForApi) return;

          await streamResearchChat(
            {
              symbol: symbolForApi,
              prompt: userMessage.content,
              model: state.model,
            },
            accessToken,
            streamer.appendChunk,
          );
        } else {
          await streamAnalysis(
            {
              account: account,
              positions: positionsForSelectedSymbol ?? [],
              symbol: symbolForApi,
              action: freeForm ? "free-form" : getQuickActionApiAction(actionId),
              prompt: freeForm ? userMessage.content : null,
              user_display_message: userMessage.content,
              model: state.model,
              session_id: state.sessionId ?? undefined,
            },
            accessToken,
            streamer.appendChunk,
          );
        }

        if (!streamer.assistantContent.current.trim()) {
          streamer.appendChunk(
            "Sorry, I didn't get a response back. Please try again or rephrase your question.",
          );
        }

        streamer.flushNow();
        await hydrateChatFromServer(activeChatKey);
      } catch {
        setChatBySymbol((prev) => {
          const prevState = ensureSymbolChatState(
            activeChatKey,
            prev[activeChatKey],
          );
          return {
            ...prev,
            [activeChatKey]: {
              ...prevState,
              loading: false,
              messages: [
                ...prevState.messages,
                {
                  id: `error-${activeChatKey}-${actionId}-${Date.now()}`,
                  role: "assistant",
                  content:
                    selectedView === "research"
                      ? "Sorry, something went wrong while researching this stock."
                      : "Sorry, something went wrong while analyzing this position.",
                },
              ],
            },
          };
        });
        return;
      }

      setChatBySymbol((prev) => {
        const prevState = ensureSymbolChatState(
          activeChatKey,
          prev[activeChatKey],
        );
        return {
          ...prev,
          [activeChatKey]: {
            ...prevState,
            loading: false,
          },
        };
      });
    },
    [accessToken, account, chatBySymbol, ensureSymbolChatState, hydrateChatFromServer],
  );

  const value: PositionsContextValue = useMemo(
    () => ({
      sessionAccessToken: accessToken,
      loading,
      error,
      positionMap,
      symbols,
      allPositions,
      selectedSymbol,
      setSelectedSymbol,
      selectedView,
      setSelectedView,
      positionsForSelectedSymbol,
      chatBySymbol,
      setChatBySymbol,
      ensureSymbolChatState,
      sendPrompt,
      sendQuickAction,
      hydrateChatFromServer,
      clearChatHistory,
      account,
      cashSecuredPutSummary,
      assignmentRiskSummary,
      recentActivity,
      proactiveAlerts,
      portfolioBrief,
      refreshPositions,
    }),
    [
      accessToken,
      loading,
      error,
      positionMap,
      symbols,
      allPositions,
      selectedSymbol,
      selectedView,
      positionsForSelectedSymbol,
      chatBySymbol,
      ensureSymbolChatState,
      sendPrompt,
      sendQuickAction,
      hydrateChatFromServer,
      clearChatHistory,
      account,
      cashSecuredPutSummary,
      assignmentRiskSummary,
      recentActivity,
      proactiveAlerts,
      portfolioBrief,
      refreshPositions,
    ],
  );

  return (
    <PositionsContext.Provider value={value}>
      {children}
    </PositionsContext.Provider>
  );
}
