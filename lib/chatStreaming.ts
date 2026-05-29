import { flushSync } from "react-dom";
import type { MainView } from "@/components/NavList";
import type {
  ChatStateMap,
  SymbolChatState,
} from "@/app/contexts/positionsContextTypes";

export type SetChatBySymbol = React.Dispatch<React.SetStateAction<ChatStateMap>>;

export function chatSessionRequestFields(state: SymbolChatState) {
  return {
    chat_session_id: state.pendingNewChatSession
      ? undefined
      : (state.sessionId ?? undefined),
    new_chat_session: state.pendingNewChatSession ?? false,
  };
}

export function createStreamingAssistantUpdater(
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

  const flush = () => {
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

  const beginAssistantMessage = () => {
    flushSync(() => {
      setChatBySymbol((prev) => {
        const prevState = ensureSymbolChatState(activeChatKey, prev[activeChatKey]);
        const alreadyPresent = prevState.messages.some(
          (message) => message.id === assistantId,
        );
        if (alreadyPresent) {
          return prev;
        }

        return {
          ...prev,
          [activeChatKey]: {
            ...prevState,
            messages: [
              ...prevState.messages,
              {
                id: assistantId,
                role: "assistant",
                content: "",
              },
            ],
            loading: true,
          },
        };
      });
    });
  };

  const appendChunk = (chunk: string) => {
    if (!chunk) return;
    assistantContent.current += chunk;
    flush();
  };

  const flushNow = () => {
    flush();
  };

  return { appendChunk, beginAssistantMessage, flushNow, assistantContent };
}

export function chatFailureMessage(
  selectedView: MainView,
  hasHoldingsContext: boolean,
): string {
  if (hasHoldingsContext) {
    return "Sorry, something went wrong while analyzing this position.";
  }
  if (selectedView === "research") {
    return "Sorry, something went wrong while researching this stock.";
  }
  return "Sorry, something went wrong while analyzing your portfolio.";
}
