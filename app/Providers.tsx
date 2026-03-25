"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { apiFetch, streamAnalysis } from "@/lib/apiClient";
import type { PositionMap } from "@/components/AccountPositionList";
import type { ChatMessage } from "@/components/ConversationPane";
import { Position, SchwabAccounts } from "./types/schwab";

type MainView = "portfolio" | "symbol";

type SymbolChatState = {
  loading: boolean;
  input: string;
  messages: ChatMessage[];
  model: string;
  modelMenuOpen: boolean;
};

type ChatStateMap = Record<string, SymbolChatState>;

type InsightResult = {
  loading: boolean;
  error: string | null;
  content: string | null;
};

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
  insightsByKey: Record<string, InsightResult>;
  buildInsightKey: (label: string, positions: Position[]) => string;
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

const buildInsightKey = (label: string, positions: Position[]) =>
  JSON.stringify({
    label,
    positions: positions.map((p) => ({
      symbol: p.instrument.symbol,
      longQuantity: p.longQuantity,
      shortQuantity: p.shortQuantity,
    })),
  });

export function PositionsProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [positionMap, setPositionMap] = useState<PositionMap>({});
  const [account, setAccount] = useState<SchwabAccounts | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<MainView>("portfolio");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatBySymbol, setChatBySymbol] = useState<ChatStateMap>({});
  const [insightsByKey, setInsightsByKey] = useState<
    Record<string, InsightResult>
  >({});
  const accessToken = session?.accessToken ?? "";

  const ensureSymbolChatState = (
    key: string,
    base?: Partial<SymbolChatState>,
  ): SymbolChatState => ({
    loading: false,
    input: "",
    messages: [],
    model: "gpt-4.1-mini",
    modelMenuOpen: false,
    ...base,
  });

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

        // if (Object.keys(map).length) {
        //   void prefetchInsights(map, accessToken, data.account ?? null);
        // }
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

  const prefetchInsights = async (
    map: PositionMap,
    token: string,
    account: SchwabAccounts | null,
  ) => {
    const entries: Array<{
      label: string;
      key: string;
      positions: Position[];
    }> = [];

    const portfolioPositions = Object.values(map).flat() as Position[];
    if (portfolioPositions.length) {
      const label = "PORTFOLIO";
      entries.push({
        label,
        key: buildInsightKey(label, portfolioPositions),
        positions: portfolioPositions,
      });
    }

    for (const [sym, positions] of Object.entries(map)) {
      if (!positions?.length) continue;
      const label = sym;
      entries.push({
        label,
        key: buildInsightKey(label, positions),
        positions,
      });
    }

    for (const { label, key, positions } of entries) {
      setInsightsByKey((prev) =>
        prev[key]
          ? prev
          : {
              ...prev,
              [key]: { loading: true, error: null, content: null },
            },
      );

      let buffer = "";

      const symbolForApi = label === "PORTFOLIO" ? null : label;

      try {
        await streamAnalysis(
          { account, positions, symbol: symbolForApi },
          token,
          (chunk) => {
            buffer += chunk;
            setInsightsByKey((prev) => ({
              ...prev,
              [key]: { loading: true, error: null, content: buffer },
            }));
          },
        );

        setInsightsByKey((prev) => ({
          ...prev,
          [key]: { loading: false, error: null, content: buffer },
        }));
      } catch {
        setInsightsByKey((prev) => ({
          ...prev,
          [key]: {
            loading: false,
            error: "Failed to load insights.",
            content: null,
          },
        }));
      }
    }
  };

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

  const sendPrompt: PositionsContextValue["sendPrompt"] = async ({
    activeChatKey,
    selectedView,
    selectedSymbol,
    positionsForSelectedSymbol,
    prompt,
  }) => {
    if (!accessToken) return;
    if (!positionsForSelectedSymbol?.length) return;
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
      selectedView === "portfolio" ? null : (selectedSymbol ?? "UNKNOWN");

    try {
      let assistantContent = "";

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
        (chunk) => {
          assistantContent += chunk;

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
                content: assistantContent,
              };
            } else {
              messages.push({
                id: `assistant-${activeChatKey}-${Date.now()}`,
                role: "assistant",
                content: assistantContent,
              });
            }

            return {
              ...prev,
              [activeChatKey]: {
                ...prevState,
                messages,
              },
            };
          });
        },
      );
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
                  "Sorry, something went wrong while analyzing this position.",
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
  };

  const sendQuickAction: PositionsContextValue["sendQuickAction"] = async ({
    activeChatKey,
    selectedView,
    selectedSymbol,
    positionsForSelectedSymbol,
    actionId,
  }) => {
    if (!accessToken) return;
    if (!positionsForSelectedSymbol?.length) return;
    if (activeChatKey === "__NONE__") return;

    const state =
      chatBySymbol[activeChatKey] ?? ensureSymbolChatState(activeChatKey);
    if (state.loading) return;

    const label =
      selectedView === "portfolio"
        ? "portfolio"
        : (selectedSymbol ?? "position");

    const userMessage: ChatMessage = {
      id: `user-${activeChatKey}-${actionId}-${Date.now()}`,
      role: "user",
      content: `${actionId
        .replace(/-/g, " ")
        .replace(/^./, (c) => c.toUpperCase())} analysis for ${label}`,
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
      selectedView === "portfolio" ? null : (selectedSymbol ?? "UNKNOWN");

    try {
      let assistantContent = "";

      await streamAnalysis(
        {
          account: account,
          positions: positionsForSelectedSymbol,
          symbol: symbolForApi,
          action: actionId,
          prompt: null,
          model: state.model,
        },
        accessToken,
        (chunk) => {
          assistantContent += chunk;

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
                content: assistantContent,
              };
            } else {
              messages.push({
                id: `assistant-${activeChatKey}-${actionId}-${Date.now()}`,
                role: "assistant",
                content: assistantContent,
              });
            }

            return {
              ...prev,
              [activeChatKey]: {
                ...prevState,
                messages,
              },
            };
          });
        },
      );
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
                  "Sorry, something went wrong while analyzing this position.",
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
  };

  const value: PositionsContextValue = {
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
    insightsByKey,
    buildInsightKey,
    account,
  };

  return (
    <PositionsContext.Provider value={value}>
      {children}
    </PositionsContext.Provider>
  );
}
