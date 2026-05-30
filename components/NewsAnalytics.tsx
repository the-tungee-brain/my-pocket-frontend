"use client";

import { useMemo } from "react";
import type { StockNewsView, OverallSentiment } from "@/app/hooks/useCompanyNews";
import {
  enrichedNewsItemToDisplay,
  NewsHeadlinesPanel,
  NewsHeadlinesSkeleton,
  SentimentMixBar,
} from "@/components/NewsHeadlinesFeed";
import { PageSplit } from "@/components/PageShell";
import { ProFeatureGate } from "@/components/ProFeatureGate";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import {
  ResearchAtAGlanceBox,
  ResearchBulletList,
  ResearchTextBlock,
} from "@/components/ResearchDetailBlocks";
import {
  LoadingSurface,
  NewsAnalysisLoading,
  NewsContextLoading,
  NewsOverviewLoading,
} from "@/components/ui/ContentLoading";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { appCalloutClass, appCalloutLabelClass } from "@/lib/appUi";
import { formatRelativeUpdatedAt } from "@/lib/timeUtils";
import { FreshnessLabel } from "@/components/ui/FreshnessLabel";
import {
  Activity,
  CircleHelp,
  List,
  Newspaper,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";

function overallSentimentLabel(s: OverallSentiment) {
  switch (s) {
    case "strongly_bullish":
      return "Strongly bullish";
    case "bullish":
      return "Bullish";
    case "neutral":
      return "Neutral";
    case "bearish":
      return "Bearish";
    case "strongly_bearish":
      return "Strongly bearish";
  }
}

function overallSentimentPillClass(s: OverallSentiment) {
  switch (s) {
    case "strongly_bullish":
    case "bullish":
      return "border-accent/30 bg-accent-muted text-accent-strong";
    case "bearish":
    case "strongly_bearish":
      return "border-danger/30 bg-danger/10 text-danger";
    default:
      return "border-border bg-muted-bg text-muted";
  }
}

function formatMetadataValue(value: string | null | undefined) {
  if (!value) return "Not available";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function actionabilityTone(score: number | null | undefined) {
  if (score == null) return "text-muted";
  if (score >= 4) return "text-success";
  if (score >= 3) return "text-accent-strong";
  return "text-muted";
}

export function AnalyzeNewsPrompt({
  storyCount,
  isAnalyzing = false,
  lastAnalyzedAt = null,
  onAnalyze,
  className,
}: {
  storyCount: number;
  isAnalyzing?: boolean;
  lastAnalyzedAt?: number | null;
  onAnalyze?: () => void;
  className?: string;
}) {
  return (
    <div className={cn(appCalloutClass, className)}>
      <p className={appCalloutLabelClass}>Ready to analyze</p>
      <p className="mt-1 text-sm leading-relaxed text-muted">
        {storyCount > 0
          ? "Run AI analysis for sentiment, summaries, and a synthesized brief."
          : "Headlines will appear above once loaded."}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={onAnalyze}
          disabled={!onAnalyze || isAnalyzing || storyCount === 0}
          isLoading={isAnalyzing}
        >
          Analyze news
        </Button>
        {lastAnalyzedAt ? (
          <span className="text-[11px] text-muted">
            Last analyzed {formatRelativeUpdatedAt(lastAnalyzedAt)}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function NewsOverviewSkeleton() {
  return <NewsOverviewLoading />;
}

export function NewsOverviewContent({ data }: { data: StockNewsView }) {
  return (
    <div className="app-stack">
      <ResearchAtAGlanceBox title="What matters">
        <p className="text-sm font-medium leading-relaxed text-foreground">
          {data.summary}
        </p>
        {data.investorTakeaway ? (
          <p className="mt-2 text-sm font-medium leading-relaxed text-foreground">
            {data.investorTakeaway}
          </p>
        ) : null}
      </ResearchAtAGlanceBox>

      {data.items.length > 0 ? (
        <ResearchTextBlock title="Sentiment mix">
          <SentimentMixBar items={data.items} />
        </ResearchTextBlock>
      ) : null}
    </div>
  );
}

const ACTIONABILITY_HELP =
  "How relevant this batch of news is for researching the stock right now. 1 is background noise; 5 means several stories may affect your thesis soon. This is not a buy or sell rating.";

function ActionabilityLabel() {
  return (
    <span className="inline-flex items-center gap-1">
      <span>Actionability</span>
      <span className="group relative inline-flex">
        <button
          type="button"
          className="inline-flex shrink-0 rounded-full text-muted transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          aria-label="What is actionability?"
          title={ACTIONABILITY_HELP}
        >
          <CircleHelp className="h-3.5 w-3.5" aria-hidden />
        </button>
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-lg border border-border bg-background px-2.5 py-2 text-left text-[11px] font-normal normal-case leading-relaxed tracking-normal text-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
        >
          {ACTIONABILITY_HELP}
        </span>
      </span>
    </span>
  );
}

export function NewsContextAside({ data }: { data: StockNewsView }) {
  const actionabilityScore = data.actionability_score ?? null;
  const actionabilityPercent =
    actionabilityScore == null
      ? 0
      : Math.max(0, Math.min(100, (actionabilityScore / 5) * 100));

  return (
    <div className="app-stack">
      <ResearchTextBlock title="Dominant driver">
        <p className="font-medium">{formatMetadataValue(data.dominant_driver)}</p>
      </ResearchTextBlock>

      <ResearchTextBlock title="Impact horizon">
        <p className="font-medium">
          {formatMetadataValue(data.market_impact_horizon)}
        </p>
      </ResearchTextBlock>

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
            <ActionabilityLabel />
          </h3>
          <span
            className={cn(
              "text-xs font-semibold",
              actionabilityTone(actionabilityScore),
            )}
          >
            {actionabilityScore == null ? "N/A" : `${actionabilityScore}/5`}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted-bg">
          <div
            className={cn(
              "h-full rounded-full bg-current transition-all",
              actionabilityTone(actionabilityScore),
            )}
            style={{ width: `${actionabilityPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function NewsAnalysisAside({ data }: { data: StockNewsView }) {
  const insights = data.insights.slice(0, 4);
  const risks = data.risks.slice(0, 4);

  return (
    <div className="app-stack">
      {insights.length > 0 ? (
        <ResearchBulletList title="Key insights" items={insights} />
      ) : null}
      {risks.length > 0 ? (
        <ResearchBulletList title="Risks" items={risks} bulletTone="risk" />
      ) : null}

      {data.deepAnalysis ? (
        <ResearchTextBlock title="Deep analysis">
          <p>{data.deepAnalysis}</p>
        </ResearchTextBlock>
      ) : null}
    </div>
  );
}

function hasCoverageAnalysis(data: StockNewsView) {
  return (
    data.insights.length > 0 ||
    data.risks.length > 0 ||
    Boolean(data.deepAnalysis)
  );
}

/** Market context + coverage analysis aside — card chrome always visible. */
export function NewsAsideSections({
  data,
  loading,
  refreshing = false,
  isAnalyzing = false,
  hasAiAnalysis = false,
  newsAiAllowed = true,
  planResolved = true,
  className,
}: {
  data: StockNewsView | null;
  loading: boolean;
  refreshing?: boolean;
  isAnalyzing?: boolean;
  hasAiAnalysis?: boolean;
  newsAiAllowed?: boolean;
  planResolved?: boolean;
  className?: string;
}) {
  const pending = loading || isAnalyzing || refreshing;
  const hasContext = newsAiAllowed && hasAiAnalysis && !!data;
  const showProUpsell = planResolved && !newsAiAllowed;

  return (
    <div className={cn("app-stack", className)}>
      <ResearchSectionCard
        title="Market context"
        description="How recent news may affect the stock"
        icon={Activity}
      >
        <LoadingSurface
          loading={!planResolved || (newsAiAllowed && pending)}
          refreshing={refreshing}
          hasContent={showProUpsell || hasContext}
          label="Loading market context"
          skeleton={<NewsContextLoading />}
        >
          {showProUpsell ? (
            <ProFeatureGate
              feature="newsAi"
              allowed={false}
              title="Market context"
              description="Dominant driver, impact horizon, and actionability from recent headlines."
            />
          ) : hasContext && data ? (
            <NewsContextAside data={data} />
          ) : (
            <p className="text-sm leading-relaxed text-muted">
              Dominant driver, impact horizon, and actionability appear here after
              you run Analyze news.
            </p>
          )}
        </LoadingSurface>
      </ResearchSectionCard>

      <ResearchSectionCard
        title="Coverage analysis"
        description="Themes and risks from recent headlines"
        icon={Sparkles}
      >
        <LoadingSurface
          loading={!planResolved || (newsAiAllowed && pending)}
          refreshing={refreshing}
          hasContent={showProUpsell || (hasContext && !!data && hasCoverageAnalysis(data))}
          label="Loading coverage analysis"
          skeleton={<NewsAnalysisLoading />}
        >
          {showProUpsell ? (
            <ProFeatureGate
              feature="newsAi"
              allowed={false}
              title="Coverage analysis"
              description="Key insights, risks, and deep analysis synthesized from recent headlines."
            />
          ) : hasContext && data && hasCoverageAnalysis(data) ? (
            <NewsAnalysisAside data={data} />
          ) : (
            <p className="text-sm leading-relaxed text-muted">
              Key insights, risks, and deep analysis appear here after you run
              Analyze news.
            </p>
          )}
        </LoadingSurface>
      </ResearchSectionCard>
    </div>
  );
}

type Props = {
  analytics: StockNewsView | null;
  isLoading: boolean;
  isRefreshing?: boolean;
  isAnalyzing?: boolean;
  lastAnalyzedAt?: number | null;
  lastUpdated?: number | null;
  onRefresh?: () => void;
  onAnalyzeNews?: () => void;
  /** Headlines grid only—overview and aside live on the All tab. */
  headlinesOnly?: boolean;
  /** When false, hide AI sentiment UI (free tier headlines). */
  showAiEnrichment?: boolean;
};

export default function NewsAnalytics({
  analytics,
  isLoading,
  isRefreshing = false,
  isAnalyzing = false,
  lastAnalyzedAt = null,
  lastUpdated = null,
  onRefresh,
  onAnalyzeNews,
  headlinesOnly = false,
  showAiEnrichment = true,
}: Props) {
  const data = analytics;
  const hasAiAnalysis = data?.aiEnrichment === true;
  const headlineItems = useMemo(
    () => (data ? data.items.map(enrichedNewsItemToDisplay) : []),
    [data],
  );

  if (!data && !isLoading) return null;

  const sentimentAction =
    showAiEnrichment && hasAiAnalysis && data ? (
      <span
        className={cn(
          "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-xs font-medium leading-none",
          overallSentimentPillClass(data.overall_sentiment),
        )}
      >
        {overallSentimentLabel(data.overall_sentiment)}
      </span>
    ) : showAiEnrichment && isAnalyzing ? (
      <Skeleton className="h-5 w-20 rounded-full" />
    ) : null;

  const analyzeAction =
    showAiEnrichment && !hasAiAnalysis && onAnalyzeNews ? (
      <Button
        type="button"
        size="sm"
        onClick={onAnalyzeNews}
        disabled={isAnalyzing || !data?.items.length}
        isLoading={isAnalyzing}
      >
        Analyze news
      </Button>
    ) : null;

  const refreshAction = (
    <div className="flex shrink-0 items-center gap-2">
      {analyzeAction}
      {sentimentAction}
      <FreshnessLabel
        updatedAt={lastUpdated}
        pending={isLoading || isRefreshing}
        className="hidden sm:inline-flex"
      />
      {onRefresh ? (
        <IconButton
          size="sm"
          onClick={onRefresh}
          disabled={isLoading || isRefreshing}
          aria-label="Refresh news"
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", (isLoading || isRefreshing) && "animate-spin")}
            aria-hidden
          />
        </IconButton>
      ) : null}
    </div>
  );

  const headlinesAction = sentimentAction ?? undefined;

  if (headlinesOnly) {
    return (
      <ResearchSectionCard
        title="Headlines"
        description={
          data
            ? hasAiAnalysis
              ? `${data.items.length} stories with AI sentiment and summaries`
              : `${data.items.length} recent headline${data.items.length === 1 ? "" : "s"}`
            : "Loading headlines…"
        }
        icon={List}
        bodyClassName="min-w-0"
        action={headlinesAction}
      >
        <LoadingSurface
          loading={isLoading}
          refreshing={isRefreshing}
          hasContent={!!data}
          label="Loading headlines"
          skeleton={<NewsHeadlinesSkeleton view="grid" />}
        >
          {data ? (
            <NewsHeadlinesPanel
              items={headlineItems}
              defaultView="grid"
              showSentimentFilters={hasAiAnalysis}
              showSentiment={hasAiAnalysis}
            />
          ) : null}
        </LoadingSurface>
      </ResearchSectionCard>
    );
  }

  return (
    <div className="app-stack">
      <PageSplit
        main={
          <>
            <ResearchSectionCard
              title="News overview"
              description={
                data
                  ? `${data.items.length} headlines · AI-enriched`
                  : "Loading headlines…"
              }
              icon={Newspaper}
              action={refreshAction}
            >
              <LoadingSurface
                loading={isLoading}
                refreshing={isRefreshing}
                hasContent={!!data}
                label="Loading news overview"
                skeleton={<NewsOverviewLoading />}
              >
                {data ? <NewsOverviewContent data={data} /> : null}
              </LoadingSurface>
            </ResearchSectionCard>

            <ResearchSectionCard
              title="Headlines"
              description="Recent stories with AI summaries"
              icon={List}
              bodyClassName="min-w-0"
            >
              <LoadingSurface
                loading={isLoading}
                refreshing={isRefreshing}
                hasContent={!!data && headlineItems.length > 0}
                label="Loading headlines"
                skeleton={<NewsHeadlinesSkeleton view="grid" />}
              >
                {data ? <NewsHeadlinesPanel items={headlineItems} /> : null}
              </LoadingSurface>
            </ResearchSectionCard>
          </>
        }
        aside={
          <NewsAsideSections
            data={data}
            loading={isLoading}
            refreshing={isRefreshing}
            isAnalyzing={isAnalyzing}
            hasAiAnalysis={hasAiAnalysis}
          />
        }
      />
    </div>
  );
}
