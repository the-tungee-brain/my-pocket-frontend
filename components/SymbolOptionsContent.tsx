"use client";

import { useCallback } from "react";
import { useSession } from "next-auth/react";
import { Target } from "lucide-react";
import { useSymbolIntelligence } from "@/app/hooks/useSymbolIntelligence";
import { usePositionsContext } from "@/app/Providers";
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
import { pageSectionClass } from "@/lib/pageLayout";
import { PageSplit } from "@/components/PageShell";

type Props = {
  symbol: string;
};

export function SymbolOptionsContent({ symbol }: Props) {
  const {
    error,
    positionMap,
    account,
    assignmentRiskSummary,
    sendPrompt,
  } = usePositionsContext();
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const symbolUpper = symbol.toUpperCase();
  const chatKey = symbolChatKey(symbolUpper) ?? symbolUpper;

  const { intelligence, loading: intelligenceLoading, error: intelligenceError, refetch: refetchIntelligence } =
    useSymbolIntelligence(symbol, { accessToken });

  const positionsForSymbol = positionMap[symbolUpper] ?? null;
  const hasPosition = (positionsForSymbol?.length ?? 0) > 0;
  const hasOptionLegs = symbolHasOptionPositions(positionsForSymbol);
  const hasOptionsData = hasSymbolOptionsContent(intelligence);

  const symbolCspSummary = positionsForSymbol
    ? summarizeCspCashReserves(
        positionsForSymbol,
        account?.securitiesAccount.currentBalances.cashBalance,
      )
    : null;

  const symbolAssignmentRiskSummary =
    assignmentRiskSummary && hasPosition
      ? filterAssignmentRiskSummary(assignmentRiskSummary, symbolUpper)
      : null;

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

  if (!hasOptionLegs && !hasOptionsData && !intelligenceLoading) {
    return (
      <EmptyState
        icon={Target}
        title="No options data yet"
        description={`${symbolUpper} has no option positions or live chain data right now. Open Positions to review your holdings.`}
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
            <SymbolOptionsWorkspace
              intelligence={intelligence}
              loading={intelligenceLoading}
              error={intelligenceError}
              onRefresh={refetchIntelligence}
              onAnalyzeOption={handleAnalyzeOption}
              className={pageSectionClass}
            />
          </>
        }
        aside={
          symbolCspSummary?.totalReservedCash ||
          symbolAssignmentRiskSummary ? (
            <>
              {symbolCspSummary && symbolCspSummary.totalReservedCash > 0 && (
                <CashSecuredPutSummary
                  summary={symbolCspSummary}
                  cashBalance={
                    account?.securitiesAccount.currentBalances.cashBalance
                  }
                  compact
                  className={pageSectionClass}
                />
              )}

              {symbolAssignmentRiskSummary && (
                <AssignmentRiskSummary
                  summary={symbolAssignmentRiskSummary}
                  compact
                  className={pageSectionClass}
                />
              )}
            </>
          ) : undefined
        }
      />
    </>
  );
}
