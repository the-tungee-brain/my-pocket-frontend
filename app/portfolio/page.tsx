"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { usePositionsContext } from "../Providers";
import { useTabs } from "@/app/contexts/TabContext";
import { PortfolioSnapshot } from "@/components/PortfolioSnapshot";
import { PortfolioAttentionSection } from "@/components/PortfolioAttentionSection";
import { PortfolioBriefSection } from "@/components/PortfolioBriefSection";
import { PortfolioRiskSection } from "@/components/PortfolioRiskSection";
import { PortfolioOverview } from "@/components/PortfolioOverview";
import { PortfolioOnboarding } from "@/components/PortfolioOnboarding";
import { NewsHintBanner } from "@/components/NewsHintBanner";
import { RecentActivitySection } from "@/components/RecentActivitySection";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { usePortfolioBrief } from "@/app/hooks/usePortfolioBrief";
import type { ProactiveAlert } from "@/app/types/intelligence";
import {
  alertToQuickActionId,
  buildLocalPortfolioBrief,
  buildSymbolAlertMap,
  collectTaxAlertItems,
  mergeDisplayAlerts,
} from "@/lib/intelligence";
import type { TaxAlertItem } from "@/lib/intelligence";

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

  const mergedAlerts = useMemo(
    () => mergeDisplayAlerts(proactiveAlerts, displayBrief),
    [proactiveAlerts, displayBrief],
  );

  const symbolAlertMap = useMemo(
    () => buildSymbolAlertMap(mergedAlerts, displayBrief),
    [mergedAlerts, displayBrief],
  );

  const taxItems = useMemo(
    () =>
      collectTaxAlertItems(
        mergedAlerts,
        recentActivity?.suggestedActions ?? [],
      ),
    [mergedAlerts, recentActivity?.suggestedActions],
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

  const handleGoDeeper = useCallback(() => {
    void sendQuickAction({
      activeChatKey: "__PORTFOLIO_CHAT__",
      selectedView: "portfolio",
      selectedSymbol: null,
      positionsForSelectedSymbol: allPositions,
      actionId: "daily-summary",
    });
  }, [allPositions, sendQuickAction]);

  const handleTaxAlert = useCallback(
    (item: TaxAlertItem) => {
      if (item.symbol) {
        router.push(`/portfolio/positions/${item.symbol}`);
        void sendQuickAction({
          activeChatKey: item.symbol,
          selectedView: "symbol",
          selectedSymbol: item.symbol,
          positionsForSelectedSymbol: positionMap[item.symbol] ?? [],
          actionId: item.actionId,
        });
        return;
      }

      handleSuggestedAction(item.actionId);
    },
    [handleSuggestedAction, positionMap, router, sendQuickAction],
  );

  const showContent = !loading && allPositions.length > 0;
  const showBriefSection = showContent && sessionAccessToken;

  return (
    <>
      {error && <ErrorBanner message={error} className="mb-3" />}

      <PortfolioOnboarding />

      {showNewsHint && <NewsHintBanner symbols={symbols} />}

      <PortfolioSnapshot
        className="mb-4"
        loading={loading}
        allPositions={allPositions}
        symbols={symbols}
        account={account}
        cashSecuredPutSummary={cashSecuredPutSummary}
      />

      {showContent && (
        <PortfolioAttentionSection
          className="mb-4"
          taxItems={taxItems}
          alerts={mergedAlerts}
          suggestedActions={recentActivity?.suggestedActions ?? []}
          onRunAlert={handleRunAlert}
          onRunTax={handleTaxAlert}
          onRunActionId={handleSuggestedAction}
        />
      )}

      {showBriefSection && (
        <PortfolioBriefSection
          className="mb-4"
          brief={displayBrief}
          fallbackAlerts={proactiveAlerts}
          loading={briefLoading && !displayBrief}
          error={displayBrief ? null : briefError}
          lastUpdated={briefLastUpdated}
          onRefresh={handleRefreshAll}
          onGoDeeper={handleGoDeeper}
          hideSuggestedActions
        />
      )}

      <PortfolioOverview
        className="mb-4"
        loading={loading}
        allPositions={allPositions}
        positionMap={positionMap}
        liquidationValue={
          account?.securitiesAccount.currentBalances.liquidationValue
        }
        symbolAlertMap={symbolAlertMap}
      />

      {showContent && (
        <PortfolioRiskSection
          className="mb-4"
          cashSecuredPutSummary={cashSecuredPutSummary}
          assignmentRiskSummary={assignmentRiskSummary}
          cashBalance={account?.securitiesAccount.currentBalances.cashBalance}
        />
      )}

      {!loading && sessionAccessToken && (
        <RecentActivitySection
          accessToken={sessionAccessToken}
          summary={recentActivity}
          onRefresh={() => refreshPositions(true)}
          onRunSuggestedAction={handleSuggestedAction}
          hideSuggestedActions
          compact
        />
      )}
    </>
  );
}
