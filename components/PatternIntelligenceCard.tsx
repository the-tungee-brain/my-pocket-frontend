"use client";

import { AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import type {
  PatternConfidenceContributor,
  PatternIntelligence,
  PatternVerdictBullet,
} from "@/app/types/intelligence";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { KpiStat } from "@/components/ui/KpiStat";
import { formatFriendlyDate } from "@/lib/dateUtils";
import {
  formatPatternPercent,
  hasPatternIntelligence,
  interpretationTone,
  setupOutcomeHasStats,
  verdictBulletIcon,
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

function ContributorRow({ row }: { row: PatternConfidenceContributor }) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2.5",
        row.emphasized
          ? "border-accent/30 bg-accent/5"
          : "border-border bg-background/30",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={cn(
              "text-sm font-medium",
              row.emphasized ? "text-foreground" : "text-muted",
            )}
          >
            {row.label}{" "}
            <span className="text-xs font-normal text-muted">({row.weightPct}% weight)</span>
          </p>
          {row.emphasized ? (
            <p className="mt-0.5 text-[11px] uppercase tracking-wide text-accent">
              Core contributor
            </p>
          ) : null}
        </div>
        <span
          className={cn(
            "shrink-0 text-sm font-semibold",
            row.emphasized ? "text-foreground" : "text-muted",
          )}
        >
          {row.qualitative}
        </span>
      </div>
    </div>
  );
}

function VerdictBullet({ bullet }: { bullet: PatternVerdictBullet }) {
  return (
    <li className="flex items-start gap-2 text-sm leading-relaxed text-foreground">
      <span className="mt-0.5 shrink-0" aria-hidden>
        {verdictBulletIcon(bullet.tone)}
      </span>
      <span>{bullet.text}</span>
    </li>
  );
}

export function PatternIntelligenceCard({ intelligence, className }: Props) {
  if (!hasPatternIntelligence(intelligence)) return null;

  const { explanation, setupOutcome, interpretation, trendContext } = intelligence;
  const interp = interpretation;
  const heroTone = interpretationTone(interp?.actionableVerdict, intelligence.scores.alignmentState);

  return (
    <ResearchSectionCard
      title="Pattern intelligence"
      description="Confirmation layer for Model C — not a standalone trade signal"
      icon={Sparkles}
      className={className}
    >
      <div className="app-stack">
        <div
          className={cn(
            "rounded-xl border p-4",
            toneBorderClass[heroTone],
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                toneBorderClass[heroTone],
              )}
            >
              {heroTone === "warning" ? (
                <AlertTriangle className={cn("h-5 w-5", toneTextClass.warning)} />
              ) : (
                <CheckCircle2 className={cn("h-5 w-5", toneTextClass[heroTone])} />
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-lg font-semibold text-foreground">
                {interp?.actionableVerdict ?? explanation.confidenceExplanation}
              </p>
              <p className="text-sm leading-relaxed text-muted">{explanation.headline}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <KpiStat
              label="Core signal"
              value="Model C"
            />
            <KpiStat
              label="Trend"
              value={trendContext.trendBias.replace(/^\w/, (c) => c.toUpperCase())}
            />
            <KpiStat
              label="Pattern role"
              value="10% weight"
            />
            <KpiStat
              label="As of"
              value={formatFriendlyDate(intelligence.asOfDate)}
            />
          </div>
        </div>

        <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            Trader summary
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground">
            {interp?.traderSummary ?? explanation.modelContext}
          </p>
        </div>

        {interp?.finalVerdict ? (
          <div className="space-y-3 rounded-xl border border-border bg-surface-elevated/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {interp.finalVerdict.title}
            </p>
            <ul className="space-y-2">
              {interp.finalVerdict.bullets.map((bullet) => (
                <VerdictBullet key={bullet.text} bullet={bullet} />
              ))}
            </ul>
            <div className="border-t border-border pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Conclusion
              </p>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                {interp.finalVerdict.conclusion}
              </p>
            </div>
          </div>
        ) : null}

        {interp?.confidenceContributors?.length ? (
          <div className="space-y-3 rounded-xl border border-border bg-background/40 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Confidence contributors
            </p>
            <p className="text-xs leading-relaxed text-muted">
              Trend and relative strength drive 70% of the confirmation score. Pattern
              strength is capped at 10% — it explains context, not alpha.
            </p>
            <div className="space-y-2">
              {interp.confidenceContributors.map((row) => (
                <ContributorRow key={row.key} row={row} />
              ))}
            </div>
          </div>
        ) : null}

        <div className="space-y-3 rounded-xl border border-border bg-surface-elevated/30 p-4">
          <p className="text-sm font-medium text-foreground">{explanation.modelContext}</p>
          <p className="text-sm leading-relaxed text-muted">{explanation.trendContext}</p>
        </div>

        {setupOutcome ? (
          <div className="space-y-3 rounded-xl border border-border bg-background/40 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Setup history (pattern + trend + RS)
            </p>
            <p className="text-sm font-medium text-foreground">{setupOutcome.label}</p>
            {setupOutcomeHasStats(setupOutcome) ? (
              <>
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
                {interp?.historicalRead ? (
                  <div className="rounded-lg border border-border bg-background/30 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Historical read
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground">
                      {interp.historicalRead}
                    </p>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted">
                {interp?.historicalRead ?? explanation.historicalContext}
              </p>
            )}
          </div>
        ) : interp?.historicalRead ? (
          <div className="rounded-lg border border-border bg-background/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Historical read
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foreground">
              {interp.historicalRead}
            </p>
          </div>
        ) : null}

        <p className="rounded-lg border border-border bg-background/30 px-3 py-2 text-xs leading-relaxed text-muted">
          {explanation.disclaimer}
        </p>
      </div>
    </ResearchSectionCard>
  );
}
