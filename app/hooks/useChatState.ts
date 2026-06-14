"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import {
  streamAnalysis,
  streamPlaybookAsk,
  streamResearchChat,
} from "@/lib/apiClient";
import type {
  ChatStateMap,
  SymbolChatState,
} from "@/app/contexts/positionsContextTypes";
import type { ChatContextValue } from "@/app/contexts/chatContextTypes";
import {
  chatFailureMessage,
  chatSessionRequestFields,
  createStreamingAssistantUpdater,
} from "@/lib/chatStreaming";
import { playbookAskDisplayLabel, playbookActionAskable } from "@/lib/strategyPlaybook";
import type { ChatMessage } from "@/components/ConversationPane";
import {
  clearModelMenuOpenBlock,
  markModelMenuDismissed,
  shouldBlockModelMenuOpen,
} from "@/lib/chatModelMenu";
import {
  clampChatModelForPlan,
  normalizeChatModelId,
  resolveChatModelForPlan,
} from "@/lib/chatModels";
import { useAccountPlan } from "@/app/hooks/useAccountPlan";
import {
  loadPersistedChat,
  persistChatState,
} from "@/lib/chatPersistence";
import { formatQuickActionMessage, getQuickActionApiAction, isFreeFormQuickAction, isStructuredAnalyzeAction } from "@/lib/quickActions";
import { openAssistantChat } from "@/lib/scrollToChat";
import { buildStructuredAnalyzeRequest } from "@/lib/structuredAnalysis";
import {
  requestPortfolioAnalysis,
  requestPositionAnalysis,
} from "@/lib/positionAnalysis";
import type { SchwabAccounts } from "@/app/types/schwab";
import {
  loadChatHistoryForKey,
  shouldApplyServerHistory,
  clearChatHistoryForKey,
  loadChatSessionById,
} from "@/lib/chatHistory";
import type { MainView } from "@/components/NavList";

const PERSIST_DEBOUNCE_MS = 500;

export type UseChatStateParams = {
  accessToken: string;
  chatUserId: string | null;
  account: SchwabAccounts | null;
};

export function useChatState({
  accessToken,
  chatUserId,
  account,
}: UseChatStateParams): ChatContextValue {
  const [chatBySymbol, setChatBySymbol] = useState<ChatStateMap>({});
  const chatHydratedUserRef = useRef<string | null>(null);
  const chatBySymbolRef = useRef(chatBySymbol);
  const persistTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serverHydrateInflightRef = useRef<Set<string>>(new Set());
  chatBySymbolRef.current = chatBySymbol;
  const { plan, loading: planLoading } = useAccountPlan(accessToken);

  const resolveChatModel = useCallback(
    (model: string | undefined | null) => {
      if (planLoading) return normalizeChatModelId(model, plan);
      return resolveChatModelForPlan(model, plan);
    },
    [plan, planLoading],
  );

  const ensureSymbolChatState = useCallback(
    (_key: string, base?: Partial<SymbolChatState>): SymbolChatState => ({
      loading: false,
      input: "",
      messages: [],
      modelMenuOpen: false,
      ...base,
      model: resolveChatModel(base?.model),
    }),
    [resolveChatModel],
  );

  const setChatModel = useCallback(
    (activeChatKey: string, model: string) => {
      if (activeChatKey === "__NONE__") return;

      const resolvedModel = planLoading
        ? normalizeChatModelId(model, plan)
        : clampChatModelForPlan(model, plan);
      clearModelMenuOpenBlock();

      setChatBySymbol((prev) => {
        const existing = prev[activeChatKey];
        const nextState: SymbolChatState = existing
          ? {
              ...existing,
              model: resolvedModel,
              modelMenuOpen: false,
            }
          : {
              ...ensureSymbolChatState(activeChatKey),
              model: resolvedModel,
              modelMenuOpen: false,
            };

        const next = {
          ...prev,
          [activeChatKey]: nextState,
        };

        if (chatUserId) {
          persistChatState(chatUserId, next);
        }

        return next;
      });
    },
    [chatUserId, ensureSymbolChatState, plan, planLoading],
  );

  const setChatModelMenuOpen = useCallback(
    (activeChatKey: string, open: boolean) => {
      if (activeChatKey === "__NONE__") return;
      if (open && shouldBlockModelMenuOpen()) return;

      setChatBySymbol((prev) => {
        const existing = prev[activeChatKey];
        if (existing?.modelMenuOpen === open) return prev;

        const nextState: SymbolChatState = existing
          ? { ...existing, modelMenuOpen: open }
          : ensureSymbolChatState(activeChatKey, { modelMenuOpen: open });

        return {
          ...prev,
          [activeChatKey]: nextState,
        };
      });
    },
    [ensureSymbolChatState],
  );

  const closeAllChatModelMenus = useCallback(() => {
    markModelMenuDismissed();
    setChatBySymbol((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const [key, state] of Object.entries(next)) {
        if (!state?.modelMenuOpen) continue;
        next[key] = { ...state, modelMenuOpen: false };
        changed = true;
      }

      return changed ? next : prev;
    });
  }, []);

  useEffect(() => {
    if (!chatUserId) {
      chatHydratedUserRef.current = null;
      return;
    }

    if (chatHydratedUserRef.current === chatUserId) return;

    const loaded = loadPersistedChat(chatUserId);
    if (Object.keys(loaded).length === 0) {
      chatHydratedUserRef.current = chatUserId;
      return;
    }

    setChatBySymbol((prev) => {
      const merged = { ...prev };
      for (const [key, saved] of Object.entries(loaded)) {
        merged[key] = ensureSymbolChatState(key, {
          ...merged[key],
          ...saved,
        });
      }
      return merged;
    });
    chatHydratedUserRef.current = chatUserId;
  }, [chatUserId, ensureSymbolChatState]);

  useEffect(() => {
    if (planLoading) return;

    setChatBySymbol((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const [key, state] of Object.entries(prev)) {
        const resolved = resolveChatModelForPlan(state.model, plan);
        if (state.model !== resolved) {
          next[key] = { ...state, model: resolved };
          changed = true;
        }
      }

      if (changed && chatUserId) {
        persistChatState(chatUserId, next);
      }

      return changed ? next : prev;
    });
  }, [chatUserId, plan, planLoading]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: chatBySymbol intentionally triggers debounced persistence through chatBySymbolRef.
  useEffect(() => {
    if (!chatUserId || chatHydratedUserRef.current !== chatUserId) return;

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
      if (chatHydratedUserRef.current !== chatUserId) return;
      persistChatState(chatUserId, chatBySymbolRef.current);
    };

    window.addEventListener("beforeunload", flushPersist);
    return () => {
      window.removeEventListener("beforeunload", flushPersist);
      flushPersist();
    };
  }, [chatUserId]);

  const hydrateChatFromServer = useCallback(
    async (activeChatKey: string, selectedView?: MainView) => {
      if (!accessToken || activeChatKey === "__NONE__") return;
      if (serverHydrateInflightRef.current.has(activeChatKey)) return;

      const currentState =
        chatBySymbolRef.current[activeChatKey] ??
        ensureSymbolChatState(activeChatKey);
      if (currentState.loading) return;
      if (currentState.pendingNewChatSession) return;

      serverHydrateInflightRef.current.add(activeChatKey);
      try {
        const loaded = currentState.sessionId
          ? await loadChatSessionById(
              accessToken,
              activeChatKey,
              currentState.sessionId,
            )
          : currentState.messages.length === 0 && currentState.historyHydrated
            ? null
            : await loadChatHistoryForKey(
                accessToken,
                activeChatKey,
                selectedView,
              );
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

  const restoreChatSession = useCallback(
    (
      activeChatKey: string,
      sessionId: string,
      messages: ChatMessage[],
    ) => {
      if (activeChatKey === "__NONE__") return;
      setChatBySymbol((prev) => ({
        ...prev,
        [activeChatKey]: {
          ...ensureSymbolChatState(activeChatKey, prev[activeChatKey]),
          messages,
          sessionId,
          pendingNewChatSession: false,
          historyHydrated: true,
          loading: false,
          historyRevision:
            (ensureSymbolChatState(activeChatKey, prev[activeChatKey])
              .historyRevision ?? 0) + 1,
        },
      }));
    },
    [ensureSymbolChatState],
  );

  const startNewChatSession = useCallback(
    (activeChatKey: string) => {
      if (activeChatKey === "__NONE__") return;

      serverHydrateInflightRef.current.delete(activeChatKey);
      setChatBySymbol((prev) => {
        const prevState = ensureSymbolChatState(activeChatKey, prev[activeChatKey]);
        return {
          ...prev,
          [activeChatKey]: ensureSymbolChatState(activeChatKey, {
            ...prevState,
            messages: [],
            input: "",
            loading: false,
            modelMenuOpen: false,
            sessionId: null,
            pendingNewChatSession: true,
            historyHydrated: true,
            historyRevision: (prevState.historyRevision ?? 0) + 1,
          }),
        };
      });
    },
    [ensureSymbolChatState],
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
          ...(chatBySymbolRef.current[activeChatKey] ?? {}),
          messages: [],
          input: "",
          loading: false,
          modelMenuOpen: false,
          sessionId: null,
          pendingNewChatSession: false,
          historyHydrated: true,
          historyRevision:
            (chatBySymbolRef.current[activeChatKey]?.historyRevision ?? 0) + 1,
        }),
      }));
      return true;
    },
    [accessToken, ensureSymbolChatState],
  );

  const sendPrompt: ChatContextValue["sendPrompt"] = useCallback(
    async ({
      activeChatKey,
      selectedView,
      selectedSymbol,
      positionsForSelectedSymbol,
      prompt,
      displayMessage,
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
      const chatDisplay =
        (displayMessage ?? userInput).trim() || userInput;

      setChatBySymbol((prev) => {
        const prevState = ensureSymbolChatState(
          activeChatKey,
          prev[activeChatKey],
        );
        const userMessage: ChatMessage = {
          id: `user-${activeChatKey}-${Date.now()}`,
          role: "user",
          content: chatDisplay,
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
      openAssistantChat();

      const symbolForApi =
        selectedView === "portfolio"
          ? selectedSymbol
          : selectedView === "research"
            ? selectedSymbol
            : (selectedSymbol ?? "UNKNOWN");

      const hasHoldingsContext = !!(positionsForSelectedSymbol?.length ?? 0);
      track("ai_message_sent", {
        view: selectedView,
        symbol: symbolForApi,
        has_holdings: hasHoldingsContext,
      });

      const streamer = createStreamingAssistantUpdater(
        activeChatKey,
        setChatBySymbol,
        ensureSymbolChatState,
      );
      streamer.beginAssistantMessage();

      const chatSessionFields = chatSessionRequestFields(state);
      let chatSessionId: string | null = null;

      try {
        if (hasHoldingsContext && !account) {
          throw new Error("Account data is not loaded yet.");
        }

        if (selectedView === "research" && !hasHoldingsContext) {
          if (!symbolForApi) return;

          ({ chatSessionId } = await streamResearchChat(
            {
              symbol: symbolForApi,
              prompt: userInput,
              model: state.model,
              ...chatSessionFields,
            },
            accessToken,
            streamer.appendChunk,
          ));
        } else {
          ({ chatSessionId } = await streamAnalysis(
            {
              account: account,
              positions: positionsForSelectedSymbol ?? [],
              symbol: symbolForApi,
              action: "free-form",
              prompt: userInput,
              user_display_message: chatDisplay,
              model: state.model,
              session_id: state.sessionId ?? undefined,
              ...chatSessionFields,
            },
            accessToken,
            streamer.appendChunk,
          ));
        }

        if (!streamer.assistantContent.current.trim()) {
          streamer.appendChunk(
            "Sorry, I didn't get a response back. Please try again or rephrase your question.",
          );
        }

        streamer.flushNow();

        if (chatSessionId) {
          setChatBySymbol((prev) => {
            const prevState = ensureSymbolChatState(
              activeChatKey,
              prev[activeChatKey],
            );
            return {
              ...prev,
              [activeChatKey]: {
                ...prevState,
                sessionId: chatSessionId,
                pendingNewChatSession: false,
                historyRevision: (prevState.historyRevision ?? 0) + 1,
              },
            };
          });
        }

        await hydrateChatFromServer(activeChatKey, selectedView);
      } catch (err) {
        console.error("Chat prompt failed:", err);
        setChatBySymbol((prev) => {
          const prevState = ensureSymbolChatState(
            activeChatKey,
            prev[activeChatKey],
          );
          const hasHoldingsContext = !!(positionsForSelectedSymbol?.length ?? 0);
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
                  content: chatFailureMessage(selectedView, hasHoldingsContext),
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

  const sendPlaybookAsk: ChatContextValue["sendPlaybookAsk"] = useCallback(
    async ({ activeChatKey, action, strategy }) => {
      if (!accessToken) return;
      if (!playbookActionAskable(action)) return;
      if (activeChatKey === "__NONE__") return;

      const symbol = action.symbol?.trim().toUpperCase();
      if (!symbol || !strategy) return;

      const state =
        chatBySymbol[activeChatKey] ?? ensureSymbolChatState(activeChatKey);
      if (state.loading) return;

      const displayMessage = playbookAskDisplayLabel(action);

      setChatBySymbol((prev) => {
        const prevState = ensureSymbolChatState(
          activeChatKey,
          prev[activeChatKey],
        );
        const userMessage: ChatMessage = {
          id: `user-${activeChatKey}-${Date.now()}`,
          role: "user",
          content: displayMessage,
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
      openAssistantChat();

      const streamer = createStreamingAssistantUpdater(
        activeChatKey,
        setChatBySymbol,
        ensureSymbolChatState,
      );
      streamer.beginAssistantMessage();

      const chatSessionFields = chatSessionRequestFields(state);
      let chatSessionId: string | null = null;

      try {
        ({ chatSessionId } = await streamPlaybookAsk(
          {
            symbol,
            actionType: action.type,
            actionTitle: action.title,
            actionReason: action.reason,
            strategy,
            model: state.model,
            ...chatSessionFields,
          },
          accessToken,
          streamer.appendChunk,
        ));

        if (!streamer.assistantContent.current.trim()) {
          streamer.appendChunk(
            "Sorry, I didn't get a response back. Please try again or rephrase your question.",
          );
        }

        streamer.flushNow();

        if (chatSessionId) {
          setChatBySymbol((prev) => {
            const prevState = ensureSymbolChatState(
              activeChatKey,
              prev[activeChatKey],
            );
            return {
              ...prev,
              [activeChatKey]: {
                ...prevState,
                sessionId: chatSessionId,
                pendingNewChatSession: false,
                historyRevision: (prevState.historyRevision ?? 0) + 1,
              },
            };
          });
        }

        await hydrateChatFromServer(activeChatKey, "research");
      } catch (err) {
        console.error("Playbook ask failed:", err);
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
                    "Sorry, I couldn't complete that playbook question. Please try again.",
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
    [accessToken, chatBySymbol, ensureSymbolChatState, hydrateChatFromServer],
  );

  const sendQuickAction: ChatContextValue["sendQuickAction"] = useCallback(
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

      if (isStructuredAnalyzeAction(actionId)) {
        if (selectedView === "portfolio") {
          requestPortfolioAnalysis();
        } else {
          requestPositionAnalysis(selectedSymbol ?? undefined);
        }
        return;
      }

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
      openAssistantChat();

      const symbolForApi =
        selectedView === "portfolio"
          ? null
          : selectedView === "research"
            ? selectedSymbol
            : (selectedSymbol ?? "UNKNOWN");

      track("quick_action_used", {
        action_id: actionId,
        view: selectedView,
        symbol: symbolForApi,
      });

      const structuredAnalyze = isStructuredAnalyzeAction(actionId);
      const freeForm = isFreeFormQuickAction(actionId);

      const streamer = createStreamingAssistantUpdater(
        activeChatKey,
        setChatBySymbol,
        ensureSymbolChatState,
        actionId,
      );
      streamer.beginAssistantMessage();

      const chatSessionFields = chatSessionRequestFields(state);
      let chatSessionId: string | null = null;

      try {
        const hasHoldingsContext = !!(positionsForSelectedSymbol?.length ?? 0);

        if (hasHoldingsContext && !account) {
          throw new Error("Account data is not loaded yet.");
        }

        if (selectedView === "research" && !hasHoldingsContext) {
          if (!symbolForApi) return;

          ({ chatSessionId } = await streamResearchChat(
            {
              symbol: symbolForApi,
              prompt: userMessage.content,
              model: state.model,
              ...chatSessionFields,
            },
            accessToken,
            streamer.appendChunk,
          ));
        } else {
          const analysisBody =
            structuredAnalyze && account
              ? buildStructuredAnalyzeRequest({
                  account,
                  positions: positionsForSelectedSymbol ?? [],
                  symbol: symbolForApi,
                  userDisplayMessage: userMessage.content,
                })
              : {
                  account: account,
                  positions: positionsForSelectedSymbol ?? [],
                  symbol: symbolForApi,
                  action:
                    freeForm ? "free-form" : getQuickActionApiAction(actionId),
                  prompt: freeForm ? userMessage.content : null,
                  user_display_message: userMessage.content,
                  model: state.model,
                  session_id: state.sessionId ?? undefined,
                  ...chatSessionFields,
                };

          ({ chatSessionId } = await streamAnalysis(
            analysisBody,
            accessToken,
            streamer.appendChunk,
          ));
        }

        if (!streamer.assistantContent.current.trim()) {
          streamer.appendChunk(
            "Sorry, I didn't get a response back. Please try again or rephrase your question.",
          );
        }

        streamer.flushNow();

        if (chatSessionId) {
          setChatBySymbol((prev) => {
            const prevState = ensureSymbolChatState(
              activeChatKey,
              prev[activeChatKey],
            );
            return {
              ...prev,
              [activeChatKey]: {
                ...prevState,
                sessionId: chatSessionId,
                pendingNewChatSession: false,
                historyRevision: (prevState.historyRevision ?? 0) + 1,
              },
            };
          });
        }

        await hydrateChatFromServer(activeChatKey, selectedView);
      } catch (err) {
        console.error("Chat quick action failed:", err);
        setChatBySymbol((prev) => {
          const prevState = ensureSymbolChatState(
            activeChatKey,
            prev[activeChatKey],
          );
          const hasHoldingsContext = !!(positionsForSelectedSymbol?.length ?? 0);
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
                  content: chatFailureMessage(selectedView, hasHoldingsContext),
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
  return {
    chatBySymbol,
    setChatBySymbol,
    ensureSymbolChatState,
    setChatModel,
    setChatModelMenuOpen,
    closeAllChatModelMenus,
    sendPrompt,
    sendPlaybookAsk,
    sendQuickAction,
    hydrateChatFromServer,
    restoreChatSession,
    startNewChatSession,
    clearChatHistory,
  };
}
