"use client";

import {
  CheckCircle2,
  GitCompareArrows,
  Layers3,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { PatternIntelligence } from "@/app/types/intelligence";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { KpiStat } from "@/components/ui/KpiStat";
import { formatFriendlyDate } from "@/lib/dateUtils";
import {
  formatPatternPercent,
  formatPatternScore,
  hasPatternIntelligence,
  patternAlignmentDescription,
  patternAlignmentLabel,
  patternAlignmentState,
  patternAlignmentTone,
  patternConfidenceLabel,
  patternConfidenceTone,
  scoreBreakdownRows,
  setupOutcomeHasStats,
} from "@/lib/patternIntelligence";
import { cn } from "@/lib/utils";

type Props = {
  intelligence: PatternIntelligence | null | undefined;
  className?: string;
};

const toneBorderClass = {
  positive: "border-success/25 bg-success/5",
  negative: "border-danger/25 bg-danger/5",
  neutral: "border-border bg-background/40",
  warning: "border-warning/25 bg-warning/5",
} as const;

const toneTextClass = {
  positive: "text-success",
  negative: "text-danger",
  neutral: "text-muted",
  warning: "text-warning",
} as const;

function ScoreBar({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: number;
  emphasize?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className={cn("font-medium", emphasize ? "text-foreground" : "text-muted")}>
          {label}
        </span>
        <span className="tabular-nums text-foreground">{formatPatternScore(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-background/70">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            emphasize ? "bg-accent-strong" : "bg-muted/50",
          )}
          style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }}
        />
      </div>
    </div>
  );
}

export function PatternIntelligenceCard({ intelligence, className }: Props) {
  if (!hasPatternIntelligence(intelligence)) return null;

  const { explanation, scores, trendContext, historicalStats, setupOutcome, primaryPattern } =
    intelligence;
  const alignment = patternAlignmentState(scores);
  const alignmentTone = patternAlignmentTone(alignment);
  const confidenceTone = patternConfidenceTone(scores.confidence);
  const breakdown = scoreBreakdownRows(scores);

  return (
    <ResearchSectionCard
      title="Pattern intelligence"
      description="How today's setup confirms the core RS + trend signal"
      icon={Sparkles}
      className={className}
    >
      <div className="app-stack">
        <div
          className={cn(
            "rounded-xl border p-4",
            toneBorderClass[alignmentTone],
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                toneBorderClass[alignmentTone],
              )}
            >
              {alignment === "confirmed" ? (
                <CheckCircle2 className={cn("h-5 w-5", toneTextClass[alignmentTone])} />
              ) : alignment === "conflict" ? (
                <GitCompareArrows className={cn("h-5 w-5", toneTextClass[alignmentTone])} />
              ) : (
                <TrendingUp className={cn("h-5 w-5", toneTextClass.neutral)} />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-semibold text-foreground">
                  {explanation.headline}
                </p>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    toneBorderClass[alignmentTone],
                    toneTextClass[alignmentTone],
                  )}
                >
                  {patternAlignmentLabel(alignment)}
                </span>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    toneBorderClass[confidenceTone],
                    toneTextClass[confidenceTone],
                  )}
                >
                  {patternConfidenceLabel(scores.confidence)}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-muted">
                {patternAlignmentDescription(alignment)}
              </p>
              <p className="text-sm leading-relaxed text-foreground">
                {explanation.confidenceExplanation}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <KpiStat
              label="Confirmation"
              value={formatPatternScore(scores.confirmationScore)}
              tone={alignmentTone === "positive" ? "positive" : "default"}
            />
            <KpiStat
              label="Model alignment"
              value={formatPatternScore(scores.modelAlignment)}
            />
            <KpiStat
              label="Trend"
              value={trendContext.trendBias.replace(/^\w/, (c) => c.toUpperCase())}
            />
            <KpiStat
              label="As of"
              value={formatFriendlyDate(intelligence.asOfDate)}
            />
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-surface-elevated/30 p-4">
          <p className="text-sm font-medium text-foreground">{explanation.modelContext}</p>
          {primaryPattern ? (
            <p className="text-sm leading-relaxed text-muted">
              {explanation.patternSummary}
            </p>
          ) : null}
          <p className="text-sm leading-relaxed text-muted">{explanation.trendContext}</p>
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-background/40 p-3">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
            <Layers3 className="h-3.5 w-3.5" aria-hidden />
            Signal breakdown
          </div>
          <div className="space-y-3">
            {breakdown.map((row) => (
              <ScoreBar
                key={row.key}
                label={row.label}
                value={row.value}
                emphasize={row.key === "trend" || row.key === "rs"}
              />
            ))}
          </div>
        </div>

        {setupOutcome ? (
          <div className="space-y-3 rounded-xl border border-border bg-background/40 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Setup history (pattern + trend + RS)
            </p>
            <p className="text-sm font-medium text-foreground">{setupOutcome.label}</p>
            {setupOutcomeHasStats(setupOutcome) ? (
              <div className="grid grid-cols-2 gap-3">
                <KpiStat
                  label="Occurrences"
                  value={String(setupOutcome.occurrenceCount)}
                />
                <KpiStat
                  label="Avg 5d"
                  value={formatPatternPercent(setupOutcome.avgReturn5d)}
                />
                <KpiStat
                  label="Avg 20d"
                  value={formatPatternPercent(setupOutcome.avgReturn20d)}
                />
                <KpiStat
                  label="5d win rate"
                  value={formatPatternPercent(setupOutcome.winRate5d)}
                />
              </div>
            ) : (
              <p className="text-sm text-muted">
                {explanation.historicalContext}
                {setupOutcome.patternOnlyCount > 0
                  ? ` (${setupOutcome.patternOnlyCount} pattern-only occurrences in the last 5 years.)`
                  : null}
              </p>
            )}
          </div>
        ) : historicalStats ? (
          <div className="space-y-2 rounded-xl border border-border bg-background/40 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">
              Pattern history
            </p>
            <p className="text-sm text-muted">{explanation.historicalContext}</p>
          </div>
        ) : (
          <p className="text-sm text-muted">{explanation.historicalContext}</p>
        )}

        <p className="rounded-lg border border-border bg-background/30 px-3 py-2 text-xs leading-relaxed text-muted">
          {explanation.disclaimer}
        </p>
      </div>
    </ResearchSectionCard>
  );
}
