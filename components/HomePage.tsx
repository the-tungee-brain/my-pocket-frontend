"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { SchwabConnectCard } from "@/components/SchwabConnectCard";
import { apiFetch, streamAnalysis } from "@/lib/apiClient";
import {
  AccountPositionList,
  Position,
  PositionMap,
} from "./AccountPositionList";
import { Insights } from "./Insights";
import { MarkdownRenderer } from "./ui/MarkdownRenderer";
import { ThinkingSpinner } from "./ui/ThinkingSpinner";
import { MobileNav } from "@/components/MobileNav";
import { DesktopNav } from "@/components/DesktopNav";
import { Dropdown } from "./Dropdown";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type SymbolChatState = {
  loading: boolean;
  input: string;
  messages: ChatMessage[];
  model: string;
  modelMenuOpen: boolean;
};

type ChatStateMap = Record<string, SymbolChatState>;

const MODEL_OPTIONS = [
  { id: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
  { id: "gpt-4.1", label: "GPT-4.1" },
];

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

  const conversationEndRef = useRef<HTMLDivElement | null>(null);
  const modelMenuRef = useRef<HTMLDivElement | null>(null);

  const ensureSymbolChatState = (
    symbol: string,
    base?: Partial<SymbolChatState>,
  ): ChatStateMap[string] => ({
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

  const hasNoPositions =
    !loading &&
    Object.values(positionMap).every((arr) => (arr ?? []).length === 0);

  const currentChat = selectedSymbol ? chatBySymbol[selectedSymbol] : undefined;

  useEffect(() => {
    if (!currentChat?.messages.length) return;
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChat?.messages.length, selectedSymbol]);

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

  const handleSendMessage = async () => {
    if (!selectedSymbol || !session?.accessToken) return;

    const symbol = selectedSymbol;
    const positions = positionMap[symbol] ?? [];
    if (!positions.length) return;

    const state = ensureSymbolChatState(symbol, chatBySymbol[symbol]);
    const trimmed = state.input.trim();
    if (!trimmed || state.loading) return;

    const userInput = trimmed;

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
    } catch (e) {
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
    <main className="flex min-h-screen text-neutral-50">
      <DesktopNav
        loading={loading}
        symbols={symbols}
        selectedSymbol={selectedSymbol}
        setSelectedSymbol={setSelectedSymbol}
      />

      <MobileNav
        mobileNavOpen={mobileNavOpen}
        setMobileNavOpen={setMobileNavOpen}
        loading={loading}
        symbols={symbols}
        selectedSymbol={selectedSymbol}
        setSelectedSymbol={setSelectedSymbol}
      />

      <section className="flex min-h-screen flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-secondary md:hidden space-x-4">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="rounded-md border border-border px-2 py-1 text-xs"
          >
            Menu
          </button>
          <SchwabConnectCard />
        </div>

        <div className="hidden border-b border-border px-4 py-3 bg-secondary md:block">
          <SchwabConnectCard />
        </div>

        <div className="flex flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4">
            {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

            {hasNoPositions && !loading && !error && (
              <p className="text-sm text-neutral-400">
                No positions found yet. Once Schwab is connected and you have
                holdings, they'll appear here.
              </p>
            )}

            {!hasNoPositions && (
              <>
                <AccountPositionList
                  positionsForSelectedSymbol={positionsForSelectedSymbol}
                  selectedSymbol={selectedSymbol}
                />

                <Insights
                  symbol={selectedSymbol}
                  positions={positionsForSelectedSymbol}
                  accessToken={session.accessToken}
                />

                {selectedSymbol && (
                  <div className="mx-auto mt-4 max-w-3xl py-3">
                    <div className="mb-3 text-xs font-semibold text-foreground tracking-wide uppercase">
                      Conversation for {selectedSymbol}
                    </div>
                    <div className="space-y-6 pr-1">
                      {(currentChat?.messages ?? []).map((m) => {
                        const isAssistant = m.role === "assistant";

                        return (
                          <div
                            key={m.id}
                            className={
                              isAssistant
                                ? "flex justify-start"
                                : "flex justify-end"
                            }
                          >
                            <div
                              className={
                                isAssistant
                                  ? "w-full max-w-3xl rounded-2xl bg-transparent text-base leading-relaxed text-foreground"
                                  : "inline-block max-w-[80%] rounded-2xl bg-secondary px-4 pt-3 text-base leading-relaxed text-foreground"
                              }
                            >
                              <MarkdownRenderer content={m.content} />
                            </div>
                          </div>
                        );
                      })}

                      {currentChat?.loading && <ThinkingSpinner />}

                      <div ref={conversationEndRef} />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {selectedSymbol && (
            <div className="sticky bottom-0 z-20 px-4 pb-4 pt-3 scrollbar-dark">
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 rounded-2xl border border-border bg-secondary/95 p-4 backdrop-blur">
                <form
                  className="flex flex-col gap-3 text-foreground"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleSendMessage();
                  }}
                >
                  <textarea
                    rows={inputRows}
                    className="w-full resize-none bg-transparent text-base leading-relaxed tracking-wide text-foreground outline-none placeholder:text-neutral-500"
                    placeholder={`Ask anything about your ${selectedSymbol} position…`}
                    value={currentChat?.input ?? ""}
                    onChange={(e) => handleChatInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (
                          !currentChat?.loading &&
                          (currentChat?.input ?? "").trim().length > 0
                        ) {
                          void handleSendMessage();
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
                        onClick={toggleModelMenu}
                        className={[
                          "flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium text-foreground cursor-pointer",
                          "disabled:opacity-60",
                          "transition-all duration-200 ease-out",
                          currentChat?.modelMenuOpen
                            ? "bg-neutral-800/90"
                            : "hover:bg-neutral-800/90",
                        ].join(" ")}
                      >
                        <span className="max-w-[120px] truncate text-neutral-200">
                          {MODEL_OPTIONS.find(
                            (m) =>
                              m.id === (currentChat?.model || "gpt-4.1-mini"),
                          )?.label ?? "GPT-4.1 Mini"}
                        </span>
                        <span className="text-[10px] text-neutral-400">▾</span>
                      </button>

                      <Dropdown
                        open={!!currentChat?.modelMenuOpen}
                        options={MODEL_OPTIONS}
                        value={currentChat?.model || "gpt-4.1-mini"}
                        onChange={handleModelChange}
                        onClose={closeModelMenu}
                      />

                      <button
                        type="submit"
                        disabled={
                          currentChat?.loading ||
                          !(currentChat?.input ?? "").trim()
                        }
                        className="ml-1 cursor-pointer rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-neutral-900 disabled:opacity-60"
                      >
                        {currentChat?.loading ? "Analyzing…" : "Send"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
