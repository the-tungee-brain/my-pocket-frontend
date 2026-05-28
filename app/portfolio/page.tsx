"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { usePositionsContext } from "../Providers";
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
import { StrategyPlaybookPanel } from "@/components/StrategyPlaybookPanel";
import { StrategyOnboardingWizard } from "@/components/StrategyOnboardingWizard";
import { PortfolioSectionTabBar } from "@/components/PortfolioSectionTabBar";
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
import { pageSectionClass } from "@/lib/pageLayout";
import { PageShell, PageSplit } from "@/components/PageShell";
import { cn } from "@/lib/utils";

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
    sendPrompt,
    sendPlaybookAsk,
    schwabReauth,
    closeAllChatModelMenus,
  } = usePositionsContext();
  const { activeSection, setActiveSection } = usePortfolioSection();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const defaultTabApplied = useRef(false);
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
    refreshRecommendations,
  } = useStrategyContext();
  const { connect: connectSchwab, connecting: connectingSchwab } = useSchwabConnect();
  const [refreshingPlaybook, setRefreshingPlaybook] = useState(false);

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

  const handlePlaybookRefresh = useCallback(async () => {
    setRefreshingPlaybook(true);
    try {
      await refreshRecommendations();
    } finally {
      setRefreshingPlaybook(false);
    }
  }, [refreshRecommendations]);

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
    <PageShell>
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
        <div
          className={cn(
            pageSectionClass,
            "mb-4 rounded-xl border border-border bg-background/40 px-4 py-3 text-sm text-muted",
          )}
        >
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

      {showStrategyJourney && strategyProfile?.primaryStrategy && (
        <StrategyPlaybookPanel
          className={cn(pageSectionClass, "mb-6")}
          strategy={strategyProfile.primaryStrategy}
          recommendations={strategyRecommendations}
          loading={strategyLoading}
          refreshing={refreshingPlaybook}
          onRefresh={() => void handlePlaybookRefresh()}
          catalogItem={
            catalog.find((item) => item.id === strategyProfile.primaryStrategy) ??
            null
          }
          onRunAction={handlePlaybookAsk}
          onConnectSchwab={() => void connectSchwab()}
          connectingSchwab={connectingSchwab}
        />
      )}

      {!showStrategyWizard && !needsOnboarding && !showStrategyJourney && (
        <PortfolioOnboarding className={pageSectionClass} />
      )}

      {(showContent || loading) && (
        <PortfolioSnapshot
          className={cn(pageSectionClass, "mb-4")}
          loading={loading}
          allPositions={allPositions}
          symbols={symbols}
          account={account}
          cashSecuredPutSummary={cashSecuredPutSummary}
          portfolioMetrics={portfolioMetrics}
        />
      )}

      {showContent && (
        <div className="sticky top-14 z-10 mb-4 border-b border-border/60 bg-background/95 pb-3 pt-1 backdrop-blur-md">
          <PortfolioSectionTabBar
            activeSection={activeSection}
            onChange={handleSectionChange}
            badges={{
              today: todayBadgeCount,
              activity: activityBadgeCount,
            }}
            className={cn(pageSectionClass, "mb-0")}
          />
        </div>
      )}

      {showContent && activeSection === "today" && (
        <PageSplit
          main={
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
              portfolioNavigation={portfolioNavigation}
              onLoadingChange={setPortfolioAnalysisLoading}
              onAskFollowUp={() => scrollToChat()}
              className={pageSectionClass}
            />
          }
          aside={
            <>
              <PortfolioAttentionSection
                className={pageSectionClass}
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
                  className={pageSectionClass}
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
            </>
          }
        />
      )}

      {showContent && activeSection === "holdings" && (
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
              className={cn(pageSectionClass, "mb-0")}
            />
          }
          aside={
            <PortfolioRiskSection
              cashSecuredPutSummary={cashSecuredPutSummary}
              assignmentRiskSummary={assignmentRiskSummary}
              cashBalance={account?.securitiesAccount.currentBalances.cashBalance}
              className={cn(pageSectionClass, "mb-0")}
            />
          }
        />
      )}

      {showContent && activeSection === "activity" && sessionAccessToken && (
        <RecentActivitySection
          className={pageSectionClass}
          accessToken={sessionAccessToken}
          summary={recentActivity}
          onRefresh={() => refreshPositions(true)}
          onRunSuggestedAction={handleSuggestedAction}
          hideSuggestedActions
        />
      )}
    </PageShell>
  );
}
