"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePositionsContext } from "../Providers";
import { useTabs } from "@/app/contexts/TabContext";
import { usePortfolioSection } from "@/app/contexts/PortfolioSectionContext";
import { PortfolioSnapshot } from "@/components/PortfolioSnapshot";
import { PortfolioAttentionSection } from "@/components/PortfolioAttentionSection";
import { PortfolioBriefSection } from "@/components/PortfolioBriefSection";
import { PortfolioChangesSection } from "@/components/PortfolioChangesSection";
import { PortfolioRiskSection } from "@/components/PortfolioRiskSection";
import { PortfolioOverview } from "@/components/PortfolioOverview";
import { PortfolioOnboarding } from "@/components/PortfolioOnboarding";
import { PortfolioSectionTabBar } from "@/components/PortfolioSectionTabBar";
import { NewsHintBanner } from "@/components/NewsHintBanner";
import { RecentActivitySection } from "@/components/RecentActivitySection";
import { SchwabConnectionBanner } from "@/components/SchwabConnectionBanner";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useMorningBrief } from "@/app/hooks/useMorningBrief";
import type { AttentionItem, ProactiveAlert } from "@/app/types/intelligence";
import {
  alertToQuickActionId,
  buildLocalPortfolioBrief,
  buildSymbolAlertMap,
  collectTaxAlertItems,
  mergeDisplayAlerts,
} from "@/lib/intelligence";
import type { TaxAlertItem } from "@/lib/intelligence";
import { dismissPortfolioAlert } from "@/lib/apiClient";

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
    portfolioMetrics,
    refreshPositions,
    sessionAccessToken,
    sendQuickAction,
    schwabReauth,
  } = usePositionsContext();
  const { activeTab } = useTabs();
  const { activeSection, setActiveSection } = usePortfolioSection();

  const localBrief = buildLocalPortfolioBrief(allPositions, account, proactiveAlerts);
  const seedBrief = accountBrief ?? localBrief;

  const {
    morningBrief,
    portfolioBrief: fetchedBrief,
    loading: briefLoading,
    error: briefError,
    lastUpdated: briefLastUpdated,
    refetch: refetchMorningBrief,
  } = useMorningBrief(sessionAccessToken, {
    enabled: !loading && allPositions.length > 0,
    initialBrief: seedBrief,
  });

  const displayBrief = fetchedBrief ?? seedBrief;

  const mergedAlerts = mergeDisplayAlerts(proactiveAlerts, displayBrief);

  const symbolAlertMap = buildSymbolAlertMap(mergedAlerts, displayBrief);

  const taxItems = collectTaxAlertItems(
    mergedAlerts,
    recentActivity?.suggestedActions ?? [],
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

  const handleRunAttentionItem = useCallback(
    (item: AttentionItem) => {
      handleRunAlert({
        action: item.action,
        label: item.label,
        reason: item.reason,
        priority: item.priority,
        symbol: item.symbol,
      });
    },
    [handleRunAlert],
  );

  const handleDismissAttention = useCallback(
    async (alertId: string) => {
      if (!sessionAccessToken) return;
      try {
        await dismissPortfolioAlert(sessionAccessToken, alertId);
        refetchMorningBrief();
      } catch {
        // ignore — user can retry refresh
      }
    },
    [refetchMorningBrief, sessionAccessToken],
  );

  const handleRefreshAll = useCallback(async () => {
    await refreshPositions(true);
    refetchMorningBrief();
  }, [refreshPositions, refetchMorningBrief]);

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
  const attentionQueue = morningBrief?.attentionQueue ?? [];

  return (
    <>
      {schwabReauth && (
        <SchwabConnectionBanner
          message={schwabReauth.message}
          authorizationUrl={schwabReauth.authorizationUrl}
        />
      )}

      {error && !schwabReauth && <ErrorBanner message={error} className="mb-3" />}

      <PortfolioOnboarding />

      {showNewsHint && <NewsHintBanner symbols={symbols} />}

      <PortfolioSnapshot
        className="mb-4"
        loading={loading}
        allPositions={allPositions}
        symbols={symbols}
        account={account}
        cashSecuredPutSummary={cashSecuredPutSummary}
        portfolioMetrics={portfolioMetrics}
      />

      {showContent && (
        <PortfolioSectionTabBar
          activeSection={activeSection}
          onChange={setActiveSection}
        />
      )}

      {showContent && activeSection === "today" && (
        <>
          <PortfolioAttentionSection
            className="mb-4"
            taxItems={taxItems}
            alerts={mergedAlerts}
            attentionItems={attentionQueue}
            suggestedActions={recentActivity?.suggestedActions ?? []}
            onRunAlert={handleRunAlert}
            onRunAttentionItem={handleRunAttentionItem}
            onDismissAttention={handleDismissAttention}
            onRunTax={handleTaxAlert}
            onRunActionId={handleSuggestedAction}
          />

          {showBriefSection && (
            <>
              <PortfolioChangesSection
                className="mb-4"
                changes={morningBrief?.changes}
                loading={briefLoading && !morningBrief}
              />
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
            </>
          )}
        </>
      )}

      {showContent && activeSection === "holdings" && (
        <>
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

          <PortfolioRiskSection
            className="mb-4"
            cashSecuredPutSummary={cashSecuredPutSummary}
            assignmentRiskSummary={assignmentRiskSummary}
            cashBalance={account?.securitiesAccount.currentBalances.cashBalance}
          />
        </>
      )}

      {showContent && activeSection === "activity" && sessionAccessToken && (
        <RecentActivitySection
          accessToken={sessionAccessToken}
          summary={recentActivity}
          onRefresh={() => refreshPositions(true)}
          onRunSuggestedAction={handleSuggestedAction}
        />
      )}
    </>
  );
}
