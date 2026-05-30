"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  ArrowRight,
  FileText,
  List,
  Newspaper,
  RefreshCw,
} from "lucide-react";
import { useProFeature } from "@/app/hooks/useAccountPlan";
import { invalidateCompanyNewsCache, useCompanyNews } from "@/app/hooks/useCompanyNews";
import { usePressReleases } from "@/app/hooks/usePressReleases";
import { ProFeatureGate } from "@/components/ProFeatureGate";
import NewsAnalytics, {
  AnalyzeNewsPrompt,
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
  const token = session?.accessToken ?? accessToken;
  const {
    allowed: newsAiAllowed,
    resolved: planResolved,
  } = useProFeature(token, "newsAi");
  const prevNewsAiAllowedRef = useRef<boolean | null>(null);

  const {
    analytics,
    isLoading: coverageLoading,
    isRefreshing: coverageRefreshing,
    isAnalyzing: coverageAnalyzing,
    error: coverageError,
    lastUpdated: coverageUpdated,
    lastAnalyzedAt: coverageAnalyzedAt,
    refresh: refreshCoverage,
    analyzeNews,
  } = useCompanyNews(symbol, accessToken, Boolean(symbol && accessToken));

  useEffect(() => {
    if (!planResolved) return;

    const prev = prevNewsAiAllowedRef.current;
    if (prev === false && newsAiAllowed) {
      invalidateCompanyNewsCache(symbol);
      refreshCoverage();
    }
    prevNewsAiAllowedRef.current = newsAiAllowed;
  }, [newsAiAllowed, planResolved, refreshCoverage, symbol]);

  const {
    items: officialItems,
    isLoading: officialLoading,
    isRefreshing: officialRefreshing,
    error: officialError,
    refetch: refetchOfficial,
  } = usePressReleases(symbol, accessToken, {
    enabled: Boolean(symbol && accessToken),
  });

  const hasAiAnalysis = analytics?.aiEnrichment === true;

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
      {
        id: "coverage",
        label: "Market coverage",
        count: coverageCount || null,
      },
      { id: "official", label: "From company", count: officialCount || null },
    ],
    [coverageCount, officialCount],
  );

  const header = (
    <NewsFeedScopeTabs scope={scope} onChange={setScope} tabs={tabs} />
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
        <PageSplit
          main={
            <NewsAnalytics
              analytics={analytics}
              isLoading={coverageLoading}
              isRefreshing={coverageRefreshing}
              isAnalyzing={coverageAnalyzing}
              lastUpdated={coverageUpdated}
              lastAnalyzedAt={coverageAnalyzedAt}
              onRefresh={refreshCoverage}
              onAnalyzeNews={newsAiAllowed ? () => analyzeNews() : undefined}
              headlinesOnly
              showAiEnrichment={newsAiAllowed}
            />
          }
          aside={
            <NewsAsideSections
              data={analytics}
              loading={coverageLoading && !analytics}
              refreshing={coverageRefreshing}
              isAnalyzing={coverageAnalyzing}
              hasAiAnalysis={hasAiAnalysis}
              newsAiAllowed={newsAiAllowed}
              planResolved={planResolved}
            />
          }
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
                hasAiAnalysis && analytics
                  ? `${coverageCount} stories analyzed`
                  : newsAiAllowed
                    ? "Run Analyze news for sentiment and a synthesized brief"
                    : "Pro — synthesized from recent headlines"
              }
              icon={Newspaper}
              bodyClassName="min-w-0"
              action={
                <div className="flex shrink-0 items-center gap-2">
                  <FreshnessLabel
                    updatedAt={coverageAnalyzedAt}
                    pending={coverageAnalyzing}
                    className="hidden sm:inline-flex"
                  />
                  <IconButton
                    size="sm"
                    onClick={() => analyzeNews({ refresh: true })}
                    disabled={
                      !newsAiAllowed ||
                      !hasAiAnalysis ||
                      coverageAnalyzing ||
                      !analytics?.items.length
                    }
                    aria-label="Re-analyze news"
                  >
                    <RefreshCw
                      className={cn(
                        "h-3.5 w-3.5",
                        coverageAnalyzing && "animate-spin",
                      )}
                      aria-hidden
                    />
                  </IconButton>
                </div>
              }
            >
              {!planResolved ? (
                <LoadingSurface
                  loading
                  hasContent={false}
                  label="Loading news brief"
                  skeleton={<NewsOverviewLoading />}
                >
                  {null}
                </LoadingSurface>
              ) : (
                <ProFeatureGate feature="newsAi" allowed={newsAiAllowed}>
                  <LoadingSurface
                    loading={coverageLoading && !analytics}
                    refreshing={coverageAnalyzing}
                    hasContent={Boolean(analytics && (hasAiAnalysis || coverageCount > 0))}
                    label="Loading news brief"
                    skeleton={<NewsOverviewLoading />}
                  >
                    {hasAiAnalysis && analytics ? (
                      <NewsOverviewContent data={analytics} />
                    ) : analytics ? (
                      <AnalyzeNewsPrompt
                        storyCount={coverageCount}
                        isAnalyzing={coverageAnalyzing}
                        lastAnalyzedAt={coverageAnalyzedAt}
                        onAnalyze={() => analyzeNews()}
                      />
                    ) : null}
                  </LoadingSurface>
                </ProFeatureGate>
              )}
            </ResearchSectionCard>

            {showCoverageBlock ? (
              <ResearchSectionCard
                title="Market coverage"
                description={
                  newsAiAllowed
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
                      showSentimentFilters={hasAiAnalysis}
                      showSentiment={hasAiAnalysis}
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
          <NewsAsideSections
            data={analytics}
            loading={coverageLoading && !analytics}
            refreshing={coverageRefreshing}
            isAnalyzing={coverageAnalyzing}
            hasAiAnalysis={hasAiAnalysis}
            newsAiAllowed={newsAiAllowed}
            planResolved={planResolved}
          />
        }
      />
    </div>
  );
}
