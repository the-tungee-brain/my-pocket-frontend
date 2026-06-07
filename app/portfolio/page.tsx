"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAppChatContext, usePortfolioContext } from "@/app/contextSelectors";
import { useToast } from "@/app/contexts/ToastContext";
import { useMorningBrief } from "@/app/hooks/useMorningBrief";
import { usePortfolioExitAttention } from "@/app/hooks/usePortfolioExitAttention";
import { usePortfolioNews } from "@/app/hooks/usePortfolioNews";
import type {
  AttentionItem,
  ProactiveAlert,
  SectorWeight,
} from "@/app/types/intelligence";
import type { PortfolioHoldingsNewsItem } from "@/app/types/portfolioNews";
import {
  buildSymbolSummaries,
  PortfolioHoldingsTable,
  sortSummaries,
} from "@/components/analysis/analysisPanelHoldings";
import { PageShell } from "@/components/PageShell";
import { PortfolioAttentionSection } from "@/components/PortfolioAttentionSection";
import { PortfolioOnboarding } from "@/components/PortfolioOnboarding";
import { PortfolioRiskSection } from "@/components/PortfolioRiskSection";
import { PortfolioSnapshot } from "@/components/PortfolioSnapshot";
import { RecentActivitySection } from "@/components/RecentActivitySection";
import { SchwabConnectionBanner } from "@/components/SchwabConnectionBanner";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { dismissPortfolioAlert } from "@/lib/apiClient";
import { appStackClass } from "@/lib/appUi";
import { parsePositionsSyncedAt } from "@/lib/dataFreshness";
import type { TaxAlertItem } from "@/lib/intelligence";
import {
  alertToQuickActionId,
  buildLocalPortfolioBrief,
  buildSymbolAlertMap,
  collectTaxAlertItems,
  formatSectorLabel,
  mergeDisplayAlerts,
} from "@/lib/intelligence";
import { pageSectionClass } from "@/lib/pageLayout";
import { scrollToChat } from "@/lib/scrollToChat";
import { cn } from "@/lib/utils";

const sectionClass = pageSectionClass;
const portfolioSectionTitleClass =
  "text-[11px] font-semibold uppercase tracking-wide text-muted";

function PortfolioSectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className={portfolioSectionTitleClass}>{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function SectorDiversificationSection({
  sectors,
  className,
}: {
  sectors: SectorWeight[];
  className?: string;
}) {
  const sorted = [...sectors].sort((a, b) => b.weightPct - a.weightPct);

  return (
    <section className={cn(sectionClass, "space-y-5", className)}>
      <PortfolioSectionHeader
        title="Diversification by sector"
        description="Allocation by sector."
      />
      {sorted.length ? (
        <div className="divide-y divide-border/60 border-t border-border/60">
          {sorted.slice(0, 8).map((sector) => (
            <div
              key={sector.sector}
              className="grid gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(10rem,20rem)_4.5rem] sm:items-center"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {formatSectorLabel(sector.sector)}
                </p>
                {sector.symbols.length ? (
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {sector.symbols.slice(0, 6).join(", ")}
                    {sector.symbols.length > 6 ? "…" : ""}
                  </p>
                ) : null}
              </div>
              <div className="h-2 bg-border/50">
                <div
                  className="h-full bg-foreground"
                  style={{
                    width: `${Math.max(0, Math.min(100, sector.weightPct))}%`,
                  }}
                />
              </div>
              <p className="text-left text-sm font-medium tabular-nums text-foreground sm:text-right">
                {sector.weightPct.toFixed(1)}%
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="border-t border-border/60 py-3 text-sm text-muted">
          Sector weights are not available yet.
        </p>
      )}
    </section>
  );
}

function PortfolioNewsPreview({
  items,
  loading,
  className,
}: {
  items: PortfolioHoldingsNewsItem[];
  loading?: boolean;
  className?: string;
}) {
  const visibleItems = items.slice(0, 5);
  const viewAllAction = (
    <Link
      href="/portfolio/news"
      className="text-xs font-medium text-foreground hover:underline"
    >
      View all →
    </Link>
  );

  return (
    <section className={cn(sectionClass, "space-y-4", className)}>
      <PortfolioSectionHeader
        title="Portfolio news"
        description="Latest headlines from larger holdings."
        action={viewAllAction}
      />
      {loading ? (
        <p className="border-t border-border/60 py-3 text-sm text-muted">
          Loading headlines…
        </p>
      ) : items.length ? (
        <ul className="divide-y divide-border/60 border-t border-border/60">
          {visibleItems.map((item) => (
            <li key={`${item.symbol}-${item.headline}`} className="py-3">
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-foreground hover:underline"
                >
                  <span className="font-mono">{item.symbol}</span>{" "}
                  {item.headline}
                </a>
              ) : (
                <p className="text-sm font-medium text-foreground">
                  <span className="font-mono">{item.symbol}</span>{" "}
                  {item.headline}
                </p>
              )}
              {[item.source, formatNewsTimestamp(item.publishedAt)].filter(
                Boolean,
              ).length > 0 ? (
                <p className="mt-1 text-xs text-muted">
                  {[item.source, formatNewsTimestamp(item.publishedAt)]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="border-t border-border/60 py-3 text-sm text-muted">
          No portfolio headlines available right now.
        </p>
      )}
    </section>
  );
}

function formatNewsTimestamp(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

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

  const { sendQuickAction, closeAllChatModelMenus } = useAppChatContext();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const schwabSuccessNotifiedRef = useRef(false);

  useEffect(() => {
    if (schwabSuccessNotifiedRef.current) return;
    if (searchParams.get("status") !== "success") return;
    schwabSuccessNotifiedRef.current = true;
    showToast("Schwab account connected.");
  }, [searchParams, showToast]);

  const localBrief = buildLocalPortfolioBrief(
    allPositions,
    account,
    proactiveAlerts,
  );
  const seedBrief = accountBrief ?? localBrief;
  const hasLoadedPositions = !loading && allPositions.length > 0;
  const [secondaryPortfolioLoadsReady, setSecondaryPortfolioLoadsReady] =
    useState(false);

  useEffect(() => {
    if (!hasLoadedPositions) {
      setSecondaryPortfolioLoadsReady(false);
      return;
    }
    const id = window.setTimeout(() => {
      setSecondaryPortfolioLoadsReady(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, [hasLoadedPositions]);

  const {
    morningBrief,
    portfolioBrief: fetchedBrief,
    loading: briefLoading,
    refetch: refetchMorningBrief,
  } = useMorningBrief(sessionAccessToken, {
    enabled: hasLoadedPositions && secondaryPortfolioLoadsReady,
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

  const handleAnalyzePortfolio = useCallback(() => {
    closeAllChatModelMenus();
    handleSuggestedAction("portfolio-review");
  }, [closeAllChatModelMenus, handleSuggestedAction]);

  const handleTaxAlert = useCallback(
    (item: TaxAlertItem) => {
      handleSuggestedAction(item.actionId);
    },
    [handleSuggestedAction],
  );

  const showContent = hasLoadedPositions;
  const { items: portfolioNewsItems, loading: portfolioNewsLoading } =
    usePortfolioNews(sessionAccessToken, {
      enabled: showContent && secondaryPortfolioLoadsReady,
    });
  const attentionQueue = morningBrief?.attentionQueue ?? [];

  const { items: exitAttentionItems, isLoading: exitAttentionLoading } =
    usePortfolioExitAttention({
      accessToken: sessionAccessToken,
      enabled: showContent && secondaryPortfolioLoadsReady,
      limit: 10,
    });

  const liquidationValue =
    account?.securitiesAccount.currentBalances.liquidationValue ?? null;
  const symbolSummaries = sortSummaries(
    buildSymbolSummaries(positionMap, liquidationValue),
    "weight",
    symbolAlertMap,
  );
  const sectorWeights =
    displayBrief?.digest?.sectorWeights ??
    morningBrief?.digest?.sectorWeights ??
    [];

  return (
    <PageShell className={appStackClass}>
      {schwabReauth && (
        <SchwabConnectionBanner
          message={schwabReauth.message}
          authorizationUrl={schwabReauth.authorizationUrl}
        />
      )}

      {error && !schwabReauth && <ErrorBanner message={error} />}

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
          <section className={cn(sectionClass, "space-y-4")}>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Diversification by stock
              </h2>
              <p className="mt-1 text-sm text-muted">
                Holdings sorted by portfolio weight.
              </p>
            </div>
            <PortfolioHoldingsTable
              summaries={symbolSummaries}
              symbolAlertMap={symbolAlertMap}
            />
            <PortfolioRiskSection
              cashSecuredPutSummary={cashSecuredPutSummary}
              assignmentRiskSummary={assignmentRiskSummary}
              cashBalance={
                account?.securitiesAccount.currentBalances.cashBalance
              }
            />
          </section>

          <SectorDiversificationSection sectors={sectorWeights} />

          <PortfolioAttentionSection
            className={sectionClass}
            taxItems={taxItems}
            alerts={mergedAlerts}
            attentionItems={attentionQueue}
            suggestedActions={recentActivity?.suggestedActions ?? []}
            exitItems={exitAttentionLoading ? [] : exitAttentionItems}
            onRunAlert={handleRunAlert}
            onRunAttentionItem={handleRunAttentionItem}
            onDismissAttention={handleDismissAttention}
            onRunTax={handleTaxAlert}
            onRunActionId={handleSuggestedAction}
            compact
            compactTitle="Optimization suggestions"
            compactActionLabel="Review with AI"
            onCompactAction={handleAnalyzePortfolio}
            maxVisible={5}
          />

          {sessionAccessToken && (
            <RecentActivitySection
              className={sectionClass}
              accessToken={sessionAccessToken}
              summary={recentActivity}
              onRefresh={() => refreshPositions(true)}
              onRunSuggestedAction={handleSuggestedAction}
              compact
              hideSuggestedActions
            />
          )}

          {sessionAccessToken && (
            <PortfolioNewsPreview
              items={portfolioNewsItems}
              loading={portfolioNewsLoading}
            />
          )}
        </>
      )}
    </PageShell>
  );
}
