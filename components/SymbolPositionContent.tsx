"use client";

import { useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useSymbolIntelligence } from "@/app/hooks/useSymbolIntelligence";
import { usePositionsContext } from "@/app/Providers";
import { AnalysisPanel } from "@/components/AnalysisPanel";
import { CashSecuredPutSummary } from "@/components/CashSecuredPutSummary";
import { AssignmentRiskSummary } from "@/components/AssignmentRiskSummary";
import { TaxWashSaleStrip } from "@/components/TaxWashSaleStrip";
import { RecentActivitySection } from "@/components/RecentActivitySection";
import { SymbolAlertStrip } from "@/components/SymbolAlertStrip";
import { SymbolOptionsWorkspace } from "@/components/SymbolIntelligencePanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { summarizeCspCashReserves } from "@/lib/cspReservedCash";
import { filterAssignmentRiskSummary } from "@/lib/assignmentRiskSummary";
import {
  alertToQuickActionId,
  collectTaxAlertItems,
  mergeDisplayAlerts,
} from "@/lib/intelligence";
import type { TaxAlertItem } from "@/lib/intelligence";
import type { ProactiveAlert } from "@/app/types/intelligence";
import { symbolChatKey } from "@/lib/chatKeys";
import { scrollToChat } from "@/lib/scrollToChat";
import { BriefcaseBusiness } from "lucide-react";
import { pageSectionClass } from "@/lib/pageLayout";
import { PageSplit } from "@/components/PageShell";

type Props = {
  symbol: string;
};

export function SymbolPositionContent({ symbol }: Props) {
  const {
    error,
    positionMap,
    account,
    assignmentRiskSummary,
    proactiveAlerts,
    portfolioBrief,
    recentActivity,
    sendQuickAction,
    sendPrompt,
  } = usePositionsContext();
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const symbolUpper = symbol.toUpperCase();
  const chatKey = symbolChatKey(symbolUpper) ?? symbolUpper;

  const { intelligence, loading: intelligenceLoading, error: intelligenceError, refetch: refetchIntelligence } =
    useSymbolIntelligence(symbol, { accessToken });

  const positionsForSelectedSymbol = positionMap[symbolUpper] ?? null;
  const hasPosition = (positionsForSelectedSymbol?.length ?? 0) > 0;

  const symbolCspSummary = positionsForSelectedSymbol
    ? summarizeCspCashReserves(
        positionsForSelectedSymbol,
        account?.securitiesAccount.currentBalances.cashBalance,
      )
    : null;

  const symbolAssignmentRiskSummary =
    assignmentRiskSummary && hasPosition
      ? filterAssignmentRiskSummary(assignmentRiskSummary, symbolUpper)
      : null;

  const taxItems = useMemo(
    () =>
      collectTaxAlertItems(
        mergeDisplayAlerts(proactiveAlerts, portfolioBrief),
        recentActivity?.suggestedActions ?? [],
        symbolUpper,
      ),
    [proactiveAlerts, portfolioBrief, recentActivity?.suggestedActions, symbolUpper],
  );

  const symbolAlerts = useMemo(
    () => mergeDisplayAlerts(proactiveAlerts, portfolioBrief),
    [proactiveAlerts, portfolioBrief],
  );

  const handleSuggestedAction = useCallback(
    (actionId: string) => {
      void sendQuickAction({
        activeChatKey: chatKey,
        selectedView: "research",
        selectedSymbol: symbolUpper,
        positionsForSelectedSymbol: positionsForSelectedSymbol ?? [],
        actionId,
      });
    },
    [chatKey, symbolUpper, sendQuickAction, positionsForSelectedSymbol],
  );

  const handleRunAlert = useCallback(
    (alert: ProactiveAlert) => {
      void sendQuickAction({
        activeChatKey: chatKey,
        selectedView: "research",
        selectedSymbol: symbolUpper,
        positionsForSelectedSymbol: positionsForSelectedSymbol ?? [],
        actionId: alertToQuickActionId(alert),
      });
    },
    [chatKey, symbolUpper, sendQuickAction, positionsForSelectedSymbol],
  );

  const handleTaxAlert = useCallback(
    (item: TaxAlertItem) => {
      void sendQuickAction({
        activeChatKey: chatKey,
        selectedView: "research",
        selectedSymbol: symbolUpper,
        positionsForSelectedSymbol: positionsForSelectedSymbol ?? [],
        actionId: item.actionId,
      });
    },
    [chatKey, symbolUpper, sendQuickAction, positionsForSelectedSymbol],
  );

  const handleAskFollowUp = useCallback(() => {
    scrollToChat();
  }, []);

  const handleAnalyzeOption = useCallback(
    (prompt: string) => {
      void sendPrompt({
        activeChatKey: chatKey,
        selectedView: "research",
        selectedSymbol: symbolUpper,
        positionsForSelectedSymbol: positionsForSelectedSymbol ?? [],
        prompt,
      });
    },
    [chatKey, symbolUpper, sendPrompt, positionsForSelectedSymbol],
  );

  if (!hasPosition) {
    return (
      <EmptyState
        icon={BriefcaseBusiness}
        title="No Schwab position"
        description={`You are not holding ${symbolUpper} in your linked Schwab account. Use Overview for company research or add it to your watchlist.`}
        variant="solid"
      />
    );
  }

  return (
    <>
      {error && <ErrorBanner message={error} className="mb-3" />}

      <PageSplit
        main={
          <>
            <AnalysisPanel
              mode="symbol"
              symbol={symbolUpper}
              positions={positionsForSelectedSymbol}
              className={pageSectionClass}
              onAskFollowUp={handleAskFollowUp}
            />

            <SymbolOptionsWorkspace
              intelligence={intelligence}
              loading={intelligenceLoading}
              error={intelligenceError}
              onRefresh={refetchIntelligence}
              onAnalyzeOption={handleAnalyzeOption}
              className={pageSectionClass}
            />

            {accessToken && (
              <RecentActivitySection
                className={pageSectionClass}
                accessToken={accessToken}
                symbol={symbolUpper}
                onRunSuggestedAction={handleSuggestedAction}
              />
            )}
          </>
        }
        aside={
          taxItems.length > 0 ||
          symbolAlerts.length > 0 ||
          (symbolCspSummary && symbolCspSummary.totalReservedCash > 0) ||
          symbolAssignmentRiskSummary ? (
            <>
              {taxItems.length > 0 && (
                <TaxWashSaleStrip
                  className={pageSectionClass}
                  items={taxItems}
                  onRun={handleTaxAlert}
                />
              )}

              <SymbolAlertStrip
                className={pageSectionClass}
                symbol={symbolUpper}
                alerts={symbolAlerts}
                onRunAlert={handleRunAlert}
              />

              {symbolCspSummary && symbolCspSummary.totalReservedCash > 0 && (
                <CashSecuredPutSummary
                  summary={symbolCspSummary}
                  cashBalance={
                    account?.securitiesAccount.currentBalances.cashBalance
                  }
                  compact
                />
              )}

              {symbolAssignmentRiskSummary && (
                <AssignmentRiskSummary
                  summary={symbolAssignmentRiskSummary}
                  compact
                />
              )}
            </>
          ) : undefined
        }
      />
    </>
  );
}
