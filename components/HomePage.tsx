"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SchwabConnectCard } from "@/components/SchwabConnectCard";
import { apiFetch, streamAnalysis } from "@/lib/apiClient";
import {
  AccountPositionList,
  Position,
  PositionMap,
} from "./AccountPositionList";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type SymbolChatState = {
  loading: boolean;
  input: string;
  messages: ChatMessage[];
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

  const conversationEndRef = useRef<HTMLDivElement | null>(null);

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

    load();
  }, [session?.accessToken]);

  const symbols = useMemo(() => Object.keys(positionMap).sort(), [positionMap]);

  const positionsForSelectedSymbol: Position[] | null = useMemo(() => {
    if (!selectedSymbol) return null;
    return positionMap[selectedSymbol] ?? null;
  }, [positionMap, selectedSymbol]);

  const hasNoPositions =
    !loading &&
    Object.values(positionMap).every((arr) => (arr ?? []).length === 0);

  const ensureSymbolChatState = (
    symbol: string,
    base?: Partial<SymbolChatState>,
  ): ChatStateMap[string] => ({
    loading: false,
    input: "",
    messages: [],
    ...base,
  });

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

  const handleSendMessage = async () => {
    if (!selectedSymbol || !session?.accessToken) return;

    const symbol = selectedSymbol;
    const positions = positionMap[symbol] ?? [];
    if (!positions.length) return;

    let userInput: string | undefined;

    setChatBySymbol((prev) => {
      const state = ensureSymbolChatState(symbol, prev[symbol]);
      const trimmed = state.input.trim();
      if (!trimmed || state.loading) return prev;

      userInput = trimmed;

      const userMessage: ChatMessage = {
        id: `user-${symbol}-${Date.now()}`,
        role: "user",
        content: trimmed,
      };

      return {
        ...prev,
        [symbol]: {
          ...state,
          messages: [...state.messages, userMessage],
          input: "",
          loading: true,
        },
      };
    });

    setInputRows(MIN_ROWS);

    try {
      let assistantContent = "";

      await streamAnalysis(
        {
          positions,
          prompt: userInput ?? null,
        },
        session.accessToken,
        (chunk) => {
          assistantContent += chunk;

          setChatBySymbol((prev) => {
            const state = ensureSymbolChatState(symbol, prev[symbol]);
            const messages = [...state.messages];
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
                ...state,
                messages,
              },
            };
          });
        },
      );
    } catch (e) {
      setChatBySymbol((prev) => {
        const state = ensureSymbolChatState(symbol, prev[symbol]);
        return {
          ...prev,
          [symbol]: {
            ...state,
            loading: false,
            messages: [
              ...state.messages,
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
      const state = ensureSymbolChatState(symbol, prev[symbol]);
      return {
        ...prev,
        [symbol]: {
          ...state,
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
      <aside className="hidden md:sticky md:top-0 md:flex md:h-screen md:w-56 md:flex-col border-r border-border bg-secondary">
        <div className="px-4 py-3 text-xs uppercase tracking-wide text-neutral-400">
          Holdings
        </div>
        <nav className="flex-1 overflow-y-auto">
          {loading && (
            <div className="px-4 py-2 text-xs text-neutral-500">
              Loading symbols…
            </div>
          )}
          {!loading && symbols.length === 0 && (
            <div className="px-4 py-2 text-xs text-neutral-500">
              No symbols yet.
            </div>
          )}
          {symbols.map((sym) => {
            const isActive = sym === selectedSymbol;
            return (
              <button
                key={sym}
                type="button"
                onClick={() => setSelectedSymbol(sym)}
                className={[
                  "w-full px-4 py-2 text-left text-sm transition-colors",
                  "hover:bg-neutral-800",
                  isActive ? "bg-neutral-800 text-white" : "text-neutral-300",
                ].join(" ")}
              >
                {sym}
              </button>
            );
          })}
        </nav>
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative z-50 flex h-full w-64 flex-col border-r border-border bg-secondary">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-xs uppercase tracking-wide text-neutral-400">
                Holdings
              </span>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="text-xs text-neutral-400"
              >
                Close
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto">
              {loading && (
                <div className="px-4 py-2 text-xs text-neutral-500">
                  Loading symbols…
                </div>
              )}
              {!loading && symbols.length === 0 && (
                <div className="px-4 py-2 text-xs text-neutral-500">
                  No symbols yet.
                </div>
              )}
              {symbols.map((sym) => {
                const isActive = sym === selectedSymbol;
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => {
                      setSelectedSymbol(sym);
                      setMobileNavOpen(false);
                    }}
                    className={[
                      "w-full px-4 py-2 text-left text-sm transition-colors",
                      "hover:bg-neutral-800",
                      isActive
                        ? "bg-neutral-800 text-white"
                        : "text-neutral-300",
                    ].join(" ")}
                  >
                    {sym}
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

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
                holdings, they’ll appear here.
              </p>
            )}

            {!hasNoPositions && (
              <>
                <AccountPositionList
                  positionsForSelectedSymbol={positionsForSelectedSymbol}
                  selectedSymbol={selectedSymbol}
                />

                {selectedSymbol && (
                  <div className="mx-auto mt-4 max-w-3xl px-4 py-3">
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
                                  : "inline-block max-w-[80%] rounded-2xl bg-secondary px-4 py-3 text-base leading-relaxed text-foreground"
                              }
                            >
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  h1: ({ children }) => (
                                    <h1 className="mb-3 text-xl font-semibold tracking-tight">
                                      {children}
                                    </h1>
                                  ),
                                  h2: ({ children }) => (
                                    <h2 className="mt-4 mb-2 text-lg font-semibold tracking-tight">
                                      {children}
                                    </h2>
                                  ),
                                  h3: ({ children }) => (
                                    <h3 className="mt-3 mb-1.5 text-base font-semibold tracking-tight text-neutral-200">
                                      {children}
                                    </h3>
                                  ),
                                  p: ({ children }) => (
                                    <p className="whitespace-pre-wrap break-words text-base leading-relaxed tracking-wide mb-2">
                                      {children}
                                    </p>
                                  ),
                                  ul: ({ children }) => (
                                    <ul className="my-2 ml-5 list-disc space-y-1 text-base leading-relaxed">
                                      {children}
                                    </ul>
                                  ),
                                  ol: ({ children }) => (
                                    <ol className="my-2 ml-5 list-decimal space-y-1 text-base leading-relaxed">
                                      {children}
                                    </ol>
                                  ),
                                  li: ({ children }) => <li>{children}</li>,
                                  a: ({ href, children }) => (
                                    <a
                                      href={href}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-sky-400 underline decoration-sky-500/60 underline-offset-2 hover:text-sky-300"
                                    >
                                      {children}
                                    </a>
                                  ),
                                  blockquote: ({ children }) => (
                                    <blockquote className="my-3 border-l-2 border-neutral-700 pl-3 text-sm text-neutral-300 italic">
                                      {children}
                                    </blockquote>
                                  ),
                                  code: ({ children, ...props }) => (
                                    <code
                                      {...props}
                                      className="whitespace-pre-wrap break-words text-sm leading-relaxed tracking-wide bg-neutral-900/40 px-1.5 py-0.5 rounded"
                                    >
                                      {children}
                                    </code>
                                  ),
                                }}
                              >
                                {m.content}
                              </ReactMarkdown>
                            </div>
                          </div>
                        );
                      })}

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
                <div className="flex flex-col">
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

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={
                          currentChat?.loading ||
                          !(currentChat?.input ?? "").trim()
                        }
                        className="rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-neutral-900 disabled:opacity-60"
                      >
                        {currentChat?.loading ? "Analyzing…" : "Send"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
