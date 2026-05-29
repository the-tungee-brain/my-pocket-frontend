"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Filter,
  Lightbulb,
  LockKeyhole,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import type { PositionMap } from "@/components/AccountPositionList";
import { formatInsightsAnalyzedAt } from "@/lib/insightsCache";
import { AnalyzePrompt } from "@/components/AnalyzePrompt";
import { StructuredAnalysisView } from "@/components/StructuredAnalysisView";
import {
  ComparePathsCard,
  ComparePathsIntro,
} from "@/components/ComparePathsCard";
import {
  PortfolioAllocationCard,
  PortfolioAllocationIntro,
} from "@/components/PortfolioAllocationCard";
import { inferRecommendedComparePath } from "@/lib/inferRecommendedComparePath";
import { PortfolioSnapshotHeaderActionsContext } from "@/components/portfolioSnapshotHeaderActions";
import { AlertBadge } from "@/components/AlertBadge";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { KpiStat } from "@/components/ui/KpiStat";
import { ConversationalMarkdown } from "@/components/ui/ConversationalMarkdown";
import { usePositionsContext } from "@/app/Providers";
import { useInsights } from "@/app/hooks/useInsights";
import { Position } from "@/app/types/schwab";
import { formatSignedUsd, formatUsd } from "@/lib/formatCurrency";
import {
  isCashSecuredPut,
  isHighlightedOptionStrategy,
  optionStrategyLabel,
} from "@/lib/optionStrategyLabel";
import {
  openProfitLossPct,
  positionOpenProfitLoss,
  positionOpenProfitLossPct,
  sumCostBasis,
  sumOpenProfitLoss,
  sumPortfolioWeight,
} from "@/lib/positionMetrics";
import type { SymbolAlertSummary } from "@/lib/intelligence";
import { SEVERITY_ORDER } from "@/lib/intelligence";
import {
  ANALYZE_PORTFOLIO_EVENT,
  ANALYZE_POSITION_EVENT,
  PORTFOLIO_ANALYSIS_SECTION_ID,
  SYMBOL_ANALYSIS_SECTION_ID,
  scrollToAnalysisSection,
  type PortfolioAnalysisRequestDetail,
} from "@/lib/positionAnalysis";
import { scrollToChat } from "@/lib/scrollToChat";
import { symbolHubPath } from "@/lib/symbolRoutes";
import { cn } from "@/lib/utils";
import {
  buildSymbolSummaries,
  PortfolioHoldingsTable,
  SORT_OPTIONS,
  sortSummaries,
  SymbolLegsTable,
  type SortKey,
} from "@/components/analysis/analysisPanelHoldings";
import {
  hasComparePaths,
  hasPortfolioAllocation,
  stripOutcomeComparisonSection,
  stripPortfolioAllocationSections,
} from "@/lib/structuredAnalysis";

type PortfolioProps = {
  mode: "portfolio";
  positions: Position[];
  positionMap: PositionMap;
  liquidationValue?: number | null;
  symbolAlertMap?: Record<string, SymbolAlertSummary>;
  /** Which slice of the portfolio panel to show on the current tab. */
  portfolioView?: "analysis" | "holdings";
  /** Morning Brief / portfolio navigation requests. */
  portfolioNavigation?: PortfolioNavigationRequest | null;
};

export type PortfolioNavigationRequest = {
  token: number;
  forceAnalyze: boolean;
};

type SymbolProps = {
  mode: "symbol";
  symbol: string;
  positions: Position[];
};

type CommonProps = {
  className?: string;
  onAskFollowUp?: () => void;
  onLoadingChange?: (loading: boolean) => void;
  autoStart?: boolean;
  /** Render only the analyze prompt/output block for embedding in another card. */
  embedded?: boolean;
  /** Hide held-option compare paths (e.g. on Positions tab). */
  hideComparePaths?: boolean;
};

export type AnalysisPanelProps = CommonProps & (PortfolioProps | SymbolProps);

function ReanalyzeButton({
  loading,
  onClick,
}: {
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium text-muted transition hover:bg-muted-bg hover:text-foreground disabled:opacity-60"
    >
      <RefreshCw
        className={cn("h-3.5 w-3.5", loading && "animate-spin")}
        aria-hidden
      />
      Re-analyze
    </button>
  );
}

function StatChip({
  label,
  value,
  tone = "neutral",
  className,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
  className?: string;
}) {
  return (
    <KpiStat
      label={label}
      value={value}
      className={cn("min-w-0 w-full", className)}
      tone={
        tone === "positive"
          ? "positive"
          : tone === "negative"
            ? "negative"
            : "default"
      }
    />
  );
}

export function AnalysisPanel(props: AnalysisPanelProps) {
  const {
    className,
    onAskFollowUp,
    onLoadingChange,
    autoStart = false,
    embedded = false,
    hideComparePaths = false,
  } = props;
  const isPortfolio = props.mode === "portfolio";
  const portfolioView = isPortfolio
    ? (props.portfolioView ?? "holdings")
    : null;
  const showPortfolioAnalysis = !isPortfolio || portfolioView === "analysis";
  const showPortfolioHoldings = !isPortfolio || portfolioView === "holdings";
  const symbol = isPortfolio ? null : props.symbol.toUpperCase();
  const positions = props.positions;

  const { account, sessionAccessToken } = usePositionsContext();
  const portfolioHeaderActionsEl = useContext(
    PortfolioSnapshotHeaderActionsContext,
  );
  const [requested, setRequested] = useState(autoStart);
  const [pendingAnalyze, setPendingAnalyze] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("weight");
  const [alertsOnly, setAlertsOnly] = useState(false);
  const portfolioRescrollRef = useRef(false);
  const portfolioWaitForAnalyzeRef = useRef(false);
  const portfolioNavigation =
    isPortfolio ? (props.portfolioNavigation ?? null) : null;

  const symbolAlertMap = isPortfolio ? (props.symbolAlertMap ?? {}) : {};
  const positionMap = isPortfolio ? props.positionMap : null;
  const liquidationValue = isPortfolio ? props.liquidationValue : null;

  const label = useMemo(
    () => (positions.length ? (symbol ?? "PORTFOLIO") : null),
    [symbol, positions.length],
  );

  const userDisplayMessage = useMemo(
    () =>
      symbol
        ? `Analyze my ${symbol} position.`
        : "Analyze my portfolio for diversification and where to deploy cash.",
    [symbol],
  );

  const {
    loading,
    error,
    content,
    structuredAnalysis,
    precomputed,
    portfolioPrecomputed,
    analyzedAt,
    hasCachedInsights,
    refetch,
  } = useInsights(
    {
      label,
      positions,
      account,
      accessToken: sessionAccessToken || null,
      enabled: requested && (!isPortfolio || showPortfolioAnalysis),
      structuredAnalyze: true,
      userDisplayMessage,
    },
    "gpt-5.4",
  );

  const showComparePaths =
    !isPortfolio && hasComparePaths(precomputed) && !hideComparePaths;
  const showPortfolioAllocation =
    isPortfolio && hasPortfolioAllocation(portfolioPrecomputed);

  const displayAnalysis = useMemo(() => {
    if (!structuredAnalysis) return null;
    let analysis = structuredAnalysis;
    if (showComparePaths) {
      analysis = stripOutcomeComparisonSection(analysis);
    }
    if (showPortfolioAllocation) {
      analysis = stripPortfolioAllocationSections(analysis);
    }
    return analysis;
  }, [structuredAnalysis, showComparePaths, showPortfolioAllocation]);

  const recommendedComparePath = useMemo(
    () =>
      inferRecommendedComparePath(displayAnalysis?.recommendedAction?.title),
    [displayAnalysis?.recommendedAction?.title],
  );

  useEffect(() => {
    if (hasCachedInsights && !requested) {
      setRequested(true);
    }
  }, [hasCachedInsights, requested]);

  useEffect(() => {
    if (autoStart) setRequested(true);
  }, [autoStart]);

  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  useEffect(() => {
    if (!loading) {
      setPendingAnalyze(false);
    }
  }, [loading]);

  useEffect(() => {
    const beginAnalyze = () => {
      setPendingAnalyze(true);
      refetch();
      setRequested(true);
    };

    const requestPortfolioScroll = (forceAnalyze: boolean) => {
      portfolioRescrollRef.current = true;
      portfolioWaitForAnalyzeRef.current = forceAnalyze;
      setRequested(true);
      scrollToAnalysisSection(PORTFOLIO_ANALYSIS_SECTION_ID);
    };

    const handlePositionAnalyze = (event: Event) => {
      if (isPortfolio || loading || pendingAnalyze) return;
      const detail = (event as CustomEvent<{ symbol?: string }>).detail;
      if (symbol && detail?.symbol && detail.symbol !== symbol) return;
      beginAnalyze();
    };

    const handlePortfolioAnalyze = (event: Event) => {
      if (!isPortfolio) return;

      const forceAnalyze =
        (event as CustomEvent<PortfolioAnalysisRequestDetail>).detail
          ?.forceAnalyze ?? true;

      requestPortfolioScroll(forceAnalyze);

      if (!forceAnalyze || loading || pendingAnalyze) return;
      beginAnalyze();
    };

    window.addEventListener(ANALYZE_POSITION_EVENT, handlePositionAnalyze);
    window.addEventListener(ANALYZE_PORTFOLIO_EVENT, handlePortfolioAnalyze);
    return () => {
      window.removeEventListener(ANALYZE_POSITION_EVENT, handlePositionAnalyze);
      window.removeEventListener(
        ANALYZE_PORTFOLIO_EVENT,
        handlePortfolioAnalyze,
      );
    };
  }, [isPortfolio, loading, pendingAnalyze, refetch, symbol]);

  useEffect(() => {
    if (!isPortfolio || !showPortfolioAnalysis || !portfolioNavigation) return;

    const { forceAnalyze } = portfolioNavigation;

    portfolioRescrollRef.current = true;
    portfolioWaitForAnalyzeRef.current = forceAnalyze;
    setRequested(true);

    if (forceAnalyze && !loading && !pendingAnalyze) {
      setPendingAnalyze(true);
      refetch();
    }
  }, [isPortfolio, showPortfolioAnalysis, portfolioNavigation?.token]);

  useEffect(() => {
    if (!isPortfolio || !showPortfolioAnalysis || !portfolioRescrollRef.current) {
      return;
    }

    if (portfolioWaitForAnalyzeRef.current && (loading || pendingAnalyze)) {
      return;
    }

    const hasOutput = !!content?.trim() || !!structuredAnalysis;
    if (!hasOutput) return;

    portfolioRescrollRef.current = false;
    portfolioWaitForAnalyzeRef.current = false;
    scrollToAnalysisSection(PORTFOLIO_ANALYSIS_SECTION_ID);
  }, [
    isPortfolio,
    showPortfolioAnalysis,
    loading,
    pendingAnalyze,
    content,
    structuredAnalysis,
  ]);

  const symbolSummaries = useMemo(() => {
    if (!isPortfolio || !positionMap) return [];
    const base = buildSymbolSummaries(positionMap, liquidationValue);
    const filtered = alertsOnly
      ? base.filter((row) => symbolAlertMap[row.symbol])
      : base;
    return sortSummaries(filtered, sortKey, symbolAlertMap);
  }, [
    alertsOnly,
    isPortfolio,
    liquidationValue,
    positionMap,
    sortKey,
    symbolAlertMap,
  ]);

  if (!positions.length) return null;

  const sectionId = isPortfolio
    ? PORTFOLIO_ANALYSIS_SECTION_ID
    : SYMBOL_ANALYSIS_SECTION_ID;

  const title = isPortfolio
    ? showPortfolioAnalysis
      ? "Diversification analysis"
      : "Holdings"
    : symbol!;
  const analyzeLabel = isPortfolio ? "Analyze portfolio" : "Analyze position";
  const hasContent = !!content?.trim();
  const isAnalyzing = loading || pendingAnalyze;
  const analysisReady = !isAnalyzing && (!!structuredAnalysis || hasContent);
  const showAnalyzePrompt =
    showPortfolioAnalysis && !error && (isAnalyzing || !analysisReady);
  const analyzeButtonLoading = isAnalyzing;
  const showAnalysisOutput = showPortfolioAnalysis && (error || analysisReady);

  const totalValue = positions.reduce((sum, p) => sum + p.marketValue, 0);
  const openPL = sumOpenProfitLoss(positions);
  const costBasis = sumCostBasis(positions);
  const openPLPctVal = openProfitLossPct(openPL, costBasis);
  const dayPL = positions.reduce((sum, p) => sum + p.currentDayProfitLoss, 0);
  const openTone =
    openPL == null ? "neutral" : openPL >= 0 ? "positive" : "negative";
  const dayTone = dayPL >= 0 ? "positive" : "negative";

  const alertSymbolCount = isPortfolio
    ? Object.keys(symbolAlertMap).filter((s) => positionMap?.[s]).length
    : 0;

  const symbolCount = isPortfolio ? Object.keys(positionMap ?? {}).length : 0;

  const handleStart = () => {
    if (isAnalyzing) return;
    setPendingAnalyze(true);
    refetch();
    setRequested(true);
    if (isPortfolio) {
      scrollToAnalysisSection(PORTFOLIO_ANALYSIS_SECTION_ID);
    }
  };

  const handleRefresh = () => {
    if (!requested) {
      handleStart();
      return;
    }
    setPendingAnalyze(true);
    refetch();
  };

  const handleFollowUp = () => {
    if (onAskFollowUp) {
      onAskFollowUp();
      return;
    }
    scrollToChat();
  };

  const showReanalyze =
    showPortfolioAnalysis &&
    !loading &&
    (hasCachedInsights || analysisReady || error || requested);

  const headerReanalyzeButton =
    embedded && isPortfolio && showReanalyze && portfolioHeaderActionsEl
      ? createPortal(
          <ReanalyzeButton loading={loading} onClick={handleRefresh} />,
          portfolioHeaderActionsEl,
        )
      : null;

  const analysisBlock = (
    <>
      {showAnalyzePrompt && (
        <AnalyzePrompt
          isPortfolio={isPortfolio}
          symbol={symbol}
          label={analyzeLabel}
          loading={analyzeButtonLoading}
          onClick={handleStart}
        />
      )}

      {showAnalysisOutput && (
        <div className="border-t border-border/70 px-4 py-4">
          {error && (
            <ErrorBanner message={error} onRetry={refetch} className="mb-3" />
          )}

          {analysisReady && (
            <div
              className={cn(
                "text-sm leading-relaxed text-foreground",
                loading && "opacity-90",
              )}
            >
              <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-muted">
                AI analysis
              </p>
              {showPortfolioAllocation && portfolioPrecomputed && (
                <div className="mb-4 space-y-3">
                  <PortfolioAllocationIntro />
                  <PortfolioAllocationCard precomputed={portfolioPrecomputed} />
                </div>
              )}
              {displayAnalysis ? (
                <StructuredAnalysisView
                  analysis={displayAnalysis}
                  loading={loading}
                  hideDetailLabel={showPortfolioAllocation}
                />
              ) : (
                content && (
                  <ConversationalMarkdown
                    content={content}
                    isStreaming={loading}
                  />
                )
              )}
              {showComparePaths && (
                <div className="mt-4 space-y-4 border-t border-border/70 pt-4">
                  <ComparePathsIntro />
                  {precomputed?.heldOptionOutcomes?.map((outcome, index) => (
                    <ComparePathsCard
                      key={`${outcome.currentLeg.strike}-${outcome.currentLeg.expiration}-${index}`}
                      symbol={symbol ?? precomputed.symbol}
                      outcome={outcome}
                      recommendedPath={recommendedComparePath}
                      rollSuggestions={precomputed.rollSuggestions}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {requested && !isAnalyzing && !error && !analysisReady && (
            <div className="space-y-3 py-4 text-center">
              <p className="text-sm text-muted">
                Analysis unavailable right now.
              </p>
              <button
                type="button"
                onClick={refetch}
                className="text-sm font-medium text-accent-strong hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {analysisReady && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
              <p className="text-[11px] text-muted">
                {analyzedAt
                  ? `Analyzed ${formatInsightsAnalyzedAt(analyzedAt)} · from your Schwab holdings`
                  : "Generated from your Schwab holdings"}
              </p>
              <button
                type="button"
                onClick={handleFollowUp}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-accent-strong transition hover:underline"
              >
                <MessageSquare className="h-3.5 w-3.5" aria-hidden />
                Ask a follow-up in chat
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );

  if (embedded && isPortfolio && showPortfolioAnalysis) {
    return (
      <>
        {headerReanalyzeButton}
        <div className={className}>{analysisBlock}</div>
      </>
    );
  }

  return (
    <Card
      id={sectionId}
      style={{ scrollMarginTop: "5.5rem" }}
      surface="subtle"
      className={className}
    >
      <CardHeader className="flex-col items-stretch gap-0">
        <div className="flex w-full items-start justify-between gap-3">
          <CardTitle
            title={title}
            description={
              isPortfolio
                ? showPortfolioAnalysis
                  ? "In-depth review of how your portfolio is diversified"
                  : `${symbolCount} ${symbolCount === 1 ? "symbol" : "symbols"} · ${positions.length} ${positions.length === 1 ? "position" : "positions"}`
                : `${positions.length} ${positions.length === 1 ? "leg" : "legs"} · holdings & AI review`
            }
            icon={
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent-strong">
                <Lightbulb className="h-4 w-4" aria-hidden />
              </div>
            }
          />
          {showReanalyze && (
            <ReanalyzeButton loading={loading} onClick={handleRefresh} />
          )}
        </div>

        {!isPortfolio && (
          <div className="mt-3 grid w-full grid-cols-3 gap-2">
            <StatChip label="Value" value={formatUsd(totalValue)} />
            <StatChip
              label="Open P/L"
              value={
                openPL != null
                  ? `${formatSignedUsd(openPL)}${
                      openPLPctVal != null
                        ? ` (${openPLPctVal >= 0 ? "+" : ""}${openPLPctVal.toFixed(1)}%)`
                        : ""
                    }`
                  : "—"
              }
              tone={openTone}
            />
            <StatChip
              label="Today"
              value={formatSignedUsd(dayPL)}
              tone={dayTone}
            />
          </div>
        )}
      </CardHeader>

      {isPortfolio && showPortfolioHoldings && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
            By symbol
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {alertSymbolCount > 0 && (
              <button
                type="button"
                onClick={() => setAlertsOnly((on) => !on)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
                  alertsOnly
                    ? "border-accent/40 bg-accent-muted text-accent-strong"
                    : "border-border bg-background text-muted hover:text-foreground",
                )}
              >
                <Filter className="h-3 w-3" aria-hidden />
                Alerts ({alertSymbolCount})
              </button>
            )}
            <div className="flex flex-wrap gap-1 rounded-lg bg-muted-bg/50 p-0.5">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSortKey(option.id)}
                  className={cn(
                    "rounded-md px-2 py-1 text-[11px] font-medium transition",
                    sortKey === option.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted hover:text-foreground",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {!isPortfolio && positions.length > 1 && (
        <div className="border-b border-border px-4 py-2.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
            Holdings
          </p>
        </div>
      )}

      <div
        className={cn("bg-background/20", !showPortfolioHoldings && "hidden")}
      >
        {isPortfolio ? (
          alertsOnly && symbolSummaries.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">
              No holdings match the alert filter.
            </p>
          ) : (
            <PortfolioHoldingsTable
              summaries={symbolSummaries}
              symbolAlertMap={symbolAlertMap}
            />
          )
        ) : (
          <SymbolLegsTable positions={positions} />
        )}
      </div>

      {analysisBlock}
    </Card>
  );
}
