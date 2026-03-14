"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/apiClient";
import { Loader2, MessageCircle } from "lucide-react";

type Instrument = {
  symbol: string;
  description?: string;
};

type Position = {
  shortQuantity: number;
  averagePrice: number;
  currentDayProfitLoss: number;
  currentDayProfitLossPercentage: number;
  longQuantity: number;
  settledLongQuantity: number;
  settledShortQuantity: number;
  instrument: Instrument;
  marketValue: number;
  maintenanceRequirement: number;
  averageLongPrice?: number | null;
  taxLotAverageLongPrice?: number | null;
  longOpenProfitLoss?: number | null;
  previousSessionLongQuantity?: number | null;
  averageShortPrice?: number | null;
  taxLotAverageShortPrice?: number | null;
  shortOpenProfitLoss?: number | null;
  previousSessionShortQuantity?: number | null;
  currentDayCost: number;
};

type PositionMap = Record<string, Position[]>;

// ---- new chat types ----
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type SymbolChatState = {
  isOpen: boolean;
  loading: boolean;
  error: string | null;
  input: string;
  messages: ChatMessage[];
};

type ChatStateMap = Record<string, SymbolChatState>;
// ------------------------

export function AccountPositionList() {
  const { data: session } = useSession();
  const [positionMap, setPositionMap] = useState<PositionMap | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- new chat state ----
  const [chatBySymbol, setChatBySymbol] = useState<ChatStateMap>({});
  // ------------------------

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
          return;
        }

        const data = (await res.json()) as { schwab_positions: PositionMap };
        setPositionMap(data.schwab_positions);
      } catch {
        setError("Failed to load positions");
        setPositionMap({});
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [session?.accessToken]);

  if (!session?.accessToken) return null;

  const hasNoPositions =
    !loading &&
    positionMap &&
    Object.values(positionMap).every((arr) => arr.length === 0);

  // ---- mock analyze & chat handlers ----

  const handleAnalyzeSymbol = (symbol: string, positions: Position[]) => {
    setChatBySymbol((prev) => {
      const existing = prev[symbol];

      // If already open and has messages, just toggle open/close
      if (existing && existing.isOpen && existing.messages.length > 0) {
        return {
          ...prev,
          [symbol]: { ...existing, isOpen: false },
        };
      }

      const totalQty = positions.reduce(
        (sum, p) => sum + (p.longQuantity - p.shortQuantity),
        0,
      );
      const totalMv = positions.reduce((sum, p) => sum + p.marketValue, 0);

      const introMessage: ChatMessage = {
        id: `assistant-intro-${symbol}`,
        role: "assistant",
        content: `You own ${totalQty} shares of ${symbol} with a total market value of $${totalMv.toLocaleString()}. This is a mock AI insight. In production, I would analyze your risk, concentration, and P/L history for this position.`,
      };

      return {
        ...prev,
        [symbol]: {
          isOpen: true,
          loading: false,
          error: null,
          input: "",
          messages: existing?.messages?.length
            ? existing.messages
            : [introMessage],
        },
      };
    });
  };

  const handleChatInputChange = (symbol: string, value: string) => {
    setChatBySymbol((prev) => ({
      ...prev,
      [symbol]: {
        ...(prev[symbol] ?? {
          isOpen: true,
          loading: false,
          error: null,
          messages: [],
        }),
        input: value,
      },
    }));
  };

  const handleSendMessage = (symbol: string) => {
    setChatBySymbol((prev) => {
      const state = prev[symbol];
      if (!state || !state.input.trim() || state.loading) return prev;

      const userMessage: ChatMessage = {
        id: `user-${symbol}-${Date.now()}`,
        role: "user",
        content: state.input.trim(),
      };

      return {
        ...prev,
        [symbol]: {
          ...state,
          messages: [...state.messages, userMessage],
          input: "",
          loading: true,
          error: null,
        },
      };
    });

    // Fake AI response
    setTimeout(() => {
      setChatBySymbol((prev) => {
        const state = prev[symbol];
        if (!state) return prev;

        const lastUser = [...state.messages]
          .reverse()
          .find((m) => m.role === "user");

        const assistantMessage: ChatMessage = {
          id: `assistant-${symbol}-${Date.now()}`,
          role: "assistant",
          content: lastUser?.content
            ? `Mock AI: “${lastUser.content}” is a great question. In the real app, I’d use your position size, entry price, and volatility to answer this in detail.`
            : "Mock AI: here’s where a detailed analysis of this position would go.",
        };

        return {
          ...prev,
          [symbol]: {
            ...state,
            loading: false,
            messages: [...state.messages, assistantMessage],
          },
        };
      });
    }, 800);
  };

  // --------------------------------------

  return (
    <section className="w-full px-4 py-6">
      <div className="mx-4">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Account positions</h2>
          {loading && (
            <div className="flex items-center gap-2 text-xs text-neutral-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Loading…</span>
            </div>
          )}
        </div>

        {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

        {hasNoPositions && (
          <p className="text-sm text-neutral-400">
            No positions found yet. Once Schwab is connected and you have
            holdings, they’ll appear here.
          </p>
        )}

        {!loading && positionMap && !hasNoPositions && (
          <div className="space-y-6">
            {Object.entries(positionMap).map(([symbol, positions]) => {
              if (!positions || positions.length === 0) return null;

              const chatState = chatBySymbol[symbol];

              return (
                <div
                  key={symbol}
                  className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/60"
                >
                  <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/70 px-4 py-3">
                    <div>
                      <h3 className="text-sm font-semibold">{symbol}</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAnalyzeSymbol(symbol, positions)}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-neutral-700 px-3 py-1 text-[11px] font-medium text-neutral-200 hover:bg-neutral-800"
                    >
                      {chatState?.loading ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Analyzing…
                        </>
                      ) : (
                        <>
                          <MessageCircle className="h-3 w-3" />
                          {chatState?.isOpen ? "Hide insights" : "Analyze"}
                        </>
                      )}
                    </button>
                  </div>

                  <table className="w-full table-fixed text-sm">
                    <thead className="bg-neutral-900 text-neutral-300">
                      <tr>
                        <th className="hidden w-2/5 px-4 py-2 text-left sm:table-cell">
                          Name
                        </th>
                        <th className="w-1/5 px-4 py-2 text-right">Qty</th>
                        <th className="w-1/5 px-4 py-2 text-right">
                          Market value
                        </th>
                        <th className="hidden w-1/5 px-4 py-2 text-right sm:table-cell">
                          Today P/L
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {positions
                        .slice()
                        .sort((a, b) => {
                          const qtyA = a.longQuantity - a.shortQuantity;
                          const qtyB = b.longQuantity - b.shortQuantity;
                          return qtyB - qtyA;
                        })
                        .map((p, idx) => {
                          const qty = p.longQuantity - p.shortQuantity;

                          return (
                            <tr
                              key={`${symbol}-${idx}-${p.longQuantity}-${p.shortQuantity}`}
                              className="border-t border-neutral-800 hover:bg-neutral-800/40"
                            >
                              <td className="hidden w-2/5 px-4 py-2 text-left text-neutral-400 sm:table-cell">
                                {p.instrument.description ?? "EQUITY"}
                              </td>
                              <td className="w-1/5 px-4 py-2 text-right">
                                {qty.toLocaleString()}
                              </td>
                              <td className="w-1/5 px-4 py-2 text-right">
                                ${p.marketValue.toLocaleString()}
                              </td>
                              <td className="hidden w-1/5 px-4 py-2 text-right sm:table-cell">
                                {p.currentDayProfitLoss >= 0 ? "+" : ""}
                                {p.currentDayProfitLoss.toLocaleString()} (
                                {p.currentDayProfitLossPercentage.toFixed(2)}%)
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>

                  {chatState?.isOpen && (
                    <div className="border-t border-neutral-800 bg-neutral-900/60 px-4 py-3 text-xs text-neutral-200">
                      <div className="mb-2 font-semibold text-neutral-100">
                        AI insights for {symbol} (Mock)
                      </div>

                      <div className="mb-3 max-h-100 space-y-2 overflow-y-auto pr-1 scrollbar-dark">
                        {chatState.messages.map((m) => (
                          <div
                            key={m.id}
                            className={
                              m.role === "assistant"
                                ? "flex justify-start"
                                : "flex justify-end"
                            }
                          >
                            <div
                              className={
                                m.role === "assistant"
                                  ? "inline-block max-w-[80%] rounded-lg bg-neutral-800 px-3 py-2 text-neutral-100"
                                  : "inline-block max-w-[80%] rounded-lg bg-neutral-800 px-3 py-2 text-neutral-50"
                              }
                            >
                              {m.content}
                            </div>
                          </div>
                        ))}
                      </div>

                      {chatState.error && (
                        <div className="mb-2 rounded-md bg-red-900/40 px-2 py-1 text-[11px] text-red-300">
                          {chatState.error}
                        </div>
                      )}

                      <form
                        className="flex items-center gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSendMessage(symbol);
                        }}
                      >
                        <input
                          type="text"
                          value={chatState.input}
                          onChange={(e) =>
                            handleChatInputChange(symbol, e.target.value)
                          }
                          className="h-8 flex-1 rounded-full border border-neutral-700 bg-neutral-950 px-3 text-[11px] text-neutral-100 outline-none placeholder:text-neutral-500 focus:border-neutral-400"
                          placeholder={`Ask a question about your ${symbol} position…`}
                        />
                        <button
                          type="submit"
                          disabled={
                            chatState.loading || !chatState.input.trim()
                          }
                          className="inline-flex h-8 items-center rounded-full bg-neutral-100 px-3 text-[11px] font-medium text-neutral-900 disabled:opacity-60"
                        >
                          Send
                        </button>
                      </form>

                      <p className="mt-1 text-[10px] text-neutral-500">
                        Mock demo only. In production, this would call your AI
                        backend with this position and conversation history.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
