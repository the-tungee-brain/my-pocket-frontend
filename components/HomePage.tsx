"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { apiFetch, streamAnalysis } from "@/lib/apiClient";
import { Position, PositionMap } from "./AccountPositionList";
import { PositionsLayout } from "@/components/PositionsLayout";
import { ConversationPane, ChatMessage } from "@/components/ConversationPane";
import { ChatBox } from "@/components/ChatBox";

type SymbolChatState = {
  loading: boolean;
  input: string;
  messages: ChatMessage[];
  model: string;
  modelMenuOpen: boolean;
};

type ChatStateMap = Record<string, SymbolChatState>;

const MIN_ROWS = 1;
const MAX_ROWS = 24;

export default function HomePage() {
  const { data: session } = useSession();
  const [positionMap, setPositionMap] = useState<PositionMap>({});
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatBySymbol, setChatBySymbol] = useState<ChatStateMap>({});
  const [inputRows, setInputRows] = useState(MIN_ROWS);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const modelMenuRef = useRef<HTMLDivElement | null>(null);

  const ensureSymbolChatState = (
    symbol: string,
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
    if (!session?.accessToken) return;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await apiFetch("/get-account-positions", {
          method: "GET",
          accessToken: session.accessToken,
        });

        if (!res.ok) {
          setError("Failed to load positions");
          setPositionMap({});
          setSelectedSymbol(null);
          return;
        }

        const data = (await res.json()) as { schwab_positions: PositionMap };
        const map = data.schwab_positions ?? {};
        setPositionMap(map);

        const symbols = Object.keys(map).sort();
        setSelectedSymbol((current) =>
          current && symbols.includes(current) ? current : (symbols[0] ?? null),
        );
      } catch {
        setError("Failed to load positions");
        setPositionMap({});
        setSelectedSymbol(null);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [session?.accessToken]);

  const symbols = useMemo(() => Object.keys(positionMap).sort(), [positionMap]);

  const positionsForSelectedSymbol: Position[] | null = useMemo(() => {
    if (!selectedSymbol) return null;
    return positionMap[selectedSymbol] ?? null;
  }, [positionMap, selectedSymbol]);

  const currentChat = selectedSymbol ? chatBySymbol[selectedSymbol] : undefined;

  const handleChatInputChange = (value: string) => {
    if (!selectedSymbol) return;

    setChatBySymbol((prev) => ({
      ...prev,
      [selectedSymbol]: {
        ...ensureSymbolChatState(selectedSymbol, prev[selectedSymbol]),
        input: value,
      },
    }));

    const lines = value.split("\n").length;
    const nextRows = Math.min(MAX_ROWS, Math.max(MIN_ROWS, lines));
    setInputRows(nextRows);
  };

  const handleModelChange = (model: string) => {
    if (!selectedSymbol) return;

    setChatBySymbol((prev) => {
      const prevState = ensureSymbolChatState(
        selectedSymbol,
        prev[selectedSymbol],
      );
      return {
        ...prev,
        [selectedSymbol]: {
          ...prevState,
          model,
        },
      };
    });
  };

  const toggleModelMenu = () => {
    if (!selectedSymbol) return;
    setChatBySymbol((prev) => {
      const prevState = ensureSymbolChatState(
        selectedSymbol,
        prev[selectedSymbol],
      );
      return {
        ...prev,
        [selectedSymbol]: {
          ...prevState,
          modelMenuOpen: !prevState.modelMenuOpen,
        },
      };
    });
  };

  const closeModelMenu = () => {
    if (!selectedSymbol) return;
    setChatBySymbol((prev) => {
      const prevState = ensureSymbolChatState(
        selectedSymbol,
        prev[selectedSymbol],
      );
      return {
        ...prev,
        [selectedSymbol]: {
          ...prevState,
          modelMenuOpen: false,
        },
      };
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!selectedSymbol) return;
      if (
        modelMenuRef.current &&
        !modelMenuRef.current.contains(event.target as Node)
      ) {
        closeModelMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedSymbol]);

  const sendPrompt = async (prompt: string) => {
    if (!selectedSymbol || !session?.accessToken) return;

    const symbol = selectedSymbol;
    const positions = positionMap[symbol] ?? [];
    if (!positions.length) return;

    const state = chatBySymbol[symbol] ?? ensureSymbolChatState(symbol);
    if (state.loading) return;

    const userInput = prompt.trim();
    if (!userInput) return;

    setChatBySymbol((prev) => {
      const prevState = ensureSymbolChatState(symbol, prev[symbol]);

      const userMessage: ChatMessage = {
        id: `user-${symbol}-${Date.now()}`,
        role: "user",
        content: userInput,
      };

      return {
        ...prev,
        [symbol]: {
          ...prevState,
          messages: [...prevState.messages, userMessage],
          input: "",
          loading: true,
        },
      };
    });

    setInputRows(MIN_ROWS);
    closeModelMenu();

    try {
      let assistantContent = "";

      await streamAnalysis(
        {
          positions,
          symbol,
          action: "free-form",
          prompt: userInput,
          model: state.model,
        },
        session.accessToken,
        (chunk) => {
          assistantContent += chunk;

          setChatBySymbol((prev) => {
            const prevState = ensureSymbolChatState(symbol, prev[symbol]);
            const messages = [...prevState.messages];
            const last = messages[messages.length - 1];

            if (last && last.role === "assistant") {
              messages[messages.length - 1] = {
                ...last,
                content: assistantContent,
              };
            } else {
              messages.push({
                id: `assistant-${symbol}-${Date.now()}`,
                role: "assistant",
                content: assistantContent,
              });
            }

            return {
              ...prev,
              [symbol]: {
                ...prevState,
                messages,
              },
            };
          });
        },
      );
    } catch {
      setChatBySymbol((prev) => {
        const prevState = ensureSymbolChatState(symbol, prev[symbol]);
        return {
          ...prev,
          [symbol]: {
            ...prevState,
            loading: false,
            messages: [
              ...prevState.messages,
              {
                id: `error-${symbol}-${Date.now()}`,
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
      const prevState = ensureSymbolChatState(symbol, prev[symbol]);
      return {
        ...prev,
        [symbol]: {
          ...prevState,
          loading: false,
        },
      };
    });
  };

  const sendQuickAction = async (actionId: string) => {
    if (!selectedSymbol || !session?.accessToken) return;

    const symbol = selectedSymbol;
    const positions = positionMap[symbol] ?? [];
    if (!positions.length) return;

    const state = chatBySymbol[symbol] ?? ensureSymbolChatState(symbol);
    if (state.loading) return;

    const userMessage: ChatMessage = {
      id: `user-${symbol}-${actionId}-${Date.now()}`,
      role: "user",
      content: `${actionId
        .replace(/-/g, " ")
        .replace(/^./, (c) => c.toUpperCase())} analysis for ${symbol}`,
    };

    setChatBySymbol((prev) => {
      const prevState = ensureSymbolChatState(symbol, prev[symbol]);
      return {
        ...prev,
        [symbol]: {
          ...prevState,
          messages: [...prevState.messages, userMessage],
          loading: true,
        },
      };
    });

    setInputRows(MIN_ROWS);
    closeModelMenu();

    try {
      let assistantContent = "";

      await streamAnalysis(
        {
          positions,
          symbol,
          action: actionId,
          prompt: null,
          model: state.model,
        },
        session.accessToken,
        (chunk) => {
          assistantContent += chunk;

          setChatBySymbol((prev) => {
            const prevState = ensureSymbolChatState(symbol, prev[symbol]);
            const messages = [...prevState.messages];
            const last = messages[messages.length - 1];

            if (last && last.role === "assistant") {
              messages[messages.length - 1] = {
                ...last,
                content: assistantContent,
              };
            } else {
              messages.push({
                id: `assistant-${symbol}-${actionId}-${Date.now()}`,
                role: "assistant",
                content: assistantContent,
              });
            }

            return {
              ...prev,
              [symbol]: {
                ...prevState,
                messages,
              },
            };
          });
        },
      );
    } catch {
      setChatBySymbol((prev) => {
        const prevState = ensureSymbolChatState(symbol, prev[symbol]);
        return {
          ...prev,
          [symbol]: {
            ...prevState,
            loading: false,
            messages: [
              ...prevState.messages,
              {
                id: `error-${symbol}-${actionId}-${Date.now()}`,
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
      const prevState = ensureSymbolChatState(symbol, prev[symbol]);
      return {
        ...prev,
        [symbol]: {
          ...prevState,
          loading: false,
        },
      };
    });
  };

  const handleSendMessage = async () => {
    const input = (currentChat?.input ?? "").trim();
    if (!input) return;
    await sendPrompt(input);
  };

  if (!session?.accessToken) {
    return (
      <main className="flex min-h-screen items-center justify-center text-neutral-50">
        <p className="text-sm text-neutral-400">
          Please connect your Schwab account to view positions.
        </p>
      </main>
    );
  }

  return (
    <PositionsLayout
      loading={loading}
      error={error}
      positionMap={positionMap}
      symbols={symbols}
      selectedSymbol={selectedSymbol}
      setSelectedSymbol={setSelectedSymbol}
      positionsForSelectedSymbol={positionsForSelectedSymbol}
      accessToken={session.accessToken}
      mobileNavOpen={mobileNavOpen}
      setMobileNavOpen={setMobileNavOpen}
      topChildren={
        <ConversationPane
          symbol={selectedSymbol}
          messages={currentChat?.messages ?? []}
          loading={!!currentChat?.loading}
        />
      }
      bottomChildren={
        selectedSymbol && (
          <ChatBox
            selectedSymbol={selectedSymbol}
            currentChat={currentChat}
            inputRows={inputRows}
            modelMenuRef={modelMenuRef}
            onChangeInput={handleChatInputChange}
            onSendPrompt={() => void handleSendMessage()}
            onSendQuickAction={(id) => void sendQuickAction(id)}
            onToggleModelMenu={toggleModelMenu}
            onModelChange={handleModelChange}
          />
        )
      }
    />
  );
}
