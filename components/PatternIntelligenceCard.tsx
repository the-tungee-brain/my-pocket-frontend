"use client";

import { CircleHelp, Sparkles } from "lucide-react";
import type {
  ChartAnalystSummary,
  PatternIntelligence,
  PrimaryCandlestickPattern,
} from "@/app/types/intelligence";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { formatFriendlyDate } from "@/lib/dateUtils";
import {
  isPatternIntelligenceBenchmark,
  patternIntelligenceBenchmarkNotice,
} from "@/lib/modelBenchmark";
import { patternCandlestickDescription } from "@/lib/patternCandlestickReference";
import {
  hasChartAnalystSummary,
  hasPatternIntelligence,
  outlookHeadline,
  outlookTone,
  patternIntelligencePatternSubtitle,
  patternIntelligencePrimaryPattern,
  signalToneBorderClass,
  signalToneClass,
} from "@/lib/patternIntelligence";
import { cn } from "@/lib/utils";

type Props = {
  intelligence: PatternIntelligence | null | undefined;
  className?: string;
};

function PatternHelpButton({ patternId }: { patternId: string }) {
  const description = patternCandlestickDescription(patternId);
  if (!description) return null;

  return (
    <span className="group relative inline-flex shrink-0">
      <button
        type="button"
        className="inline-flex rounded-full text-muted transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        aria-label="What is this candlestick pattern?"
        title={description}
      >
        <CircleHelp className="h-4 w-4" aria-hidden />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-64 -translate-x-1/2 rounded-lg border border-border bg-background px-2.5 py-2 text-left text-[11px] font-normal normal-case leading-relaxed tracking-normal text-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {description}
      </span>
    </span>
  );
}

function CompactPatternLine({
  pattern,
}: {
  pattern: PrimaryCandlestickPattern | null;
}) {
  if (!pattern) return null;

  return (
    <p className="text-sm text-muted">
      <span className="font-medium text-foreground">{pattern.label}</span>
      {" · "}
      {patternIntelligencePatternSubtitle(pattern)}
      <span className="ml-1.5 inline-flex align-middle">
        <PatternHelpButton patternId={pattern.patternId} />
      </span>
    </p>
  );
}

function AnalystSummaryBody({
  summary,
  isBenchmark,
  benchmarkNotice,
  pattern,
  asOfDate,
}: {
  summary: ChartAnalystSummary;
  isBenchmark: boolean;
  benchmarkNotice: string;
  pattern: PrimaryCandlestickPattern | null;
  asOfDate: string;
}) {
  const { outlook, keyLevel, whyThisOutlook, thesis } = summary;
  const tone = outlookTone(outlook);

  return (
    <>
      <div
        className={cn(
          "rounded-xl border p-4",
          isBenchmark
            ? "border-border bg-background/40"
            : signalToneBorderClass[tone],
        )}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Outlook
        </p>
        <p
          className={cn(
            "mt-2 text-2xl font-semibold tracking-tight",
            isBenchmark ? "text-foreground" : signalToneClass[tone],
          )}
        >
          {outlookHeadline(outlook)}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-foreground">
          {outlook.expectation}
        </p>
        {isBenchmark ? (
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {outlook.benchmarkNotice ?? benchmarkNotice}
          </p>
        ) : null}
        <CompactPatternLine pattern={pattern} />
      </div>

      {keyLevel.available !== false && keyLevel.price != null ? (
        <div className="rounded-xl border border-border bg-background/40 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Key level
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {keyLevel.display}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {keyLevel.implication}
          </p>
        </div>
      ) : null}

      {whyThisOutlook.length > 0 ? (
        <div className="rounded-xl border border-border bg-background/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Why this outlook
          </p>
          <ul className="mt-3 space-y-2">
            {whyThisOutlook.map((bullet) => (
              <li
                key={bullet.text}
                className="flex gap-2 text-sm leading-snug text-foreground"
              >
                <span
                  className={cn(
                    "shrink-0 font-semibold",
                    bullet.tone === "caution"
                      ? "text-warning"
                      : "text-success",
                  )}
                  aria-hidden
                >
                  {bullet.tone === "caution" ? "⚠" : "✓"}
                </span>
                <span>{bullet.text}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-background/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Thesis
        </p>
        <p className="mt-2 text-sm leading-relaxed text-foreground">{thesis}</p>
      </div>

      <p className="text-[11px] leading-relaxed text-muted">
        {summary.disclaimer}
      </p>
      <p className="text-[11px] text-muted">
        As of {formatFriendlyDate(asOfDate)}
      </p>
    </>
  );
}

export function PatternIntelligenceCard({ intelligence, className }: Props) {
  if (!hasPatternIntelligence(intelligence)) return null;

  const summary = intelligence.chartIntelligence?.summary;
  if (!summary || !hasChartAnalystSummary(intelligence.chartIntelligence)) {
    return null;
  }

  const isBenchmark = isPatternIntelligenceBenchmark(intelligence);
  const benchmarkNotice = patternIntelligenceBenchmarkNotice(intelligence);
  const primaryPattern = patternIntelligencePrimaryPattern(intelligence);

  return (
    <ResearchSectionCard
      title="Chart intelligence"
      description={
        isBenchmark
          ? "5-day outlook from structure and regime · no Model C on benchmark"
          : "5-day outlook · conclusion first, key evidence only"
      }
      icon={Sparkles}
      className={className}
    >
      <div className="app-stack">
        <AnalystSummaryBody
          summary={summary}
          isBenchmark={isBenchmark}
          benchmarkNotice={benchmarkNotice}
          pattern={primaryPattern}
          asOfDate={intelligence.asOfDate}
        />
      </div>
    </ResearchSectionCard>
  );
}
