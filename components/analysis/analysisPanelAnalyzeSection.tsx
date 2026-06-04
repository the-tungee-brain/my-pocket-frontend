"use client";

import { MessageSquare } from "lucide-react";
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
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { ConversationalMarkdown } from "@/components/ui/ConversationalMarkdown";
import { formatInsightsAnalyzedAt } from "@/lib/insightsCache";
import type { StructuredAnalysis } from "@/app/types/analysis";
import type { SymbolAnalysisPrecomputed } from "@/app/types/symbolAnalysis";
import type { PortfolioAnalysisPrecomputed } from "@/app/types/portfolioAnalysis";
import { cn } from "@/lib/utils";
import type { ComparePathKind } from "@/lib/inferRecommendedComparePath";

export type AnalysisPanelAnalyzeSectionProps = {
  isPortfolio: boolean;
  symbol: string | null;
  analyzeLabel: string;
  showAnalyzePrompt: boolean;
  showAnalysisOutput: boolean;
  analyzeButtonLoading: boolean;
  loading: boolean;
  error: string | null;
  analysisReady: boolean;
  content: string | null;
  displayAnalysis: StructuredAnalysis | null;
  showPortfolioAllocation: boolean;
  portfolioPrecomputed: PortfolioAnalysisPrecomputed | null;
  showComparePaths: boolean;
  precomputed: SymbolAnalysisPrecomputed | null;
  recommendedComparePath: ComparePathKind | null;
  analyzedAt: number | null;
  requested: boolean;
  isAnalyzing: boolean;
  onStart: () => void;
  onRefetch: () => void;
  onFollowUp: () => void;
  /** Hide LLM trade-action card when Position Guidance is authoritative. */
  hideRecommendedAction?: boolean;
};

export function AnalysisPanelAnalyzeSection({
  isPortfolio,
  symbol,
  analyzeLabel,
  showAnalyzePrompt,
  showAnalysisOutput,
  analyzeButtonLoading,
  loading,
  error,
  analysisReady,
  content,
  displayAnalysis,
  showPortfolioAllocation,
  portfolioPrecomputed,
  showComparePaths,
  precomputed,
  recommendedComparePath,
  analyzedAt,
  requested,
  isAnalyzing,
  onStart,
  onRefetch,
  onFollowUp,
  hideRecommendedAction = false,
}: AnalysisPanelAnalyzeSectionProps) {
  return (
    <>
      {showAnalyzePrompt && (
        <AnalyzePrompt
          isPortfolio={isPortfolio}
          symbol={symbol}
          label={analyzeLabel}
          loading={analyzeButtonLoading}
          onClick={onStart}
        />
      )}

      {showAnalysisOutput && (
        <div className="border-t border-border/70 px-4 py-4">
          {error && (
            <ErrorBanner message={error} onRetry={onRefetch} className="mb-3" />
          )}

          {analysisReady && (
            <div
              className={cn(
                "text-sm leading-relaxed text-foreground",
                loading && "opacity-90",
              )}
            >
              <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-muted">
                {hideRecommendedAction
                  ? "Guidance explanation (no trade actions)"
                  : "AI analysis"}
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
                  hideRecommendedAction={hideRecommendedAction}
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
                onClick={onRefetch}
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
                onClick={onFollowUp}
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
}
