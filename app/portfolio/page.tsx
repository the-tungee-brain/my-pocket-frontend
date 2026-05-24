"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePositionsContext } from "../Providers";
import { useTabs } from "@/app/contexts/TabContext";
import { Insights } from "@/components/Insights";
import { PortfolioOverview } from "@/components/PortfolioOverview";
import { PortfolioOnboarding } from "@/components/PortfolioOnboarding";
import { PortfolioBriefSection } from "@/components/PortfolioBriefSection";
import { AccountHealthStrip } from "@/components/AccountHealthStrip";
import { NewsHintBanner } from "@/components/NewsHintBanner";
import { RecentActivitySection } from "@/components/RecentActivitySection";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { usePortfolioBrief } from "@/app/hooks/usePortfolioBrief";
import type { ProactiveAlert } from "@/app/types/intelligence";
import {
  alertToQuickActionId,
  buildLocalPortfolioBrief,
  buildSymbolAlertMap,
  mergeDisplayAlerts,
} from "@/lib/intelligence";

export default function PortfolioPage() {
  const router = useRouter();
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
    proactiveAlerts,
    portfolioBrief: accountBrief,
    refreshPositions,
    sessionAccessToken,
    sendQuickAction,
  } = usePositionsContext();
  const { activeTab } = useTabs();

  const localBrief = useMemo(
    () => buildLocalPortfolioBrief(allPositions, account, proactiveAlerts),
    [allPositions, account, proactiveAlerts],
  );

  const seedBrief = accountBrief ?? localBrief;

  const {
    brief,
    loading: briefLoading,
    error: briefError,
    lastUpdated: briefLastUpdated,
    refetch: refetchBrief,
  } = usePortfolioBrief(sessionAccessToken, {
    enabled: !loading && allPositions.length > 0,
    initialBrief: seedBrief,
  });

  const displayBrief = brief ?? seedBrief;

  const symbolAlertMap = useMemo(
    () =>
      buildSymbolAlertMap(
        mergeDisplayAlerts(proactiveAlerts, displayBrief),
        displayBrief,
      ),
    [proactiveAlerts, displayBrief],
  );

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

  const handleRunAlert = useCallback(
    (alert: ProactiveAlert) => {
      const actionId = alertToQuickActionId(alert);
      const symbol = alert.symbol?.toUpperCase();

      if (symbol) {
        router.push(`/portfolio/positions/${symbol}`);
        void sendQuickAction({
          activeChatKey: symbol,
          selectedView: "symbol",
          selectedSymbol: symbol,
          positionsForSelectedSymbol: positionMap[symbol] ?? [],
          actionId,
        });
        return;
      }

      handleSuggestedAction(actionId);
    },
    [handleSuggestedAction, positionMap, router, sendQuickAction],
  );

  const handleRefreshAll = useCallback(async () => {
    await refreshPositions(true);
    refetchBrief();
  }, [refreshPositions, refetchBrief]);

  const showBriefSection =
    !loading && sessionAccessToken && allPositions.length > 0;

  return (
    <>
      {error && <ErrorBanner message={error} className="mb-3" />}

      <PortfolioOnboarding />

      {showNewsHint && <NewsHintBanner symbols={symbols} />}

      {showBriefSection && (
        <PortfolioBriefSection
          className="mb-4"
          brief={displayBrief}
          fallbackAlerts={proactiveAlerts}
          loading={briefLoading && !displayBrief}
          error={displayBrief ? null : briefError}
          lastUpdated={briefLastUpdated}
          onRefresh={handleRefreshAll}
          onRunAlert={handleRunAlert}
        />
      )}

      {!loading && account && allPositions.length > 0 && (
        <AccountHealthStrip
          className="mb-4"
          account={account}
          cashSecuredPutSummary={cashSecuredPutSummary}
        />
      )}

      <PortfolioOverview
        loading={loading}
        allPositions={allPositions}
        symbols={symbols}
        positionMap={positionMap}
        cashSecuredPutSummary={cashSecuredPutSummary}
        assignmentRiskSummary={assignmentRiskSummary}
        cashBalance={account?.securitiesAccount.currentBalances.cashBalance}
        liquidationValue={
          account?.securitiesAccount.currentBalances.liquidationValue
        }
        symbolAlertMap={symbolAlertMap}
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
