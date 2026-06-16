"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAppChatContext, usePortfolioContext } from "@/app/contextSelectors";
import { useToast } from "@/app/contexts/ToastContext";
import { usePortfolioNews } from "@/app/hooks/usePortfolioNews";
import { usePortfolioOptimization } from "@/app/hooks/usePortfolioOptimization";
import type { PortfolioHoldingsNewsItem } from "@/app/types/portfolioNews";
import {
  buildSymbolSummaries,
  PortfolioHoldingsTable,
  sortSummaries,
} from "@/components/analysis/analysisPanelHoldings";
import { PageShell } from "@/components/PageShell";
import { PortfolioOnboarding } from "@/components/PortfolioOnboarding";
import {
  DiversificationScoreSection,
  OptimizationSuggestionsSection,
  SectorDiversificationRows,
} from "@/components/PortfolioOptimizationSection";
import { PortfolioRiskSection } from "@/components/PortfolioRiskSection";
import { PortfolioSnapshot } from "@/components/PortfolioSnapshot";
import { RecentActivitySection } from "@/components/RecentActivitySection";
import { SchwabConnectionBanner } from "@/components/SchwabConnectionBanner";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { LoadingRegion } from "@/components/ui/LoadingRegion";
import { Skeleton } from "@/components/ui/Skeleton";
import { appStackClass } from "@/lib/appUi";
import { parsePositionsSyncedAt } from "@/lib/dataFreshness";
import {
  buildLocalPortfolioBrief,
  buildSymbolAlertMap,
  mergeDisplayAlerts,
} from "@/lib/intelligence";
import { pageSectionClass } from "@/lib/pageLayout";
import { buildLocalPortfolioOptimization } from "@/lib/portfolioOptimization";
import { scrollToChat } from "@/lib/scrollToChat";
import { cn } from "@/lib/utils";

const sectionClass = pageSectionClass;
const portfolioSectionTitleClass =
  "text-[11px] font-semibold uppercase tracking-wide text-muted";
const portfolioChapterClass =
  "mx-0 w-full max-w-none scroll-mt-24 border-t border-border/60 pt-8 first:border-t-0 first:pt-0";

function PortfolioChapter({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const titleId = `${id}-title`;

  return (
    <section
      id={id}
      aria-labelledby={titleId}
      className={cn(portfolioChapterClass, "space-y-5")}
    >
      <div className="max-w-3xl">
        <h2
          id={titleId}
          className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
        >
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      <div className="space-y-8">{children}</div>
    </section>
  );
}

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

function SectionHeadingSkeleton({
  descriptionWidth = "max-w-sm",
}: {
  descriptionWidth?: string;
}) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-3 w-36" />
      <Skeleton className={cn("h-4 w-full", descriptionWidth)} />
    </div>
  );
}

function ChapterHeadingSkeleton({ width = "w-48" }: { width?: string }) {
  return (
    <div className="space-y-2">
      <Skeleton className={cn("h-6", width)} />
      <Skeleton className="h-4 w-full max-w-lg" />
    </div>
  );
}

function PortfolioMetricSkeleton() {
  return (
    <div className="min-w-0 space-y-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-6 w-24 sm:w-28" />
    </div>
  );
}

function PortfolioHeaderSkeleton() {
  return (
    <section className={cn(sectionClass, "space-y-5")}>
      <header className="flex flex-col gap-3 border-b border-border/60 pb-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 space-y-2">
          <Skeleton className="h-3 w-32" />
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <Skeleton className="h-7 w-24" />
      </header>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.75fr)] lg:items-start">
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-11 w-60 max-w-full sm:h-12" />
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <PortfolioMetricSkeleton key={index} />
            ))}
          </div>
        </div>
        <div className="space-y-3 border-t border-border/60 pt-4 lg:border-t-0 lg:pt-0">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-5 w-28" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-14" />
            ))}
          </div>
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
    </section>
  );
}

function PortfolioHoldingsTableSkeleton() {
  const rows = Array.from({ length: 6 }, (_, index) => index);

  return (
    <>
      <div className="hidden overflow-x-auto scrollbar-dark md:block">
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col className="w-[28%]" />
            <col className="w-[16%]" />
            <col className="w-[10%]" />
            <col className="w-[15%]" />
            <col className="w-[15%]" />
            <col className="w-[16%]" />
          </colgroup>
          <thead className="border-b border-border/60">
            <tr>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <th key={index} className="py-2.5">
                  <Skeleton
                    className={cn(
                      "h-3",
                      index === 0
                        ? "w-14"
                        : index === 1
                          ? "w-20"
                          : "ml-auto w-16",
                    )}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((index) => (
              <tr key={index} className="border-t border-border/60">
                <td className="py-3">
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-14" />
                    {index < 3 ? <Skeleton className="h-3 w-32" /> : null}
                  </div>
                </td>
                <td className="py-3">
                  <Skeleton className="h-2 w-full" />
                </td>
                <td className="py-3">
                  <Skeleton className="ml-auto h-4 w-12" />
                </td>
                <td className="py-3">
                  <Skeleton className="ml-auto h-4 w-20" />
                </td>
                <td className="py-3">
                  <Skeleton className="ml-auto h-4 w-20" />
                </td>
                <td className="py-3">
                  <div className="space-y-1.5">
                    <Skeleton className="ml-auto h-4 w-20" />
                    {index % 2 === 0 ? (
                      <Skeleton className="ml-auto h-3 w-14" />
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-border/60 md:hidden">
        {rows.slice(0, 5).map((index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-3 py-3"
          >
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-1.5 w-36 max-w-full" />
              {index < 2 ? <Skeleton className="h-3 w-36" /> : null}
            </div>
            <div className="shrink-0 space-y-1.5">
              <Skeleton className="ml-auto h-4 w-20" />
              <Skeleton className="ml-auto h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function PortfolioPageSkeleton({
  showAccountSections,
}: {
  showAccountSections: boolean;
}) {
  const scoreRows = Array.from({ length: 5 }, (_, index) => index);
  const sectorRows = Array.from({ length: 5 }, (_, index) => index);
  const newsRows = Array.from({ length: 3 }, (_, index) => index);

  return (
    <LoadingRegion
      label="Loading portfolio dashboard"
      className={appStackClass}
    >
      <section className={cn(portfolioChapterClass, "space-y-5")}>
        <ChapterHeadingSkeleton width="w-44" />
        <PortfolioHeaderSkeleton />
      </section>

      <section className={cn(portfolioChapterClass, "space-y-5")}>
        <ChapterHeadingSkeleton width="w-40" />
        <div className={cn(sectionClass, "space-y-4")}>
          <div className="flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-36" />
              <div className="flex flex-wrap items-end gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-5 w-28" />
              </div>
            </div>
            <div className="w-full max-w-md space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>
          <div className="divide-y divide-border/60">
            {scoreRows.map((index) => (
              <div
                key={index}
                className="grid gap-2 py-3 sm:grid-cols-[11rem_minmax(0,1fr)_5.5rem] sm:items-start"
              >
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-16 sm:ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={cn(portfolioChapterClass, "space-y-5")}>
        <ChapterHeadingSkeleton width="w-44" />
        <section className={cn(sectionClass, "space-y-4")}>
          <SectionHeadingSkeleton />
          <PortfolioHoldingsTableSkeleton />
        </section>
      </section>

      <section className={cn(portfolioChapterClass, "space-y-5")}>
        <ChapterHeadingSkeleton width="w-56" />
        <section className={cn(sectionClass, "space-y-4")}>
          <SectionHeadingSkeleton descriptionWidth="max-w-lg" />
          <div className="divide-y divide-border/60 border-t border-border/60">
            {sectorRows.map((index) => (
              <div
                key={index}
                className="grid gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(10rem,20rem)_4.5rem] sm:items-center"
              >
                <div className="min-w-0 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-44 max-w-full" />
                </div>
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-4 w-14 sm:ml-auto" />
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className={cn(portfolioChapterClass, "space-y-5")}>
        <ChapterHeadingSkeleton width="w-64" />
        <section className={cn(sectionClass, "space-y-4")}>
          <SectionHeadingSkeleton />
          <div className="divide-y divide-border/60 border-t border-border/60">
            {[0, 1, 2].map((index) => (
              <div
                key={index}
                className="grid gap-2 py-3 sm:grid-cols-[3rem_minmax(0,1fr)_8rem]"
              >
                <Skeleton className="h-4 w-6" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-52 max-w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
                <div className="space-y-1.5 sm:text-right">
                  <Skeleton className="h-4 w-16 sm:ml-auto" />
                  <Skeleton className="h-3 w-14 sm:ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>

      {showAccountSections && (
        <section className={cn(portfolioChapterClass, "space-y-5")}>
          <ChapterHeadingSkeleton width="w-44" />
          <section className={cn(sectionClass, "space-y-4")}>
            <SectionHeadingSkeleton descriptionWidth="max-w-md" />
            <div className="divide-y divide-border/60 border-t border-border/60">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="grid gap-3 py-3 sm:grid-cols-[8rem_minmax(0,1fr)_7rem] sm:items-center"
                >
                  <Skeleton className="h-4 w-24" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-56 max-w-full" />
                    <Skeleton className="h-3 w-40 max-w-full" />
                  </div>
                  <Skeleton className="h-4 w-20 sm:ml-auto" />
                </div>
              ))}
            </div>
          </section>

          <section className={cn(sectionClass, "space-y-4")}>
            <SectionHeadingSkeleton descriptionWidth="max-w-xs" />
            <div className="divide-y divide-border/60 border-t border-border/60">
              {newsRows.map((index) => (
                <div key={index} className="space-y-2 py-3">
                  <Skeleton className="h-4 w-full max-w-2xl" />
                  <Skeleton className="h-3 w-40" />
                </div>
              ))}
            </div>
          </section>
        </section>
      )}
    </LoadingRegion>
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

  const { sendQuickAction } = useAppChatContext();
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

  const displayBrief = seedBrief;

  const mergedAlerts = mergeDisplayAlerts(proactiveAlerts, displayBrief);

  const symbolAlertMap = buildSymbolAlertMap(mergedAlerts, displayBrief);

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

  const showContent = hasLoadedPositions;
  const localOptimization = useMemo(
    () =>
      showContent
        ? buildLocalPortfolioOptimization({
            positions: allPositions,
            account,
          })
        : null,
    [account, allPositions, showContent],
  );
  const { optimization: backendOptimization, loading: optimizationLoading } =
    usePortfolioOptimization(sessionAccessToken, {
      enabled: showContent && secondaryPortfolioLoadsReady,
    });
  const backendOptimizationHasHoldings =
    (backendOptimization?.stockWeights.length ?? 0) > 0;
  const optimization =
    backendOptimizationHasHoldings || optimizationLoading
      ? backendOptimization
      : localOptimization;
  const { items: portfolioNewsItems, loading: portfolioNewsLoading } =
    usePortfolioNews(sessionAccessToken, {
      enabled: showContent && secondaryPortfolioLoadsReady,
    });

  const liquidationValue =
    account?.securitiesAccount.currentBalances.liquidationValue ?? null;
  const symbolSummaries = sortSummaries(
    buildSymbolSummaries(positionMap, liquidationValue),
    "weight",
    symbolAlertMap,
  );
  const sectorWeights =
    optimization?.sectorWeights ?? displayBrief?.digest?.sectorWeights ?? [];

  return (
    <PageShell className={appStackClass}>
      {schwabReauth && (
        <SchwabConnectionBanner
          message={schwabReauth.message}
          authorizationUrl={schwabReauth.authorizationUrl}
        />
      )}

      {error && !schwabReauth && <ErrorBanner message={error} />}

      {loading && (
        <PortfolioPageSkeleton showAccountSections={!!sessionAccessToken} />
      )}

      {!showContent && !loading && (
        <PortfolioOnboarding className={sectionClass} />
      )}

      {showContent && (
        <PortfolioChapter
          id="portfolio-summary"
          title="Portfolio Summary"
          description="Your account value, performance, and cash position"
        >
          <PortfolioSnapshot
            className={sectionClass}
            allPositions={allPositions}
            symbols={symbols}
            account={account}
            cashSecuredPutSummary={cashSecuredPutSummary}
            portfolioMetrics={portfolioMetrics}
            portfolioOptimization={optimization ?? localOptimization}
            briefPending={positionsDataFreshness?.briefStatus === "pending"}
            positionsSyncedAt={parsePositionsSyncedAt(
              positionsDataFreshness?.positionsSyncedAt,
            )}
          />
        </PortfolioChapter>
      )}

      {showContent && (
        <>
          <PortfolioChapter
            id="portfolio-health"
            title="Portfolio Health"
            description="Diversification, concentration risk, and portfolio quality"
          >
            <DiversificationScoreSection
              className={sectionClass}
              optimization={optimization}
              loading={optimizationLoading && !optimization}
            />
            <PortfolioRiskSection
              cashSecuredPutSummary={cashSecuredPutSummary}
              assignmentRiskSummary={assignmentRiskSummary}
              cashBalance={
                account?.securitiesAccount.currentBalances.cashBalance
              }
            />
          </PortfolioChapter>

          <PortfolioChapter
            id="holdings-allocation"
            title="Holdings"
            description="What you own and how much each position contributes to the portfolio."
          >
            <section className={cn(sectionClass, "space-y-6")}>
              <SectorDiversificationRows sectors={sectorWeights} />
              <div>
                <h3 className={portfolioSectionTitleClass}>All holdings</h3>
                <p className="mt-1 text-sm text-muted">
                  Full review table with weight, value, and performance.
                </p>
              </div>
              <PortfolioHoldingsTable
                summaries={symbolSummaries}
                symbolAlertMap={symbolAlertMap}
              />
            </section>
          </PortfolioChapter>

          <PortfolioChapter
            id="optimization-suggestions"
            title="Optimization Suggestions"
            description="Potential actions to improve diversification and reduce risk"
          >
            <OptimizationSuggestionsSection
              className={sectionClass}
              optimization={optimization}
            />
          </PortfolioChapter>

          {sessionAccessToken && (
            <PortfolioChapter
              id="portfolio-insights"
              title="Portfolio Insights"
              description="Recent account activity and headlines from larger holdings"
            >
              <RecentActivitySection
                className={sectionClass}
                accessToken={sessionAccessToken}
                summary={recentActivity}
                onRefresh={() => refreshPositions(true)}
                onRunSuggestedAction={handleSuggestedAction}
                compact
                hideSuggestedActions
              />
              <PortfolioNewsPreview
                items={portfolioNewsItems}
                loading={portfolioNewsLoading}
              />
            </PortfolioChapter>
          )}
        </>
      )}
    </PageShell>
  );
}
