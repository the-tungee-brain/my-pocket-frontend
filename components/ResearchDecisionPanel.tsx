"use client";

import Link from "next/link";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Layers,
  Minus,
  Shield,
} from "lucide-react";
import type { ResearchDecision } from "@/app/types/intelligence";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { KpiStat } from "@/components/ui/KpiStat";
import { cn } from "@/lib/utils";

type Props = {
  decision: ResearchDecision | null | undefined;
  className?: string;
};

const trendTone = {
  bullish: "text-success border-success/25 bg-success/5",
  bearish: "text-danger border-danger/25 bg-danger/5",
  neutral: "text-muted border-border bg-background/40",
} as const;

function TrendPill({ label }: { label: string }) {
  const key = label.toLowerCase() as keyof typeof trendTone;
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
        trendTone[key] ?? trendTone.neutral,
      )}
    >
      {label}
    </span>
  );
}

function DriverList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "positive" | "negative";
}) {
  if (items.length === 0) return null;
  const Icon = tone === "positive" ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{title}</p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-foreground">
            <Icon
              className={cn(
                "mt-0.5 h-3.5 w-3.5 shrink-0",
                tone === "positive" ? "text-success" : "text-danger",
              )}
              aria-hidden
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ResearchDecisionPanel({ decision, className }: Props) {
  if (!decision || decision.isBenchmark) return null;

  const quality = decision.researchQualityScore;
  const mtf = decision.multiTimeframe;
  const ranking = decision.ranking;
  const change = decision.signalChange;
  const contributors = decision.contributors;
  const regime = decision.regime;

  return (
    <ResearchSectionCard
      title="Research decision"
      description="Multi-timeframe context, ranking position, and signal drivers"
      icon={Layers}
      className={className}
    >
      <div className="app-stack">
        {quality ? (
          <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Research quality
                </p>
                <p className="mt-1 text-3xl font-bold tabular-nums text-foreground">
                  {quality.score}
                  <span className="text-base font-medium text-muted"> / 100</span>
                </p>
                <p className="mt-1 text-sm text-foreground">{quality.headline}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <KpiStat label="Model" value={`${quality.components.modelConfidence}`} />
                <KpiStat label="Trend" value={`${quality.components.trendQuality}`} />
                <KpiStat label="RS" value={`${quality.components.relativeStrength}`} />
                <KpiStat label="Regime" value={`${quality.components.regimeAlignment}`} />
                <KpiStat label="Chart" value={`${quality.components.chartIntelligence}`} />
              </div>
            </div>
          </div>
        ) : null}

        {mtf ? (
          <div className="rounded-xl border border-border bg-background/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Multi-timeframe
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
                  Weekly trend
                </p>
                <div className="mt-1">
                  <TrendPill label={mtf.weeklyTrendLabel} />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
                  Daily trend
                </p>
                <div className="mt-1">
                  <TrendPill label={mtf.dailyTrendLabel} />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
                  5-day forecast
                </p>
                <div className="mt-1">
                  <TrendPill label={mtf.forecastTrendLabel} />
                </div>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-foreground">
              <span className="font-medium">Conclusion: </span>
              {mtf.conclusion}
            </p>
          </div>
        ) : null}

        {ranking ? (
          <div className="rounded-xl border border-border bg-background/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Ranking
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <KpiStat label="Rank" value={ranking.rankDisplay} />
              <KpiStat label="Percentile" value={ranking.percentileLabel} />
              <KpiStat
                label="Expected outcome"
                value={ranking.expectedOutcome}
                className="sm:col-span-1 col-span-2"
              />
            </div>
          </div>
        ) : null}

        {change ? (
          <div className="rounded-xl border border-border bg-background/40 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
              <Activity className="h-3.5 w-3.5" aria-hidden />
              What changed
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted">Yesterday</p>
                <p className="font-semibold tabular-nums">{change.priorScorePct}%</p>
              </div>
              <Minus className="h-4 w-4 text-muted" aria-hidden />
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted">Today</p>
                <p className="font-semibold tabular-nums">{change.todayScorePct}%</p>
              </div>
            </div>
            <p className="mt-2 text-sm text-muted">{change.summary}</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <DriverList title="Drivers" items={change.negativeDrivers} tone="negative" />
              <DriverList title="Tailwinds" items={change.positiveDrivers} tone="positive" />
            </div>
          </div>
        ) : null}

        {contributors ? (
          <div className="rounded-xl border border-border bg-background/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              Model contribution
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <DriverList title="Positive contributors" items={contributors.positive} tone="positive" />
              <DriverList title="Negative contributors" items={contributors.negative} tone="negative" />
            </div>
          </div>
        ) : null}

        {regime ? (
          <div className="rounded-xl border border-border bg-background/40 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
              <Shield className="h-3.5 w-3.5" aria-hidden />
              Regime awareness
            </div>
            <p className="mt-2 text-sm font-medium text-foreground">
              Current regime: {regime.current.regimeLabel}
            </p>
            <p className="mt-1 text-sm text-muted">
              Historical Model C: {regime.current.historicalPerformance.label}
            </p>
            {regime.alignmentNote ? (
              <p className="mt-2 text-sm leading-relaxed text-foreground">{regime.alignmentNote}</p>
            ) : null}
          </div>
        ) : null}

        <p className="text-xs text-muted">
          <Link href="/research/model-diagnostics" className="text-accent-strong hover:underline">
            View model diagnostics
          </Link>
          {" · "}Ranking scores reflect relative positioning, not absolute return forecasts.
        </p>
      </div>
    </ResearchSectionCard>
  );
}

export function ResearchDecisionHeadline({
  decision,
  className,
}: {
  decision: ResearchDecision | null | undefined;
  className?: string;
}) {
  const score = decision?.researchQualityScore?.score;
  if (score == null) return null;
  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      <BarChart3 className="h-4 w-4 text-accent-strong" aria-hidden />
      <span className="font-medium text-foreground">Research quality {score}/100</span>
    </div>
  );
}
