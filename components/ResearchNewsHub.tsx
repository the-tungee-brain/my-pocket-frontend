"use client";

import { useCallback, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  FileText,
  List,
  Newspaper,
  RefreshCw,
} from "lucide-react";
import { useAccountPlan } from "@/app/hooks/useAccountPlan";
import { useCompanyNews } from "@/app/hooks/useCompanyNews";
import { usePressReleases } from "@/app/hooks/usePressReleases";
import { ProFeatureGate } from "@/components/ProFeatureGate";
import { hasProFeature } from "@/lib/planFeatures";
import NewsAnalytics, {
  NewsAsideSections,
  NewsOverviewContent,
} from "@/components/NewsAnalytics";
import {
  LoadingSurface,
  NewsOverviewLoading,
} from "@/components/ui/ContentLoading";
import {
  enrichedNewsItemToDisplay,
  NewsHeadlinesPanel,
  NewsHeadlinesSkeleton,
  pressReleaseToDisplay,
} from "@/components/NewsHeadlinesFeed";
import { PageSplit } from "@/components/PageShell";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { IconButton } from "@/components/ui/IconButton";
import { appStackClass, appTabBarClass, appTabLinkClass } from "@/lib/appUi";
import { cn } from "@/lib/utils";
import { FreshnessLabel } from "@/components/ui/FreshnessLabel";

const FEED_PREVIEW_LIMIT = 4;

export type NewsFeedScope = "all" | "official" | "coverage";

type Props = {
  symbol: string;
  accessToken?: string;
  className?: string;
};

type ScopeTab = {
  id: NewsFeedScope;
  label: string;
  count: number | null;
};

function NewsFeedScopeTabs({
  scope,
  onChange,
  tabs,
}: {
  scope: NewsFeedScope;
  onChange: (scope: NewsFeedScope) => void;
  tabs: ScopeTab[];
}) {
  return (
    <div
      className={cn(appTabBarClass, "w-full")}
      role="tablist"
      aria-label="News feed sections"
    >
      {tabs.map((tab) => {
        const active = scope === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(appTabLinkClass(active), "flex-1 justify-center gap-1.5")}
          >
            <span>{tab.label}</span>
            {tab.count != null && tab.count > 0 ? (
              <span
                className={cn(
                  "inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold tabular-nums",
                  active
                    ? "bg-accent/20 text-accent-strong"
                    : "bg-muted-bg text-muted",
                )}
              >
                {tab.count > 99 ? "99+" : tab.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function ViewAllLink({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-sm font-medium text-accent-strong hover:underline"
    >
      {label}
      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
    </button>
  );
}

function OfficialEmptyHint() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted-bg/40 px-4 py-5 text-sm text-muted">
      <p className="font-medium text-foreground">No recent press releases</p>
      <p className="mt-1 leading-relaxed">
        When the company issues IR announcements, they appear here—separate from
        media coverage below.
      </p>
    </div>
  );
}

export function ResearchNewsHub({ symbol, accessToken, className }: Props) {
  const [scope, setScope] = useState<NewsFeedScope>("all");
  const { data: session } = useSession();
  const { isPaid, plan } = useAccountPlan(session?.accessToken ?? accessToken);
  const newsAiPlanAllowed = hasProFeature(isPaid, "newsAi", plan);

  const {
    analytics,
    isLoading: coverageLoading,
    isRefreshing: coverageRefreshing,
    error: coverageError,
    lastUpdated: coverageUpdated,
    refresh: refreshCoverage,
  } = useCompanyNews(symbol, accessToken, Boolean(symbol && accessToken));

  const {
    items: officialItems,
    isLoading: officialLoading,
    isRefreshing: officialRefreshing,
    error: officialError,
    lastUpdated: officialUpdated,
    refetch: refetchOfficial,
  } = usePressReleases(symbol, accessToken, {
    enabled: Boolean(symbol && accessToken),
  });

  const showAiNews =
    newsAiPlanAllowed && (analytics?.aiEnrichment ?? true);

  const coverageDisplay = useMemo(
    () => (analytics ? analytics.items.map(enrichedNewsItemToDisplay) : []),
    [analytics],
  );

  const officialDisplay = useMemo(
    () => officialItems.map(pressReleaseToDisplay),
    [officialItems],
  );

  const officialCount = officialDisplay.length;
  const coverageCount = coverageDisplay.length;

  const tabs: ScopeTab[] = useMemo(
    () => [
      { id: "all", label: "All", count: officialCount + coverageCount || null },
      { id: "official", label: "From company", count: officialCount || null },
      {
        id: "coverage",
        label: "Market coverage",
        count: coverageCount || null,
      },
    ],
    [coverageCount, officialCount],
  );

  const refreshAll = useCallback(() => {
    refreshCoverage();
    void refetchOfficial();
  }, [refetchOfficial, refreshCoverage]);

  const busy =
    (coverageLoading && !analytics) ||
    coverageRefreshing ||
    (officialLoading && officialCount === 0) ||
    officialRefreshing ||
    (scope !== "coverage" && !accessToken);

  const latestUpdated = useMemo(() => {
    const times = [coverageUpdated, officialUpdated].filter(
      (t): t is number => t != null,
    );
    if (!times.length) return null;
    return Math.max(...times);
  }, [coverageUpdated, officialUpdated]);

  const header = (
    <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <NewsFeedScopeTabs scope={scope} onChange={setScope} tabs={tabs} />
      <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
        <FreshnessLabel updatedAt={latestUpdated} pending={busy} />
        <IconButton
          size="sm"
          onClick={refreshAll}
          disabled={busy || !accessToken}
          aria-label="Refresh news"
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", busy && "animate-spin")}
            aria-hidden
          />
        </IconButton>
      </div>
    </div>
  );

  if (!accessToken) {
    return (
      <div className={cn(appStackClass, className)}>
        {header}
        <p className="text-sm text-muted">Sign in to load news for this symbol.</p>
      </div>
    );
  }

  if (scope === "coverage") {
    return (
      <div className={cn(appStackClass, className)}>
        {header}
        {coverageError ? (
          <ErrorBanner message={coverageError} onRetry={refreshCoverage} />
        ) : null}
        <NewsAnalytics
          analytics={analytics}
          isLoading={coverageLoading}
          isRefreshing={coverageRefreshing}
          lastUpdated={coverageUpdated}
          onRefresh={refreshCoverage}
          headlinesOnly
          showAiEnrichment={showAiNews}
        />
      </div>
    );
  }

  if (scope === "official") {
    return (
      <div className={cn(appStackClass, className)}>
        {header}
        {officialError ? (
          <ErrorBanner message={officialError} onRetry={() => void refetchOfficial()} />
        ) : null}
        <ResearchSectionCard
          title="From the company"
          description="Press releases and IR announcements—what the company said, not media opinion"
          icon={FileText}
          bodyClassName="min-w-0"
        >
          <NewsHeadlinesPanel
            items={officialDisplay}
            isLoading={officialLoading}
            isRefreshing={officialRefreshing}
            showSentimentFilters={false}
            emptyMessage="No press releases available for this symbol right now."
          />
        </ResearchSectionCard>
      </div>
    );
  }

  const showCoverageBlock =
    coverageLoading || coverageError || coverageCount > 0 || analytics;

  return (
    <div className={cn(appStackClass, className)}>
      {header}

      {coverageError ? (
        <ErrorBanner message={coverageError} onRetry={refreshCoverage} />
      ) : null}
      {officialError ? (
        <ErrorBanner message={officialError} onRetry={() => void refetchOfficial()} />
      ) : null}

      <PageSplit
        main={
          <div className={cn(appStackClass, "min-w-0")}>
            <ResearchSectionCard
              title="AI news brief"
              description={
                showAiNews && analytics
                  ? `${coverageCount} stories analyzed`
                  : showAiNews
                    ? "Synthesizing recent headlines…"
                    : "Pro — synthesized from recent headlines"
              }
              icon={Newspaper}
              bodyClassName="min-w-0"
            >
              <ProFeatureGate feature="newsAi" allowed={showAiNews}>
                <LoadingSurface
                  loading={showAiNews && coverageLoading && !analytics}
                  refreshing={showAiNews && coverageRefreshing && !!analytics}
                  hasContent={!!analytics}
                  label="Loading news brief"
                  skeleton={<NewsOverviewLoading />}
                >
                  {analytics ? <NewsOverviewContent data={analytics} /> : null}
                </LoadingSurface>
              </ProFeatureGate>
            </ResearchSectionCard>

            {showCoverageBlock ? (
              <ResearchSectionCard
                title="Market coverage"
                description={
                  showAiNews
                    ? "Headlines with AI sentiment and summaries"
                    : "Recent headlines from market coverage"
                }
                icon={List}
                bodyClassName="min-w-0"
              >
                <LoadingSurface
                  loading={coverageLoading && coverageCount === 0}
                  refreshing={coverageRefreshing || (coverageLoading && coverageCount > 0)}
                  hasContent={coverageCount > 0}
                  label="Loading market coverage"
                  skeleton={
                    <NewsHeadlinesSkeleton view="grid" rows={3} />
                  }
                >
                  {coverageCount > 0 ? (
                    <NewsHeadlinesPanel
                      items={coverageDisplay}
                      isRefreshing={coverageRefreshing}
                      itemLimit={FEED_PREVIEW_LIMIT}
                      defaultView="grid"
                      hideViewToggle
                      showSentimentFilters={showAiNews}
                      showSentiment={showAiNews}
                      footer={
                        coverageCount > FEED_PREVIEW_LIMIT ? (
                          <ViewAllLink
                            label={`View all ${coverageCount} stories`}
                            onClick={() => setScope("coverage")}
                          />
                        ) : null
                      }
                    />
                  ) : (
                    <p className="text-sm text-muted">
                      No enriched market headlines yet.
                    </p>
                  )}
                </LoadingSurface>
              </ResearchSectionCard>
            ) : null}

            <ResearchSectionCard
              title="From the company"
              description="Official press releases—investor relations, not newsroom opinion"
              icon={FileText}
              bodyClassName="min-w-0"
            >
              <LoadingSurface
                loading={officialLoading && officialCount === 0}
                refreshing={officialRefreshing}
                hasContent={officialCount > 0}
                label="Loading official releases"
                skeleton={
                  <NewsHeadlinesSkeleton view="grid" rows={3} label="Loading official releases" />
                }
              >
                {officialCount > 0 ? (
                  <NewsHeadlinesPanel
                    items={officialDisplay}
                    isRefreshing={officialRefreshing}
                    showSentimentFilters={false}
                    itemLimit={FEED_PREVIEW_LIMIT}
                    hideToolbar
                    footer={
                      officialCount > FEED_PREVIEW_LIMIT ? (
                        <ViewAllLink
                          label={`View all ${officialCount} official releases`}
                          onClick={() => setScope("official")}
                        />
                      ) : null
                    }
                  />
                ) : (
                  <OfficialEmptyHint />
                )}
              </LoadingSurface>
            </ResearchSectionCard>
          </div>
        }
        aside={
          showAiNews ? (
            <NewsAsideSections
              data={analytics}
              loading={coverageLoading && !analytics}
              refreshing={coverageRefreshing}
            />
          ) : (
            <ProFeatureGate feature="newsAi" allowed={false} />
          )
        }
      />
    </div>
  );
}
