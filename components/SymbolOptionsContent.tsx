"use client";

import { useCallback } from "react";
import { useSession } from "next-auth/react";
import { Target } from "lucide-react";
import { useSymbolIntelligence } from "@/app/hooks/useSymbolIntelligence";
import { useAppChatContext, usePortfolioContext } from "@/app/contextSelectors";
import { CashSecuredPutSummary } from "@/components/CashSecuredPutSummary";
import { AssignmentRiskSummary } from "@/components/AssignmentRiskSummary";
import { SymbolOptionsWorkspace } from "@/components/SymbolIntelligencePanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { summarizeCspCashReserves } from "@/lib/cspReservedCash";
import { filterAssignmentRiskSummary } from "@/lib/assignmentRiskSummary";
import { hasSymbolOptionsContent } from "@/lib/intelligence";
import { symbolHasOptionPositions } from "@/lib/symbolOptions";
import { symbolChatKey } from "@/lib/chatKeys";
import { appStackClass } from "@/lib/appUi";
import { pageSectionClass } from "@/lib/pageLayout";
import { PageSplit } from "@/components/PageShell";
import { cn } from "@/lib/utils";

type Props = {
  symbol: string;
};

export function SymbolOptionsContent({ symbol }: Props) {
  const { error, positionMap, account, assignmentRiskSummary } =
    usePortfolioContext();
  const { sendPrompt } = useAppChatContext();
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const symbolUpper = symbol.toUpperCase();
  const chatKey = symbolChatKey(symbolUpper) ?? symbolUpper;

  const { intelligence, loading: intelligenceLoading, error: intelligenceError, refetch: refetchIntelligence } =
    useSymbolIntelligence(symbol, { accessToken });

  const positionsForSymbol = positionMap[symbolUpper] ?? null;
  const hasOptionLegs = symbolHasOptionPositions(positionsForSymbol);
  const hasOptionsData = hasSymbolOptionsContent(intelligence);

  const symbolCspSummary = positionsForSymbol
    ? summarizeCspCashReserves(
        positionsForSymbol,
        account?.securitiesAccount.currentBalances.cashBalance,
      )
    : null;

  const symbolAssignmentRiskSummary =
    assignmentRiskSummary && (positionsForSymbol?.length ?? 0) > 0
      ? filterAssignmentRiskSummary(assignmentRiskSummary, symbolUpper)
      : null;

  const showCashReserved =
    symbolCspSummary != null && symbolCspSummary.totalReservedCash > 0;
  const showExpiring = symbolAssignmentRiskSummary != null;
  const showWorkspace =
    hasOptionLegs || hasOptionsData || intelligenceLoading;

  const handleAnalyzeOption = useCallback(
    (prompt: string) => {
      void sendPrompt({
        activeChatKey: chatKey,
        selectedView: "research",
        selectedSymbol: symbolUpper,
        positionsForSelectedSymbol: positionsForSymbol ?? [],
        prompt,
      });
    },
    [chatKey, symbolUpper, sendPrompt, positionsForSymbol],
  );

  if (!showWorkspace && !showExpiring && !showCashReserved && !intelligenceLoading) {
    return (
      <EmptyState
        icon={Target}
        title="No options data yet"
        description={`${symbolUpper} has no option positions or live chain data right now. Open Positions to review your holdings.`}
        variant="solid"
      />
    );
  }

  const workspace = showWorkspace ? (
    <SymbolOptionsWorkspace
      intelligence={intelligence}
      loading={intelligenceLoading}
      error={intelligenceError}
      onRefresh={refetchIntelligence}
      onAnalyzeOption={handleAnalyzeOption}
      className={pageSectionClass}
    />
  ) : null;

  const splitPanelClass = cn(pageSectionClass, "h-full min-h-0");

  const cashReserved =
    showCashReserved && symbolCspSummary ? (
      <CashSecuredPutSummary
        summary={symbolCspSummary}
        cashBalance={account?.securitiesAccount.currentBalances.cashBalance}
        className={splitPanelClass}
      />
    ) : null;

  const expiring = showExpiring ? (
    <AssignmentRiskSummary
      summary={symbolAssignmentRiskSummary}
      className={splitPanelClass}
    />
  ) : null;

  const reservesAndExpiring =
    cashReserved && expiring ? (
      <PageSplit
        main={cashReserved}
        aside={expiring}
        className="lg:grid-cols-2 lg:items-stretch"
        mainClassName="h-full min-h-0"
        asideClassName="h-full min-h-0"
      />
    ) : (
      cashReserved ?? expiring
    );

  return (
    <div className={cn(appStackClass, "w-full max-w-none")}>
      {error && <ErrorBanner message={error} />}

      {reservesAndExpiring}

      {workspace}
    </div>
  );
}
