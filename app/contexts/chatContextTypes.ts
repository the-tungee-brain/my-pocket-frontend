import type { ChatMessage } from "@/components/ConversationPane";
import type { MainView } from "@/components/NavList";
import type { InvestmentStrategy, StrategyNextAction } from "@/app/types/strategy";
import type { ChatStateMap, SymbolChatState } from "@/app/contexts/positionsContextTypes";
import type { Position } from "@/app/types/schwab";

export type ChatContextValue = {
  chatBySymbol: ChatStateMap;
  setChatBySymbol: React.Dispatch<React.SetStateAction<ChatStateMap>>;
  ensureSymbolChatState: (
    key: string,
    base?: Partial<SymbolChatState>,
  ) => SymbolChatState;
  setChatModel: (activeChatKey: string, model: string) => void;
  setChatModelMenuOpen: (activeChatKey: string, open: boolean) => void;
  closeAllChatModelMenus: () => void;
  sendPrompt: (opts: {
    activeChatKey: string;
    selectedView: MainView;
    selectedSymbol: string | null;
    positionsForSelectedSymbol: Position[] | null;
    prompt: string;
  }) => Promise<void>;
  sendPlaybookAsk: (opts: {
    activeChatKey: string;
    action: StrategyNextAction;
    strategy: InvestmentStrategy | null;
  }) => Promise<void>;
  sendQuickAction: (opts: {
    activeChatKey: string;
    selectedView: MainView;
    selectedSymbol: string | null;
    positionsForSelectedSymbol: Position[] | null;
    actionId: string;
  }) => Promise<void>;
  hydrateChatFromServer: (
    activeChatKey: string,
    selectedView?: MainView,
  ) => Promise<void>;
  restoreChatSession: (
    activeChatKey: string,
    sessionId: string,
    messages: ChatMessage[],
  ) => void;
  startNewChatSession: (activeChatKey: string) => void;
  clearChatHistory: (activeChatKey: string) => Promise<boolean>;
};
