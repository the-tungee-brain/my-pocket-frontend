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
import { apiFetch, streamAnalysis, streamResearchChat } from "@/lib/apiClient";
import type { PositionMap } from "@/components/AccountPositionList";
import type { ChatMessage } from "@/components/ConversationPane";
import { DEFAULT_CHAT_MODEL } from "@/lib/chatModels";
import {
  loadPersistedChat,
  persistChatState,
} from "@/lib/chatPersistence";
import { formatQuickActionMessage, getQuickActionApiAction, isFreeFormQuickAction } from "@/lib/quickActions";
import { Position, SchwabAccounts } from "./types/schwab";
import { MainView } from "@/components/NavList";
import { usePathname } from "next/navigation";

type SymbolChatState = {
  loading: boolean;
  input: string;
  messages: ChatMessage[];
  model: string;
  modelMenuOpen: boolean;
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
  account: SchwabAccounts | null;
};

const PositionsContext = createContext<PositionsContextValue | null>(null);

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
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<MainView>("research");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatBySymbol, setChatBySymbol] = useState<ChatStateMap>({});
  const chatHydratedRef = useRef(false);
  const accessToken = session?.accessToken ?? "";
  const chatUserId = session?.user?.email ?? session?.user?.id ?? null;

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
    persistChatState(chatUserId, chatBySymbol);
  }, [chatBySymbol, chatUserId]);

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

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await apiFetch("/get-account-positions", {
          method: "GET",
          accessToken,
        });

        if (!res.ok) {
          setError("Failed to load positions");
          setPositionMap({});
          setAccount(null);
          setSelectedSymbol(null);
          return;
        }

        const data = (await res.json()) as {
          schwab_positions: PositionMap;
          account: SchwabAccounts;
        };
        const map = data.schwab_positions ?? {};
        setPositionMap(map);
        setAccount(data.account ?? null);

        const symbolsOnly = Object.keys(map).sort();
        setSelectedSymbol((current) =>
          current && symbolsOnly.includes(current)
            ? current
            : (symbolsOnly[0] ?? null),
        );
      } catch {
        setError("Failed to load positions");
        setPositionMap({});
        setAccount(null);
        setSelectedSymbol(null);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [accessToken]);

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

      const appendAssistantChunk = (chunk: string, assistantContent: { current: string }) => {
        assistantContent.current += chunk;

        setChatBySymbol((prev) => {
          const prevState = ensureSymbolChatState(
            activeChatKey,
            prev[activeChatKey],
          );
          const messages = [...prevState.messages];
          const last = messages[messages.length - 1];

          if (last && last.role === "assistant") {
            messages[messages.length - 1] = {
              ...last,
              content: assistantContent.current,
            };
          } else {
            messages.push({
              id: `assistant-${activeChatKey}-${Date.now()}`,
              role: "assistant",
              content: assistantContent.current,
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

      try {
        const assistantContent = { current: "" };

        if (selectedView === "research") {
          if (!symbolForApi) return;

          await streamResearchChat(
            {
              symbol: symbolForApi,
              prompt: userInput,
              model: state.model,
            },
            accessToken,
            (chunk) => appendAssistantChunk(chunk, assistantContent),
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
            },
            accessToken,
            (chunk) => appendAssistantChunk(chunk, assistantContent),
          );
        }

        if (!assistantContent.current.trim()) {
          appendAssistantChunk(
            "Sorry, I didn't get a response back. Please try again or rephrase your question.",
            assistantContent,
          );
        }
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
    [accessToken, account, chatBySymbol, ensureSymbolChatState],
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

      const appendAssistantChunk = (chunk: string, assistantContent: { current: string }) => {
        assistantContent.current += chunk;

        setChatBySymbol((prev) => {
          const prevState = ensureSymbolChatState(
            activeChatKey,
            prev[activeChatKey],
          );
          const messages = [...prevState.messages];
          const last = messages[messages.length - 1];

          if (last && last.role === "assistant") {
            messages[messages.length - 1] = {
              ...last,
              content: assistantContent.current,
            };
          } else {
            messages.push({
              id: `assistant-${activeChatKey}-${actionId}-${Date.now()}`,
              role: "assistant",
              content: assistantContent.current,
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

      try {
        const assistantContent = { current: "" };

        if (selectedView === "research") {
          if (!symbolForApi) return;

          await streamResearchChat(
            {
              symbol: symbolForApi,
              prompt: userMessage.content,
              model: state.model,
            },
            accessToken,
            (chunk) => appendAssistantChunk(chunk, assistantContent),
          );
        } else {
          await streamAnalysis(
            {
              account: account,
              positions: positionsForSelectedSymbol ?? [],
              symbol: symbolForApi,
              action: freeForm ? "free-form" : getQuickActionApiAction(actionId),
              prompt: freeForm ? userMessage.content : null,
              model: state.model,
            },
            accessToken,
            (chunk) => appendAssistantChunk(chunk, assistantContent),
          );
        }

        if (!assistantContent.current.trim()) {
          appendAssistantChunk(
            "Sorry, I didn't get a response back. Please try again or rephrase your question.",
            assistantContent,
          );
        }
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
    [accessToken, account, chatBySymbol, ensureSymbolChatState],
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
      account,
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
      account,
    ],
  );

  return (
    <PositionsContext.Provider value={value}>
      {children}
    </PositionsContext.Provider>
  );
}
