"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { SchwabConnectCard } from "@/components/SchwabConnectCard";
import { apiFetch } from "@/lib/apiClient";
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

  const handleSendMessage = () => {
    if (!selectedSymbol) return;

    const symbolForTimeout = selectedSymbol;

    setChatBySymbol((prev) => {
      const state = ensureSymbolChatState(
        symbolForTimeout,
        prev[symbolForTimeout],
      );
      const trimmed = state.input.trim();
      if (!trimmed || state.loading) return prev;

      const userMessage: ChatMessage = {
        id: `user-${symbolForTimeout}-${Date.now()}`,
        role: "user",
        content: trimmed,
      };

      return {
        ...prev,
        [symbolForTimeout]: {
          ...state,
          messages: [...state.messages, userMessage],
          input: "",
          loading: true,
        },
      };
    });

    setInputRows(MIN_ROWS);

    setTimeout(() => {
      setChatBySymbol((prev) => {
        const state = prev[symbolForTimeout];
        if (!state) return prev;

        const lastUser = [...state.messages]
          .reverse()
          .find((m) => m.role === "user");

        const assistantMessage: ChatMessage = {
          id: `assistant-${symbolForTimeout}-${Date.now()}`,
          role: "assistant",
          content: lastUser?.content
            ? `Mock AI: “${lastUser.content}” is a great question. In a real app, I’d use your ${symbolForTimeout} position, entries, and volatility to answer in depth.`
            : "Mock AI: here’s where a detailed analysis of this position would go.",
        };

        return {
          ...prev,
          [symbolForTimeout]: {
            ...state,
            loading: false,
            messages: [...state.messages, assistantMessage],
          },
        };
      });
    }, 800);
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

  const currentChat = selectedSymbol ? chatBySymbol[selectedSymbol] : undefined;

  useEffect(() => {
    if (!currentChat?.messages.length) return;
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentChat?.messages.length, selectedSymbol]);

  return (
    <main className="flex min-h-screen text-neutral-50">
      <aside className="sticky top-0 flex h-screen w-56 flex-col border-r border-border bg-secondary">
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

      <section className="flex min-h-screen flex-1 flex-col">
        <div className="border-b border-border px-4 py-3 bg-secondary">
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
                  <div className="mx-auto mt-4 max-w-4xl rounded-2xl px-4 py-3 text-sm">
                    <div className="mb-2 text-xs font-semibold text-foreground">
                      Conversation for {selectedSymbol} (Mock)
                    </div>
                    <div className="space-y-2 pr-1">
                      {(currentChat?.messages ?? []).map((m) => (
                        <div
                          key={m.id}
                          className={
                            m.role === "assistant"
                              ? "flex justify-start"
                              : "flex justify-end"
                          }
                        >
                          <div className="inline-block max-w-[80%] rounded-lg bg-neutral-800 px-3 py-2 text-foreground">
                            {m.content}
                          </div>
                        </div>
                      ))}
                      <div ref={conversationEndRef} />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {selectedSymbol && (
            <div className="sticky bottom-0 z-20 px-4 pb-4 pt-3 scrollbar-dark">
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-2 rounded-2xl border border-border bg-secondary p-4">
                <div className="flex flex-col">
                  <form
                    className="flex flex-col gap-3 text-foreground"
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                  >
                    <textarea
                      rows={inputRows}
                      className="w-full resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-neutral-500"
                      placeholder={`Ask anything about your ${selectedSymbol} position…`}
                      value={currentChat?.input ?? ""}
                      onChange={(e) => handleChatInputChange(e.target.value)}
                    />

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={
                          currentChat?.loading ||
                          !(currentChat?.input ?? "").trim()
                        }
                        className="rounded-full bg-foreground px-3 py-1 text-xs font-medium text-neutral-900 disabled:opacity-60"
                      >
                        Send
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
