"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import type { PositionsContextValue } from "@/app/contexts/positionsContextTypes";
import type { PortfolioContextValue } from "@/app/contexts/portfolioContextTypes";
import {
  PortfolioContextProvider,
  usePortfolioContext,
} from "@/app/contexts/PortfolioContext";
import { ChatProvider, useChatContext } from "@/app/contexts/ChatProvider";
import { useAccountPositionsQuery } from "@/app/hooks/useAccountPositionsQuery";
import { parsePositionsSyncedAt } from "@/lib/dataFreshness";
import { summarizeCspCashReserves } from "@/lib/cspReservedCash";
import type { SchwabReauthDetail } from "@/lib/schwabReauth";
import { Position } from "./types/schwab";
import { MainView } from "@/components/NavList";
import { usePathname } from "next/navigation";

const PositionsContext = createContext<PositionsContextValue | null>(null);

export type {
  ChatStateMap,
  PositionsContextValue,
  SymbolChatState,
} from "@/app/contexts/positionsContextTypes";
export type { ChatContextValue } from "@/app/contexts/chatContextTypes";
export type { PortfolioContextValue } from "@/app/contexts/portfolioContextTypes";

export function usePositionsContext() {
  const ctx = useContext(PositionsContext);
  if (!ctx)
    throw new Error(
      "usePositionsContext must be used within PositionsProvider",
    );
  return ctx;
}

function PositionsContextBridge({ children }: { children: React.ReactNode }) {
  const portfolio = usePortfolioContext();
  const chat = useChatContext();

  const value: PositionsContextValue = useMemo(
    () => ({
      ...portfolio,
      ...chat,
    }),
    [portfolio, chat],
  );

  return (
    <PositionsContext.Provider value={value}>
      {children}
    </PositionsContext.Provider>
  );
}

export function PositionsProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [selectedView, setSelectedView] = useState<MainView>("research");
  const [schwabReauth, setSchwabReauth] = useState<SchwabReauthDetail | null>(
    null,
  );
  const [positionsError, setPositionsError] = useState<string | null>(null);
  const accessToken = session?.accessToken ?? "";
  const chatUserId = session?.user?.email ?? session?.user?.id ?? null;
  const {
    data: positionsData,
    loading,
    error: positionsQueryError,
    refreshPositions,
    reset: resetPositionsQuery,
  } = useAccountPositionsQuery(accessToken, {
    enabled: Boolean(accessToken),
    onReauth: (detail) => {
      setSchwabReauth(detail);
      setPositionsError(detail.message);
    },
    onClearReauth: () => {
      setSchwabReauth(null);
      setPositionsError(null);
    },
  });

  const positionMap = positionsData?.schwab_positions ?? {};
  const account = positionsData?.account ?? null;
  const flatPositions = useMemo(
    () =>
      Object.values(positionMap).flat().filter(Boolean) as Position[],
    [positionMap],
  );
  const cashBalance =
    account?.securitiesAccount.currentBalances.cashBalance ?? null;
  const cashSecuredPutSummary =
    positionsData?.cashSecuredPutSummary ??
    summarizeCspCashReserves(flatPositions, cashBalance);
  const assignmentRiskSummary = positionsData?.assignmentRiskSummary ?? null;
  const recentActivity = positionsData?.recentActivity ?? null;
  const proactiveAlerts = positionsData?.proactiveAlerts ?? [];
  const portfolioBrief = positionsData?.portfolioBrief ?? null;
  const portfolioMetrics = positionsData?.portfolioMetrics ?? null;
  const positionsDataFreshness = positionsData?.dataFreshness ?? null;
  const positionsLastSyncedAt = useMemo(() => {
    const syncedMs = parsePositionsSyncedAt(
      positionsData?.dataFreshness?.positionsSyncedAt,
    );
    return syncedMs ?? null;
  }, [positionsData?.dataFreshness?.positionsSyncedAt]);

  const error =
    schwabReauth?.message ?? positionsError ?? positionsQueryError ?? null;

  useEffect(() => {
    const symbolsOnly = Object.keys(positionMap).sort();
    if (symbolsOnly.length === 0) return;
    setSelectedSymbol((current) =>
      current && symbolsOnly.includes(current)
        ? current
        : (symbolsOnly[0] ?? null),
    );
  }, [positionMap]);

  const clearPortfolioData = useCallback(() => {
    setSchwabReauth(null);
    setPositionsError(null);
    resetPositionsQuery();
    setSelectedSymbol(null);
  }, [resetPositionsQuery]);

  const refreshPositionsSafe = useCallback(
    async (refresh = false) => {
      try {
        setPositionsError(null);
        await refreshPositions(refresh);
      } catch (err) {
        const apiErr = err as Error & { reauth?: SchwabReauthDetail | null };
        if (!apiErr.reauth?.reauthRequired) {
          setPositionsError("Failed to load positions");
        }
      }
    },
    [refreshPositions],
  );

  useEffect(() => {
    if (!pathname) return;

    const segments = pathname.split("/").filter(Boolean);
    const first = segments[0];

    if (first === "research") {
      setSelectedView("research");
    } else if (first === "portfolio") {
      setSelectedView(segments[1] === "positions" ? "symbol" : "portfolio");
    } else {
      setSelectedView("research");
    }
  }, [pathname]);

  const allPositions: Position[] = useMemo(
    () => Object.values(positionMap).flat().filter(Boolean) as Position[],
    [positionMap],
  );

  const symbols = useMemo(() => Object.keys(positionMap).sort(), [positionMap]);

  const positionsForSelectedSymbol: Position[] | null = useMemo(() => {
    if (selectedView === "portfolio") return allPositions;
    if (!selectedSymbol) return null;
    return positionMap[selectedSymbol] ?? null;
  }, [selectedView, selectedSymbol, positionMap, allPositions]);

  const portfolioValue: PortfolioContextValue = useMemo(
    () => ({
      sessionAccessToken: accessToken,
      loading,
      error,
      positionMap,
      symbols,
      allPositions,
      selectedSymbol,
      setSelectedSymbol,
      selectedView,
      setSelectedView,
      positionsForSelectedSymbol,
      account,
      cashSecuredPutSummary,
      assignmentRiskSummary,
      recentActivity,
      proactiveAlerts,
      portfolioBrief,
      portfolioMetrics,
      positionsDataFreshness,
      positionsLastSyncedAt,
      refreshPositions: refreshPositionsSafe,
      clearPortfolioData,
      schwabReauth,
      clearSchwabReauth: () => setSchwabReauth(null),
    }),
    [
      accessToken,
      loading,
      error,
      positionMap,
      symbols,
      allPositions,
      selectedSymbol,
      selectedView,
      positionsForSelectedSymbol,
      account,
      cashSecuredPutSummary,
      assignmentRiskSummary,
      recentActivity,
      proactiveAlerts,
      portfolioBrief,
      portfolioMetrics,
      positionsDataFreshness,
      positionsLastSyncedAt,
      refreshPositionsSafe,
      clearPortfolioData,
      schwabReauth,
    ],
  );

  return (
    <PortfolioContextProvider value={portfolioValue}>
      <ChatProvider
        accessToken={accessToken}
        chatUserId={chatUserId}
        account={account}
      >
        <PositionsContextBridge>{children}</PositionsContextBridge>
      </ChatProvider>
    </PortfolioContextProvider>
  );
}
