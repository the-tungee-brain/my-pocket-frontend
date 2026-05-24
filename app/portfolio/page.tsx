"use client";

import { useCallback } from "react";
import { usePositionsContext } from "../Providers";
import { useTabs } from "@/app/contexts/TabContext";
import { Insights } from "@/components/Insights";
import { PortfolioOverview } from "@/components/PortfolioOverview";
import { PortfolioOnboarding } from "@/components/PortfolioOnboarding";
import { NewsHintBanner } from "@/components/NewsHintBanner";
import { RecentActivitySection } from "@/components/RecentActivitySection";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

export default function PortfolioPage() {
  const {
    error,
    allPositions,
    loading,
    symbols,
    positionMap,
    cashSecuredPutSummary,
    assignmentRiskSummary,
    account,
    recentActivity,
    refreshPositions,
    sessionAccessToken,
    sendQuickAction,
  } = usePositionsContext();
  const { activeTab } = useTabs();

  const showNewsHint =
    activeTab === "assistant" && !loading && symbols.length > 0;

  const handleSuggestedAction = useCallback(
    (actionId: string) => {
      void sendQuickAction({
        activeChatKey: "__PORTFOLIO_CHAT__",
        selectedView: "portfolio",
        selectedSymbol: null,
        positionsForSelectedSymbol: allPositions,
        actionId,
      });
    },
    [allPositions, sendQuickAction],
  );

  return (
    <>
      {error && <ErrorBanner message={error} className="mb-3" />}

      <PortfolioOnboarding />

      {showNewsHint && <NewsHintBanner symbols={symbols} />}

      <PortfolioOverview
        loading={loading}
        allPositions={allPositions}
        symbols={symbols}
        positionMap={positionMap}
        cashSecuredPutSummary={cashSecuredPutSummary}
        assignmentRiskSummary={assignmentRiskSummary}
        cashBalance={account?.securitiesAccount.currentBalances.cashBalance}
      />

      {!loading && sessionAccessToken && (
        <RecentActivitySection
          className="mt-4"
          accessToken={sessionAccessToken}
          summary={recentActivity}
          onRefresh={() => refreshPositions(true)}
          onRunSuggestedAction={handleSuggestedAction}
          compact
        />
      )}

      <Insights
        symbol={null}
        positions={allPositions}
        thinkingMessage="Analyzing this portfolio"
      />
    </>
  );
}
