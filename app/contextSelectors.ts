"use client";

import { useMemo } from "react";
import { usePositionsContext } from "@/app/Providers";
import type { PositionsContextValue } from "@/app/contexts/positionsContextTypes";
import type { ChatContextValue } from "@/app/contexts/chatContextTypes";

export type PortfolioContextValue = Pick<
  PositionsContextValue,
  | "sessionAccessToken"
  | "loading"
  | "error"
  | "positionMap"
  | "symbols"
  | "allPositions"
  | "selectedSymbol"
  | "setSelectedSymbol"
  | "selectedView"
  | "setSelectedView"
  | "positionsForSelectedSymbol"
  | "account"
  | "cashSecuredPutSummary"
  | "assignmentRiskSummary"
  | "recentActivity"
  | "proactiveAlerts"
  | "portfolioBrief"
  | "portfolioMetrics"
  | "positionsDataFreshness"
  | "positionsLastSyncedAt"
  | "refreshPositions"
  | "clearPortfolioData"
  | "schwabReauth"
  | "clearSchwabReauth"
>;

export function usePortfolioContext(): PortfolioContextValue {
  const ctx = usePositionsContext();
  return useMemo(
    () => ({
      sessionAccessToken: ctx.sessionAccessToken,
      loading: ctx.loading,
      error: ctx.error,
      positionMap: ctx.positionMap,
      symbols: ctx.symbols,
      allPositions: ctx.allPositions,
      selectedSymbol: ctx.selectedSymbol,
      setSelectedSymbol: ctx.setSelectedSymbol,
      selectedView: ctx.selectedView,
      setSelectedView: ctx.setSelectedView,
      positionsForSelectedSymbol: ctx.positionsForSelectedSymbol,
      account: ctx.account,
      cashSecuredPutSummary: ctx.cashSecuredPutSummary,
      assignmentRiskSummary: ctx.assignmentRiskSummary,
      recentActivity: ctx.recentActivity,
      proactiveAlerts: ctx.proactiveAlerts,
      portfolioBrief: ctx.portfolioBrief,
      portfolioMetrics: ctx.portfolioMetrics,
      positionsDataFreshness: ctx.positionsDataFreshness,
      positionsLastSyncedAt: ctx.positionsLastSyncedAt,
      refreshPositions: ctx.refreshPositions,
      clearPortfolioData: ctx.clearPortfolioData,
      schwabReauth: ctx.schwabReauth,
      clearSchwabReauth: ctx.clearSchwabReauth,
    }),
    [ctx],
  );
}

export function useAppChatContext(): ChatContextValue {
  const ctx = usePositionsContext();
  return useMemo(
    () => ({
      chatBySymbol: ctx.chatBySymbol,
      setChatBySymbol: ctx.setChatBySymbol,
      ensureSymbolChatState: ctx.ensureSymbolChatState,
      setChatModel: ctx.setChatModel,
      setChatModelMenuOpen: ctx.setChatModelMenuOpen,
      closeAllChatModelMenus: ctx.closeAllChatModelMenus,
      sendPrompt: ctx.sendPrompt,
      sendPlaybookAsk: ctx.sendPlaybookAsk,
      sendQuickAction: ctx.sendQuickAction,
      hydrateChatFromServer: ctx.hydrateChatFromServer,
      restoreChatSession: ctx.restoreChatSession,
      startNewChatSession: ctx.startNewChatSession,
      clearChatHistory: ctx.clearChatHistory,
    }),
    [ctx],
  );
}
