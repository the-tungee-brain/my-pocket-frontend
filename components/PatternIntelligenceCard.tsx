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
  verdictTone,
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

function SignalRow({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="shrink-0 text-muted">{label}</span>
      <span
        className={cn(
          "text-right font-medium leading-snug",
          warn ? "text-warning" : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function PatternIntelligenceCard({ intelligence, className }: Props) {
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  if (!hasPatternIntelligence(intelligence)) return null;

  const interp = intelligence.interpretation;
  const summary = interp?.signalSummary;
  const evidence = interp?.evidence;
  const verdict = interp?.verdict ?? intelligence.explanation.confidenceExplanation;
  const tone = verdictTone(verdict, intelligence.scores.alignmentState);

  const hasEvidenceStats =
    evidence?.occurrenceCount != null && evidence.avgReturn5d != null;

  return (
    <ResearchSectionCard
      title="Pattern intelligence"
      description="Decision overlay on Model C"
      icon={Sparkles}
      className={className}
    >
      <div className="app-stack">
        <div className="rounded-xl border border-border bg-surface-elevated/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Signal summary
          </p>
          <div className="mt-3 space-y-2">
            <SignalRow
              label="Model C"
              value={summary?.modelC ?? "—"}
            />
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
          </div>
          <p className="mt-3 text-[11px] text-muted">
            As of {formatFriendlyDate(intelligence.asOfDate)}
          </p>
        </div>

        <div
          className={cn(
            "rounded-xl border p-4",
            toneBorderClass[tone],
          )}
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Verdict
          </p>
          <p className="mt-2 text-sm font-medium leading-relaxed text-foreground">
            {verdict}
          </p>
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
                Evidence
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
                <p className="text-sm leading-relaxed text-muted">{evidence.summary}</p>
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
