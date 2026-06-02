"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAppChatContext, usePortfolioContext } from "@/app/contextSelectors";
import {
  usePortfolioSection,
  type PortfolioSectionId,
} from "@/app/contexts/PortfolioSectionContext";
import { useStrategyContext } from "@/app/contexts/StrategyContext";
import { useSchwabConnect } from "@/app/hooks/useSchwabConnect";
import { PortfolioSnapshot } from "@/components/PortfolioSnapshot";
import { PortfolioAttentionSection, countAttentionItems } from "@/components/PortfolioAttentionSection";
import { PortfolioBriefSection } from "@/components/PortfolioBriefSection";
import { PortfolioRiskSection } from "@/components/PortfolioRiskSection";
import { AnalysisPanel, type PortfolioNavigationRequest } from "@/components/AnalysisPanel";
import { PortfolioOnboarding } from "@/components/PortfolioOnboarding";
import { PortfolioStrategyNudge } from "@/components/portfolio/PortfolioStrategyNudge";
import { StrategyPlaybookPanel } from "@/components/StrategyPlaybookPanel";
import { StrategyOnboardingWizard } from "@/components/StrategyOnboardingWizard";
import { PortfolioSectionTabBar } from "@/components/PortfolioSectionTabBar";
import { PortfolioNewsSection } from "@/components/PortfolioNewsSection";
import { usePortfolioNews } from "@/app/hooks/usePortfolioNews";
import { RecentActivitySection } from "@/components/RecentActivitySection";
import { SchwabConnectionBanner } from "@/components/SchwabConnectionBanner";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useToast } from "@/app/contexts/ToastContext";
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
import {
  clearStrategyOnboardingDismissed,
  dismissStrategyOnboarding,
  isStrategyOnboardingDismissed,
} from "@/lib/onboardingStorage";
import { scrollToChat } from "@/lib/scrollToChat";
import {
  hasPortfolioAnalysis,
  PORTFOLIO_ANALYSIS_SECTION_ID,
  scrollToAnalysisSection,
} from "@/lib/positionAnalysis";
import type { StrategyNextAction } from "@/app/types/strategy";
import {
  playbookActionAskable,
} from "@/lib/strategyPlaybook";
import {
  appStackClass,
  portfolioTodayPairGridClass,
  portfolioTodayPairGridPairedClass,
} from "@/lib/appUi";
import { FreshnessLabel } from "@/components/ui/FreshnessLabel";
import { parsePositionsSyncedAt } from "@/lib/dataFreshness";
import { pageSectionClass } from "@/lib/pageLayout";
import { PageShell, PageSplit } from "@/components/PageShell";
import { cn } from "@/lib/utils";

const sectionClass = pageSectionClass;

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
    positionsDataFreshness,
    refreshPositions,
    sessionAccessToken,
    schwabReauth,
  } = usePortfolioContext();

  const {
    sendQuickAction,
    sendPrompt,
    sendPlaybookAsk,
    closeAllChatModelMenus,
  } = useAppChatContext();
  const { activeSection, setActiveSection } = usePortfolioSection();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const schwabSuccessNotifiedRef = useRef(false);
  const [showStrategySetup, setShowStrategySetup] = useState(false);
  const [strategyDismissed, setStrategyDismissed] = useState(true);
  const [pendingPortfolioAnalysis, setPendingPortfolioAnalysis] = useState(false);
  const [portfolioAnalysisLoading, setPortfolioAnalysisLoading] = useState(false);
  const [portfolioNavigation, setPortfolioNavigation] =
    useState<PortfolioNavigationRequest | null>(null);
  const pendingGoToAnalysisRef = useRef<{ forceAnalyze: boolean } | null>(null);

  const handleSectionChange = useCallback(
    (section: PortfolioSectionId) => {
      closeAllChatModelMenus();
      setActiveSection(section);
    },
    [closeAllChatModelMenus, setActiveSection],
  );

  useEffect(() => {
    setStrategyDismissed(isStrategyOnboardingDismissed());
  }, []);

  useEffect(() => {
    if (schwabSuccessNotifiedRef.current) return;
    if (searchParams.get("status") !== "success") return;
    schwabSuccessNotifiedRef.current = true;
    showToast("Schwab account connected.");
  }, [searchParams, showToast]);

  const startPortfolioAnalysis = useCallback(() => {
    setPendingPortfolioAnalysis(true);
    scrollToAnalysisSection(PORTFOLIO_ANALYSIS_SECTION_ID);
  }, []);

  useEffect(() => {
    if (!pendingPortfolioAnalysis) return;
    const timer = window.setTimeout(() => setPendingPortfolioAnalysis(false), 0);
    return () => window.clearTimeout(timer);
  }, [pendingPortfolioAnalysis]);

  useEffect(() => {
    if (activeSection !== "today") return;

    const pending = pendingGoToAnalysisRef.current;
    if (!pending) return;

    pendingGoToAnalysisRef.current = null;
    setPortfolioNavigation({
      token: Date.now(),
      forceAnalyze: pending.forceAnalyze,
    });
    scrollToAnalysisSection(PORTFOLIO_ANALYSIS_SECTION_ID);
  }, [activeSection]);

  const {
    catalog,
    profile: strategyProfile,
    recommendations: strategyRecommendations,
    needsOnboarding,
    loading: strategyLoading,
    chooseStrategy,
    completeOnboarding,
    saveProfile,
  } = useStrategyContext();
  const { connect: connectSchwab, connecting: connectingSchwab } = useSchwabConnect();
  const showStrategyWizard =
    !!sessionAccessToken &&
    !strategyLoading &&
    (needsOnboarding || showStrategySetup) &&
    catalog.length > 0 &&
    (!strategyDismissed || showStrategySetup);

  const showStrategyJourney =
    !!sessionAccessToken &&
    !!strategyProfile?.onboardingCompletedAt &&
    !!strategyProfile.primaryStrategy &&
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

  const handlePlaybookAsk = useCallback(
    (action: StrategyNextAction) => {
      if (!playbookActionAskable(action) || !strategyProfile?.primaryStrategy) return;
      void sendPlaybookAsk({
        activeChatKey: "__PORTFOLIO_CHAT__",
        action,
        strategy: strategyProfile.primaryStrategy,
      });
      scrollToChat();
    },
    [sendPlaybookAsk, strategyProfile?.primaryStrategy],
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

  const handleAnalyzePortfolio = useCallback(() => {
    const forceAnalyze = !hasPortfolioAnalysis(allPositions);

    if (forceAnalyze) {
      startPortfolioAnalysis();
    }

    if (activeSection !== "today") {
      pendingGoToAnalysisRef.current = { forceAnalyze };
      setActiveSection("today");
      return;
    }

    setPortfolioNavigation({
      token: Date.now(),
      forceAnalyze,
    });
    scrollToAnalysisSection(PORTFOLIO_ANALYSIS_SECTION_ID);
  }, [activeSection, allPositions, setActiveSection, startPortfolioAnalysis]);

  const handleTaxAlert = useCallback(
    (item: TaxAlertItem) => {
      handleSuggestedAction(item.actionId);
    },
    [handleSuggestedAction],
  );

  const showContent = !loading && allPositions.length > 0;
  const showBriefSection = showContent && sessionAccessToken;
  const {
    items: portfolioNewsItems,
    loading: portfolioNewsLoading,
    refreshing: portfolioNewsRefreshing,
    error: portfolioNewsError,
    lastUpdated: portfolioNewsLastUpdated,
    refetch: refetchPortfolioNews,
  } = usePortfolioNews(sessionAccessToken, {
    enabled: showContent && activeSection === "news",
  });
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

  const openStrategySetup = useCallback(() => {
    clearStrategyOnboardingDismissed();
    setStrategyDismissed(false);
    setShowStrategySetup(true);
  }, []);

  const hasStrategyPlaybook =
    showStrategyJourney && !!strategyProfile?.primaryStrategy;
  const showPlaybookColumn = hasStrategyPlaybook || !showStrategyJourney;
  const briefPlaybookPaired = showBriefSection && showPlaybookColumn;

  const strategyPlaybook = hasStrategyPlaybook && strategyProfile?.primaryStrategy && (
    <StrategyPlaybookPanel
      className={sectionClass}
      strategy={strategyProfile.primaryStrategy}
      accessToken={sessionAccessToken}
      wheelSymbols={strategyProfile.wheel?.wheelSymbols ?? []}
      wheelTargetDeltaMin={strategyProfile.wheel?.targetDeltaMin}
      wheelTargetDeltaMax={strategyProfile.wheel?.targetDeltaMax}
      wheelDteDays={30}
      recommendations={strategyRecommendations}
      loading={strategyLoading}
      catalogItem={
        catalog.find((item) => item.id === strategyProfile.primaryStrategy) ?? null
      }
      onRunAction={handlePlaybookAsk}
      onConnectSchwab={() => void connectSchwab()}
      connectingSchwab={connectingSchwab}
    />
  );

  return (
    <PageShell className={appStackClass}>
      {schwabReauth && (
        <SchwabConnectionBanner
          message={schwabReauth.message}
          authorizationUrl={schwabReauth.authorizationUrl}
        />
      )}

      {error && !schwabReauth && <ErrorBanner message={error} />}

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

      {!showContent && !loading && (
        <PortfolioOnboarding className={sectionClass} />
      )}

      {(showContent || loading) && (
        <PortfolioSnapshot
          className={sectionClass}
          loading={loading}
          allPositions={allPositions}
          symbols={symbols}
          account={account}
          cashSecuredPutSummary={cashSecuredPutSummary}
          portfolioMetrics={portfolioMetrics}
          briefPending={
            briefLoading && !displayBrief
              ? true
              : positionsDataFreshness?.briefStatus === "pending"
          }
          positionsSyncedAt={parsePositionsSyncedAt(
            positionsDataFreshness?.positionsSyncedAt,
          )}
        />
      )}

      {showContent && (
        <>
          {!showStrategyWizard && needsOnboarding && sessionAccessToken && (
            <PortfolioStrategyNudge
              className={sectionClass}
              onStart={openStrategySetup}
            />
          )}

          <div className="sticky top-14 z-10 -mx-1 border-b border-border/60 bg-background/95 px-1 py-3 backdrop-blur-md sm:-mx-0">
            <PortfolioSectionTabBar
              activeSection={activeSection}
              onChange={handleSectionChange}
              badges={{
                today: todayBadgeCount,
                activity: activityBadgeCount,
              }}
            />
          </div>

          {activeSection === "today" && (
            <div
              id="portfolio-panel-today"
              role="tabpanel"
              aria-labelledby="portfolio-tab-today"
              className={appStackClass}
            >
              <PortfolioAttentionSection
                className={sectionClass}
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

              {(showBriefSection || strategyPlaybook || !showStrategyJourney) && (
                <div
                  className={cn(
                    portfolioTodayPairGridClass,
                    briefPlaybookPaired && portfolioTodayPairGridPairedClass,
                  )}
                >
                  {showBriefSection && (
                    <PortfolioBriefSection
                      className={sectionClass}
                      brief={displayBrief}
                      changes={morningBrief?.changes}
                      changesLoading={briefLoading && !morningBrief}
                      fallbackAlerts={proactiveAlerts}
                      loading={briefLoading && !displayBrief}
                      error={displayBrief ? null : briefError}
                      lastUpdated={briefLastUpdated}
                      onGoDeeper={handleAnalyzePortfolio}
                      analyzeLoading={portfolioAnalysisLoading}
                      hideSuggestedActions
                    />
                  )}

                  {strategyPlaybook ??
                    (!showStrategyJourney ? (
                      <PortfolioOnboarding className={sectionClass} />
                    ) : null)}
                </div>
              )}

              <AnalysisPanel
                mode="portfolio"
                portfolioView="analysis"
                positions={allPositions}
                positionMap={positionMap}
                liquidationValue={
                  account?.securitiesAccount.currentBalances.liquidationValue
                }
                symbolAlertMap={symbolAlertMap}
                autoStart={pendingPortfolioAnalysis}
                progressiveDisclosure
                portfolioNavigation={portfolioNavigation}
                onLoadingChange={setPortfolioAnalysisLoading}
                onAskFollowUp={() => scrollToChat()}
                className={sectionClass}
              />
            </div>
          )}

          {activeSection === "news" && sessionAccessToken && (
            <div
              id="portfolio-panel-news"
              role="tabpanel"
              aria-labelledby="portfolio-tab-news"
            >
            <PortfolioNewsSection
              className={sectionClass}
              items={portfolioNewsItems}
              loading={portfolioNewsLoading}
              refreshing={portfolioNewsRefreshing}
              error={portfolioNewsError}
              lastUpdated={portfolioNewsLastUpdated}
              onRefresh={() => void refetchPortfolioNews()}
            />
            </div>
          )}

          {activeSection === "holdings" && (
            <div
              id="portfolio-panel-holdings"
              role="tabpanel"
              aria-labelledby="portfolio-tab-holdings"
            >
            <PageSplit
              main={
                <AnalysisPanel
                  mode="portfolio"
                  portfolioView="holdings"
                  positions={allPositions}
                  positionMap={positionMap}
                  liquidationValue={
                    account?.securitiesAccount.currentBalances.liquidationValue
                  }
                  symbolAlertMap={symbolAlertMap}
                  className={sectionClass}
                />
              }
              aside={
                <PortfolioRiskSection
                  cashSecuredPutSummary={cashSecuredPutSummary}
                  assignmentRiskSummary={assignmentRiskSummary}
                  cashBalance={
                    account?.securitiesAccount.currentBalances.cashBalance
                  }
                  className={sectionClass}
                />
              }
            />
            </div>
          )}

          {activeSection === "activity" && sessionAccessToken && (
            <div
              id="portfolio-panel-activity"
              role="tabpanel"
              aria-labelledby="portfolio-tab-activity"
            >
            <RecentActivitySection
              className={sectionClass}
              accessToken={sessionAccessToken}
              summary={recentActivity}
              showFullHistory
              onRefresh={() => refreshPositions(true)}
              onRunSuggestedAction={handleSuggestedAction}
              hideSuggestedActions
            />
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
