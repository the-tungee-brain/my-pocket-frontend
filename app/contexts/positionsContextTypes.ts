import type { ReactNode } from "react";
import type { ChatMessage } from "@/components/ConversationPane";
import type { PositionMap } from "@/components/AccountPositionList";
import type { MainView } from "@/components/NavList";
import type { InvestmentStrategy, StrategyNextAction } from "@/app/types/strategy";
import type { ProactiveAlert, PortfolioIntelligence } from "@/app/types/intelligence";
import type { SchwabReauthDetail } from "@/lib/schwabReauth";
import type {
  AssignmentRiskSummary,
  CashSecuredPutSummary,
  PortfolioMetrics,
  PositionsDataFreshness,
  Position,
  RecentActivitySummary,
  SchwabAccounts,
} from "@/app/types/schwab";

export type SymbolChatState = {
  loading: boolean;
  input: string;
  messages: ChatMessage[];
  model: string;
  modelMenuOpen: boolean;
  sessionId?: string | null;
  historyHydrated?: boolean;
  pendingNewChatSession?: boolean;
  historyRevision?: number;
};

export type ChatStateMap = Record<string, SymbolChatState>;

export type PositionsContextValue = {
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
  account: SchwabAccounts | null;
  cashSecuredPutSummary: CashSecuredPutSummary | null;
  assignmentRiskSummary: AssignmentRiskSummary | null;
  recentActivity: RecentActivitySummary | null;
  proactiveAlerts: ProactiveAlert[];
  portfolioBrief: PortfolioIntelligence | null;
  portfolioMetrics: PortfolioMetrics | null;
  positionsDataFreshness: PositionsDataFreshness | null;
  positionsLastSyncedAt?: number | null;
  refreshPositions: (refresh?: boolean) => Promise<void>;
  clearPortfolioData: () => void;
  schwabReauth: SchwabReauthDetail | null;
  clearSchwabReauth: () => void;
};

export type PositionsProviderProps = { children: ReactNode };
