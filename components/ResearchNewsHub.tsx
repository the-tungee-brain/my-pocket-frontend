"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { ArrowRight, FileText } from "lucide-react";
import { useProFeature } from "@/app/hooks/useAccountPlan";
import {
  type StockNewsView,
  invalidateCompanyNewsCache,
  useCompanyNews,
} from "@/app/hooks/useCompanyNews";
import { usePressReleases } from "@/app/hooks/usePressReleases";
import { ProFeatureGate } from "@/components/ProFeatureGate";
import NewsAnalytics, { AnalyzeNewsPrompt } from "@/components/NewsAnalytics";
import {
  LoadingSurface,
  NewsOverviewLoading,
} from "@/components/ui/ContentLoading";
import {
  enrichedNewsItemToDisplay,
  type NewsHeadlineDisplayItem,
  NewsHeadlinesPanel,
  NewsHeadlinesSkeleton,
  pressReleaseToDisplay,
} from "@/components/NewsHeadlinesFeed";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { appStackClass, appTabBarClass, appTabLinkClass } from "@/lib/appUi";
import { cn } from "@/lib/utils";
import { FreshnessLabel } from "@/components/ui/FreshnessLabel";
import {
  compactText,
  officialReleaseLooksMaterial,
  rankHeadlines,
  thesisBuckets,
  verdictText,
  whatChangedItems,
} from "@/lib/newsBriefingRules";

const MATERIAL_HEADLINE_LIMIT = 6;
const RECENT_COVERAGE_LIMIT = 8;

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

type HeadlineRank = "Material" | "Relevant" | "Background";

type RankedHeadline = NewsHeadlineDisplayItem & {
  rank: HeadlineRank;
  score: number;
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
            className={cn(
              appTabLinkClass(active),
              "flex-1 justify-center gap-1.5 whitespace-nowrap",
            )}
          >
            <span>{tab.label}</span>
            {tab.count != null && tab.count > 0 ? (
              <span
                className={cn(
                  "inline-flex min-w-5 items-center justify-center px-1.5 py-0.5 font-mono text-[10px] font-medium tabular-nums",
                  active ? "text-accent-strong" : "text-muted",
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

function impactScore(data: StockNewsView | null, kind: "near" | "long") {
  if (!data) return null;
  const actionability = data.actionability_score ?? 2.5;
  if (kind === "near") {
    const horizon = data.market_impact_horizon?.toLowerCase() ?? "";
    const horizonBoost = /near|short|immediate|earnings|week/.test(horizon)
      ? 0.8
      : /long|structural/.test(horizon)
        ? -0.4
        : 0;
    return Math.max(1, Math.min(5, Math.round(actionability + horizonBoost)));
  }
  const thesisText =
    `${data.summary} ${data.investorTakeaway ?? ""} ${data.insights.join(" ")} ${data.risks.join(" ")}`.toLowerCase();
  const thesisBoost =
    /guidance|strategy|product|demand|margin|competitive|regulat|capital|management|earnings|revenue|profit/.test(
      thesisText,
    )
      ? 0.8
      : 0;
  return Math.max(1, Math.min(5, Math.round(actionability + thesisBoost)));
}

function newsQualityLabel(
  data: StockNewsView | null,
  ranked: RankedHeadline[],
): "High" | "Medium" | "Low" {
  const materialCount = ranked.filter(
    (item) => item.rank === "Material",
  ).length;
  if (data?.aiEnrichment && materialCount >= 2) return "High";
  if ((data?.items.length ?? 0) >= 4 || materialCount >= 1) return "Medium";
  return "Low";
}

function verdictLabel(data: StockNewsView | null) {
  if (!data?.aiEnrichment) return "Awaiting analysis";
  switch (data.overall_sentiment) {
    case "strongly_bullish":
      return "Strongly positive";
    case "bullish":
      return "Long-term positive";
    case "bearish":
      return "Long-term negative";
    case "strongly_bearish":
      return "Strongly negative";
    default:
      return "Mixed thesis signal";
  }
}

function ImpactMetric({
  label,
  value,
}: {
  label: string;
  value: string | number | null;
}) {
  return (
    <div className="min-w-0 border-t border-border/60 pt-3 sm:border-t-0 sm:pt-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold tabular-nums text-foreground">
        {value ?? "—"}
      </p>
    </div>
  );
}

function NewsVerdictHero({
  symbol,
  data,
  ranked,
  loading,
  analyzing,
  onAnalyze,
  onRefresh,
  newsAiAllowed,
  lastAnalyzedAt,
}: {
  symbol: string;
  data: StockNewsView | null;
  ranked: RankedHeadline[];
  loading: boolean;
  analyzing: boolean;
  onAnalyze?: () => void;
  onRefresh: () => void;
  newsAiAllowed: boolean;
  lastAnalyzedAt: number | null;
}) {
  const hasAnalysis = data?.aiEnrichment === true;
  const nearImpact = hasAnalysis ? impactScore(data, "near") : null;
  const longImpact = hasAnalysis ? impactScore(data, "long") : null;
  const quality = hasAnalysis ? newsQualityLabel(data, ranked) : null;

  return (
    <section className="border-b border-border/60 pb-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            {symbol.toUpperCase()} News Brief
          </p>
          <h2 className="mt-3 text-4xl font-semibold tracking-normal text-foreground sm:text-5xl">
            {loading && !data ? "Loading" : verdictLabel(data)}
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted sm:text-lg">
            {loading && !data
              ? "Loading the latest stock-specific news picture."
              : verdictText(data, nearImpact, longImpact)}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3 sm:justify-end">
          <FreshnessLabel
            updatedAt={lastAnalyzedAt}
            pending={analyzing}
            className="text-[11px]"
          />
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading || analyzing}
            className="text-sm font-medium text-muted hover:text-foreground disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {!hasAnalysis && data && newsAiAllowed ? (
        <div className="mt-5">
          <button
            type="button"
            onClick={onAnalyze}
            disabled={analyzing || !data.items.length}
            className="text-sm font-medium text-accent-strong hover:underline disabled:opacity-50"
          >
            {analyzing ? "Analyzing…" : "Analyze thesis impact"}
          </button>
        </div>
      ) : null}

      <div className="mt-8 grid gap-x-8 gap-y-4 sm:grid-cols-3">
        <ImpactMetric
          label="Near-term impact"
          value={nearImpact != null ? `${nearImpact}/5` : "-/5"}
        />
        <ImpactMetric
          label="Long-term thesis impact"
          value={longImpact != null ? `${longImpact}/5` : "-/5"}
        />
        <ImpactMetric label="News quality" value={quality} />
      </div>
    </section>
  );
}

function NewsSection({
  title,
  description,
  action,
  children,
  muted = false,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <section
      className={cn("border-b border-border/60 py-7", muted && "text-muted")}
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

function BriefingEmptyState() {
  return (
    <NewsSection title="Briefing">
      <div className="py-5">
        <p className="text-sm font-medium text-foreground">
          No thesis-relevant news found yet.
        </p>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
          Recent headlines did not contain direct company news or important
          industry read-throughs.
        </p>
      </div>
    </NewsSection>
  );
}

function WhatChangedSection({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <NewsSection title="What changed">
      <div className="grid gap-3">
        {items.map((item, index) => (
          <article
            key={item}
            className="grid gap-3 border-l border-border/60 py-1 pl-4 sm:grid-cols-[2rem_minmax(0,1fr)]"
          >
            <span className="font-mono text-xs font-semibold text-muted">
              {String(index + 1).padStart(2, "0")}
            </span>
            <p className="text-sm leading-relaxed text-foreground">{item}</p>
          </article>
        ))}
      </div>
    </NewsSection>
  );
}

function rankLabelClass(rank: HeadlineRank) {
  if (rank === "Material") return "border-accent/25 text-accent-strong";
  if (rank === "Relevant") return "border-border text-foreground";
  return "border-border/60 text-muted";
}

function MaterialHeadlinesSection({ items }: { items: RankedHeadline[] }) {
  const visible = items.slice(0, MATERIAL_HEADLINE_LIMIT);
  if (!visible.length) return null;
  return (
    <NewsSection title="Material headlines">
      <div>
        {visible.map((item) => (
          <article
            key={item.id}
            className="grid gap-3 border-b border-border/60 py-4 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[8rem_minmax(0,1fr)]"
          >
            <div className="flex items-center gap-2 sm:block">
              <span
                className={cn(
                  "inline-flex border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
                  rankLabelClass(item.rank),
                )}
              >
                {item.rank}
              </span>
              <p className="text-[11px] text-muted sm:mt-2">
                {item.feedKind === "official" ? "Company" : "Coverage"}
              </p>
            </div>
            <div className="min-w-0">
              {item.url ? (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold leading-snug text-foreground hover:text-accent-strong hover:underline"
                >
                  {item.headline}
                </a>
              ) : (
                <p className="text-sm font-semibold leading-snug text-foreground">
                  {item.headline}
                </p>
              )}
              {item.summary ? (
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">
                  {item.summary}
                </p>
              ) : null}
              <p className="mt-2 text-[11px] text-muted">
                {item.source ? `${item.source} · ` : ""}
                {new Date(item.datetime).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          </article>
        ))}
      </div>
    </NewsSection>
  );
}

function ThesisImpactSection({
  buckets,
}: {
  buckets: ReturnType<typeof thesisBuckets>;
}) {
  const entries = [
    ["Bullish developments", buckets.bullish],
    ["Bearish developments", buckets.bearish],
    ["Risks", buckets.risks],
    ["Opportunities", buckets.opportunities],
  ] as const;
  if (!entries.some(([, items]) => items.length > 0)) return null;
  return (
    <NewsSection title="Thesis impact">
      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        {entries.map(([title, items]) => (
          <div key={title} className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            {items.length ? (
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
                {items.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 bg-muted"
                      aria-hidden
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted">No clear signal.</p>
            )}
          </div>
        ))}
      </div>
    </NewsSection>
  );
}

function CompactCoverageList({ items }: { items: NewsHeadlineDisplayItem[] }) {
  return (
    <div>
      {items.map((item) => (
        <article
          key={item.id}
          className="grid gap-2 border-b border-border/50 py-3 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_9rem]"
        >
          <div className="min-w-0">
            {item.url ? (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="line-clamp-2 text-sm font-medium leading-snug text-foreground hover:text-accent-strong hover:underline"
              >
                {item.headline}
              </a>
            ) : (
              <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
                {item.headline}
              </p>
            )}
            {item.summary ? (
              <p className="mt-1 line-clamp-1 text-xs leading-relaxed text-muted">
                {item.summary}
              </p>
            ) : null}
          </div>
          <p className="text-[11px] text-muted sm:text-right">
            {new Date(item.datetime).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
            {item.source ? ` · ${item.source}` : ""}
          </p>
        </article>
      ))}
    </div>
  );
}

function DeepAnalysisDisclosure({ data }: { data: StockNewsView | null }) {
  const text = compactText(data?.deepAnalysis);
  if (!text || text.length < 220) return null;
  return (
    <details className="pt-2">
      <summary className="cursor-pointer py-5 text-sm font-semibold text-foreground">
        Read full analysis
      </summary>
      <p className="text-sm leading-relaxed text-muted">{text}</p>
    </details>
  );
}

export function ResearchNewsHub({ symbol, accessToken, className }: Props) {
  const [scope, setScope] = useState<NewsFeedScope>("all");
  const { data: session } = useSession();
  const token = session?.accessToken ?? accessToken;
  const { allowed: newsAiAllowed, resolved: planResolved } = useProFeature(
    token,
    "newsAi",
  );
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
  const materialOfficialDisplay = useMemo(
    () =>
      officialDisplay.filter((item) =>
        officialReleaseLooksMaterial(item, symbol),
      ),
    [officialDisplay, symbol],
  );

  const officialCount = officialDisplay.length;
  const coverageCount = coverageDisplay.length;
  const rankedBriefingHeadlines = useMemo(
    () =>
      rankHeadlines(
        [...materialOfficialDisplay, ...coverageDisplay],
        symbol,
      ) as RankedHeadline[],
    [coverageDisplay, materialOfficialDisplay, symbol],
  );
  const recentCoverageItems = useMemo(
    () => coverageDisplay.slice(0, RECENT_COVERAGE_LIMIT),
    [coverageDisplay],
  );
  const changedItems = useMemo(
    () => whatChangedItems(analytics, rankedBriefingHeadlines),
    [analytics, rankedBriefingHeadlines],
  );
  const thesisImpact = useMemo(
    () => thesisBuckets(analytics, rankedBriefingHeadlines),
    [analytics, rankedBriefingHeadlines],
  );
  const hasBriefingContent =
    changedItems.length > 0 ||
    rankedBriefingHeadlines.length > 0 ||
    thesisImpact.bullish.length > 0 ||
    thesisImpact.bearish.length > 0 ||
    thesisImpact.risks.length > 0 ||
    thesisImpact.opportunities.length > 0;

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
        <p className="text-sm text-muted">
          Sign in to load news for this symbol.
        </p>
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
          isAnalyzing={coverageAnalyzing}
          lastUpdated={coverageUpdated}
          lastAnalyzedAt={coverageAnalyzedAt}
          onRefresh={refreshCoverage}
          onAnalyzeNews={newsAiAllowed ? () => analyzeNews() : undefined}
          headlinesOnly
          showAiEnrichment={newsAiAllowed}
        />
      </div>
    );
  }

  if (scope === "official") {
    return (
      <div className={cn(appStackClass, className)}>
        {header}
        {officialError ? (
          <ErrorBanner
            message={officialError}
            onRetry={() => void refetchOfficial()}
          />
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
        <ErrorBanner
          message={officialError}
          onRetry={() => void refetchOfficial()}
        />
      ) : null}

      <div className={cn(appStackClass, "min-w-0")}>
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
              hasContent={Boolean(analytics || rankedBriefingHeadlines.length)}
              label="Loading news brief"
              skeleton={<NewsOverviewLoading />}
            >
              <NewsVerdictHero
                symbol={symbol}
                data={analytics}
                ranked={rankedBriefingHeadlines}
                loading={coverageLoading}
                analyzing={coverageAnalyzing}
                onAnalyze={() => analyzeNews()}
                onRefresh={() => analyzeNews({ refresh: true })}
                newsAiAllowed={newsAiAllowed}
                lastAnalyzedAt={coverageAnalyzedAt}
              />
              {!hasAiAnalysis && analytics ? (
                <AnalyzeNewsPrompt
                  storyCount={coverageCount}
                  isAnalyzing={coverageAnalyzing}
                  lastAnalyzedAt={coverageAnalyzedAt}
                  onAnalyze={() => analyzeNews()}
                  className="mt-6 border-t-0"
                />
              ) : null}
            </LoadingSurface>
          </ProFeatureGate>
        )}

        {analytics && !coverageLoading && !hasBriefingContent ? (
          <BriefingEmptyState />
        ) : null}
        <WhatChangedSection items={changedItems} />
        <ThesisImpactSection buckets={thesisImpact} />
        <MaterialHeadlinesSection items={rankedBriefingHeadlines} />

        {showCoverageBlock ? (
          <NewsSection
            title="Recent coverage"
            description="Lower-priority feed."
            action={
              coverageCount > RECENT_COVERAGE_LIMIT ? (
                <ViewAllLink
                  label={`View all ${coverageCount}`}
                  onClick={() => setScope("coverage")}
                />
              ) : null
            }
          >
            <LoadingSurface
              loading={coverageLoading && coverageCount === 0}
              refreshing={
                coverageRefreshing || (coverageLoading && coverageCount > 0)
              }
              hasContent={coverageCount > 0}
              label="Loading recent coverage"
              skeleton={<NewsHeadlinesSkeleton view="grid" rows={3} />}
            >
              {coverageCount > 0 ? (
                <CompactCoverageList items={recentCoverageItems} />
              ) : (
                <p className="text-sm text-muted">
                  No market coverage loaded yet.
                </p>
              )}
            </LoadingSurface>
          </NewsSection>
        ) : null}

        <DeepAnalysisDisclosure data={analytics} />
      </div>
    </div>
  );
}
