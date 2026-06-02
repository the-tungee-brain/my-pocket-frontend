"use client";

import { useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import type { PatternIntelligence } from "@/app/types/intelligence";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { KpiStat } from "@/components/ui/KpiStat";
import { formatFriendlyDate } from "@/lib/dateUtils";
import {
  formatPatternPercent,
  hasPatternIntelligence,
  signalToneBorderClass,
  signalToneClass,
  verdictTone,
} from "@/lib/patternIntelligence";
import { cn } from "@/lib/utils";

type Props = {
  intelligence: PatternIntelligence | null | undefined;
  className?: string;
};

function SignalRow({
  label,
  value,
  warn,
  emphasize,
}: {
  label: string;
  value: string;
  warn?: boolean;
  emphasize?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="shrink-0 text-muted">{label}</span>
      <span
        className={cn(
          "text-right leading-snug",
          emphasize ? "font-semibold" : "font-medium",
          warn ? "text-warning" : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function TimeframeBlock({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/50 px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted">{caption}</p>
    </div>
  );
}

export function PatternIntelligenceCard({ intelligence, className }: Props) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  if (!hasPatternIntelligence(intelligence)) return null;

  const interp = intelligence.interpretation;
  const signalState = interp?.signalState;
  const timeframe = interp?.timeframe;
  const alignment = interp?.alignment;
  const summary = interp?.signalSummary;
  const evidence = interp?.evidence;
  const verdict = interp?.verdict ?? intelligence.explanation.confidenceExplanation;
  const tone = verdictTone(
    verdict,
    intelligence.scores.alignmentState,
    signalState,
    alignment,
  );

  const hasEvidenceStats =
    evidence?.occurrenceCount != null && evidence.avgReturn5d != null;

  return (
    <ResearchSectionCard
      title="Pattern intelligence"
      description="Model C drives decisions · patterns frame risk"
      icon={Sparkles}
      className={className}
    >
      <div className="app-stack">
        {signalState ? (
          <div
            className={cn(
              "rounded-xl border p-4",
              signalToneBorderClass[tone],
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Signal state
            </p>
            <p
              className={cn(
                "mt-2 text-2xl font-semibold tracking-tight",
                signalToneClass[tone],
              )}
            >
              {signalState.label}
            </p>
            <p className="mt-1 text-sm text-muted">{signalState.probabilityText}</p>
          </div>
        ) : null}

        {timeframe ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Multi-timeframe read
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <TimeframeBlock
                label="Short-term outlook"
                value={timeframe.shortTerm.label}
                caption={timeframe.shortTerm.caption}
              />
              <TimeframeBlock
                label="Long-term trend"
                value={timeframe.longTermTrend.label}
                caption={timeframe.longTermTrend.caption}
              />
              <TimeframeBlock
                label="Relative strength"
                value={timeframe.relativeStrength.label}
                caption={timeframe.relativeStrength.caption}
              />
            </div>
          </div>
        ) : null}

        <div
          className={cn(
            "rounded-xl border p-4",
            signalToneBorderClass[tone],
          )}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Verdict
          </p>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-foreground">
            {verdict}
          </p>
        </div>

        {alignment ? (
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-warning">
              {alignment.headline}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foreground">
              {alignment.explanation}
            </p>
          </div>
        ) : null}

        <div className="rounded-xl border border-border bg-background/30">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            onClick={() => setDetailsOpen((open) => !open)}
            aria-expanded={detailsOpen}
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Raw signals
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted transition-transform",
                detailsOpen && "rotate-180",
              )}
              aria-hidden
            />
          </button>
          {detailsOpen ? (
            <div className="space-y-2 border-t border-border px-4 pb-4 pt-3">
              <SignalRow label="Model C" value={summary?.modelC ?? "—"} emphasize />
              <SignalRow label="Trend" value={summary?.trend ?? "—"} />
              <SignalRow
                label="Relative strength"
                value={summary?.relativeStrength ?? "—"}
              />
              {summary?.pattern ? (
                <SignalRow
                  label="Pattern"
                  value={summary.pattern}
                  warn={summary.patternWarning}
                />
              ) : null}
              <p className="pt-1 text-[11px] text-muted">
                As of {formatFriendlyDate(intelligence.asOfDate)}
              </p>
            </div>
          ) : null}
        </div>

        {evidence ? (
          <div className="rounded-xl border border-border bg-background/30">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              onClick={() => setEvidenceOpen((open) => !open)}
              aria-expanded={evidenceOpen}
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                Historical evidence
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 shrink-0 text-muted transition-transform",
                  evidenceOpen && "rotate-180",
                )}
                aria-hidden
              />
            </button>
            {evidenceOpen ? (
              <div className="space-y-3 border-t border-border px-4 pb-4 pt-3">
                <div>
                  <p className="text-sm font-medium leading-relaxed text-foreground">
                    {evidence.framing ?? evidence.insight}
                  </p>
                  {evidence.statsNote ? (
                    <p className="mt-2 text-xs leading-relaxed text-muted">
                      {evidence.statsNote}
                    </p>
                  ) : null}
                  {evidence.conditionalNote ? (
                    <p className="mt-2 text-xs leading-relaxed text-muted">
                      {evidence.conditionalNote}
                    </p>
                  ) : null}
                </div>
                {hasEvidenceStats ? (
                  <div className="grid grid-cols-2 gap-3">
                    <KpiStat
                      label="Occurrences"
                      value={String(evidence.occurrenceCount)}
                    />
                    <KpiStat
                      label="5d win rate"
                      value={formatPatternPercent(evidence.winRate5d)}
                    />
                    <KpiStat
                      label="Avg 5d"
                      value={formatPatternPercent(evidence.avgReturn5d)}
                    />
                    <KpiStat
                      label="Avg 20d"
                      value={formatPatternPercent(evidence.avgReturn20d)}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <p className="text-[11px] leading-relaxed text-muted">
          {intelligence.explanation.disclaimer}
        </p>
      </div>
    </ResearchSectionCard>
  );
}
