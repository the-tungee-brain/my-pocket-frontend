"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { usePositionsContext } from "../Providers";
import { usePortfolioSection } from "@/app/contexts/PortfolioSectionContext";
import { useStrategyJourney } from "@/app/hooks/useStrategyJourney";
import { PortfolioSnapshot } from "@/components/PortfolioSnapshot";
import { PortfolioAttentionSection, countAttentionItems } from "@/components/PortfolioAttentionSection";
import { PortfolioBriefSection } from "@/components/PortfolioBriefSection";
import { PortfolioRiskSection } from "@/components/PortfolioRiskSection";
import { AnalysisPanel } from "@/components/AnalysisPanel";
import { PortfolioOnboarding } from "@/components/PortfolioOnboarding";
import { StrategyJourneyPanel } from "@/components/StrategyJourneyPanel";
import { StrategyOnboardingWizard } from "@/components/StrategyOnboardingWizard";
import { PortfolioSectionTabBar } from "@/components/PortfolioSectionTabBar";
import { RecentActivitySection } from "@/components/RecentActivitySection";
import { SchwabConnectionBanner } from "@/components/SchwabConnectionBanner";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useMorningBrief } from "@/app/hooks/useMorningBrief";
import type { AttentionItem, ProactiveAlert } from "@/app/types/intelligence";
import type { StrategyNextAction } from "@/app/types/strategy";
import {
  alertToQuickActionId,
  buildLocalPortfolioBrief,
  buildSymbolAlertMap,
  collectTaxAlertItems,
  mergeDisplayAlerts,
} from "@/lib/intelligence";
import type { TaxAlertItem } from "@/lib/intelligence";
import { dismissPortfolioAlert } from "@/lib/apiClient";
import {
  clearStrategyOnboardingDismissed,
  dismissStrategyOnboarding,
  isStrategyOnboardingDismissed,
} from "@/lib/onboardingStorage";
import { scrollToChat } from "@/lib/scrollToChat";
import { ANALYZE_PORTFOLIO_EVENT, PORTFOLIO_ANALYSIS_SECTION_ID } from "@/lib/positionAnalysis";
import { buildAddSymbolUpdate } from "@/lib/strategyStockSuggestions";

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
    proactiveAlerts,
    portfolioBrief: accountBrief,
    portfolioMetrics,
    refreshPositions,
    sessionAccessToken,
    sendQuickAction,
    schwabReauth,
  } = usePositionsContext();
  const { activeSection, setActiveSection } = usePortfolioSection();
  const searchParams = useSearchParams();
  const defaultTabApplied = useRef(false);
  const [showStrategySetup, setShowStrategySetup] = useState(false);
  const [strategyDismissed, setStrategyDismissed] = useState(true);
  const [pendingPortfolioAnalysis, setPendingPortfolioAnalysis] = useState(false);

  useEffect(() => {
    setStrategyDismissed(isStrategyOnboardingDismissed());
  }, []);

  useEffect(() => {
    const openHoldingsForAnalysis = () => {
      setActiveSection("holdings");
      setPendingPortfolioAnalysis(true);
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          document
            .getElementById(PORTFOLIO_ANALYSIS_SECTION_ID)
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });
    };

    window.addEventListener(ANALYZE_PORTFOLIO_EVENT, openHoldingsForAnalysis);
    return () =>
      window.removeEventListener(ANALYZE_PORTFOLIO_EVENT, openHoldingsForAnalysis);
  }, [setActiveSection]);

  useEffect(() => {
    if (activeSection !== "holdings" || !pendingPortfolioAnalysis) return;
    const timer = window.setTimeout(() => setPendingPortfolioAnalysis(false), 0);
    return () => window.clearTimeout(timer);
  }, [activeSection, pendingPortfolioAnalysis]);

  const {
    catalog,
    profile: strategyProfile,
    journey,
    recommendations,
    needsOnboarding,
    loading: strategyLoading,
    chooseStrategy,
    completeOnboarding,
    markStep,
    refreshRecommendations,
    saveProfile,
  } = useStrategyJourney(sessionAccessToken ?? undefined);

  const showStrategyWizard =
    !!sessionAccessToken &&
    !strategyLoading &&
    (needsOnboarding || showStrategySetup) &&
    catalog.length > 0 &&
    (!strategyDismissed || showStrategySetup);

  const showStrategyJourney =
    !!sessionAccessToken &&
    !!strategyProfile?.onboardingCompletedAt &&
    !!journey &&
    !showStrategySetup;

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

  const handleSuggestedAction = useCallback(
    (actionId: string) => {
      void sendQuickAction({
        activeChatKey: "__PORTFOLIO_CHAT__",
        selectedView: "portfolio",
        selectedSymbol: null,
        positionsForSelectedSymbol: allPositions,
        actionId,
      });
      scrollToChat();
    },
    [allPositions, sendQuickAction],
  );

  const handleRunAlert = useCallback(
    (alert: ProactiveAlert) => {
      const actionId = alertToQuickActionId(alert);
      handleSuggestedAction(actionId);
    },
    [handleSuggestedAction],
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

  const handleStrategyAction = useCallback(
    (action: StrategyNextAction) => {
      if (action.actionId) {
        void sendQuickAction({
          activeChatKey: "__PORTFOLIO_CHAT__",
          selectedView: "portfolio",
          selectedSymbol: action.symbol ?? null,
          positionsForSelectedSymbol: allPositions,
          actionId: action.actionId,
        });
        scrollToChat();
      }
    },
    [allPositions, sendQuickAction],
  );

  const handleCompleteStrategyOnboarding = useCallback(
    async (payload: Parameters<typeof completeOnboarding>[0]) => {
      if (!payload.primaryStrategy) return;
      clearStrategyOnboardingDismissed();
      setStrategyDismissed(false);
      await chooseStrategy(payload.primaryStrategy);
      await completeOnboarding(payload);
      setShowStrategySetup(false);
    },
    [chooseStrategy, completeOnboarding],
  );

  const handleDismissStrategyWizard = useCallback(() => {
    dismissStrategyOnboarding();
    setStrategyDismissed(true);
    setShowStrategySetup(false);
  }, []);

  const handleAddSuggestedSymbol = useCallback(
    async (symbol: string) => {
      if (!strategyProfile) return;
      const update = buildAddSymbolUpdate(strategyProfile, symbol);
      if (!update) return;
      await saveProfile(update);
      await refreshRecommendations();
    },
    [refreshRecommendations, saveProfile, strategyProfile],
  );

  const handleGoDeeper = useCallback(() => {
    void sendQuickAction({
      activeChatKey: "__PORTFOLIO_CHAT__",
      selectedView: "portfolio",
      selectedSymbol: null,
      positionsForSelectedSymbol: allPositions,
      actionId: "daily-summary",
    });
    scrollToChat();
  }, [allPositions, sendQuickAction]);

  const handleTaxAlert = useCallback(
    (item: TaxAlertItem) => {
      handleSuggestedAction(item.actionId);
    },
    [handleSuggestedAction],
  );

  const showContent = !loading && allPositions.length > 0;
  const showBriefSection = showContent && sessionAccessToken;
  const attentionQueue = morningBrief?.attentionQueue ?? [];

  const todayBadgeCount = useMemo(
    () =>
      countAttentionItems({
        taxItems,
        alerts: mergedAlerts,
        attentionItems: attentionQueue,
        suggestedActions: recentActivity?.suggestedActions ?? [],
      }),
    [attentionQueue, mergedAlerts, recentActivity?.suggestedActions, taxItems],
  );

  const activityBadgeCount = recentActivity?.recentOrderCount ?? 0;

  useEffect(() => {
    if (defaultTabApplied.current || loading || allPositions.length === 0) return;
    if (searchParams.get("section")) {
      defaultTabApplied.current = true;
      return;
    }
    if (todayBadgeCount === 0 && activityBadgeCount > 0) {
      setActiveSection("activity");
    }
    defaultTabApplied.current = true;
  }, [
    activityBadgeCount,
    allPositions.length,
    loading,
    searchParams,
    setActiveSection,
    todayBadgeCount,
  ]);

  return (
    <>
      {schwabReauth && (
        <SchwabConnectionBanner
          message={schwabReauth.message}
          authorizationUrl={schwabReauth.authorizationUrl}
        />
      )}

      {error && !schwabReauth && <ErrorBanner message={error} className="mb-3" />}

      {showStrategyWizard && sessionAccessToken && (
        <StrategyOnboardingWizard
          accessToken={sessionAccessToken}
          catalog={catalog}
          onSaveDraft={async (payload) => {
            if (!payload.primaryStrategy) return;
            await chooseStrategy(payload.primaryStrategy);
            await saveProfile(payload);
          }}
          onComplete={handleCompleteStrategyOnboarding}
          onClose={handleDismissStrategyWizard}
        />
      )}

      {!showStrategyWizard && needsOnboarding && sessionAccessToken && (
        <div className="mx-auto mb-4 w-full max-w-3xl rounded-xl border border-border bg-background/40 px-4 py-3 text-sm text-muted">
          <span>Set up your investing strategy for a guided checklist and next steps.</span>{" "}
          <button
            type="button"
            onClick={() => {
              clearStrategyOnboardingDismissed();
              setStrategyDismissed(false);
              setShowStrategySetup(true);
            }}
            className="font-medium text-accent-strong hover:underline"
          >
            Start onboarding
          </button>
          {" · "}
          <Link href="/settings" className="font-medium text-accent-strong hover:underline">
            Open settings
          </Link>
        </div>
      )}

      {showStrategyJourney && journey && (
        <StrategyJourneyPanel
          journey={journey}
          recommendations={recommendations}
          onRunAction={handleStrategyAction}
          onAddSuggestedSymbol={(symbol) => void handleAddSuggestedSymbol(symbol)}
          onMarkLearned={(stepId) =>
            void markStep(stepId, "completed").then(() => refreshRecommendations())
          }
          hideNextActions={todayBadgeCount > 0}
        />
      )}

      {!showStrategyWizard && !needsOnboarding && !showStrategyJourney && (
        <PortfolioOnboarding />
      )}

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
          badges={{
            today: todayBadgeCount,
            activity: activityBadgeCount,
          }}
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
            <PortfolioBriefSection
              className="mb-4"
              brief={displayBrief}
              changes={morningBrief?.changes}
              changesLoading={briefLoading && !morningBrief}
              fallbackAlerts={proactiveAlerts}
              loading={briefLoading && !displayBrief}
              error={displayBrief ? null : briefError}
              lastUpdated={briefLastUpdated}
              onGoDeeper={handleGoDeeper}
              hideSuggestedActions
            />
          )}
        </>
      )}

      {showContent && activeSection === "holdings" && (
        <>
          <AnalysisPanel
            mode="portfolio"
            positions={allPositions}
            positionMap={positionMap}
            liquidationValue={
              account?.securitiesAccount.currentBalances.liquidationValue
            }
            symbolAlertMap={symbolAlertMap}
            className="mx-auto mb-4 max-w-3xl"
            autoStart={pendingPortfolioAnalysis}
            onAskFollowUp={() => scrollToChat()}
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
          hideSuggestedActions
        />
      )}
    </>
  );
}
