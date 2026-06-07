"use client";

import { CircleHelp, Sparkles } from "lucide-react";
import type {
  ChartAnalystSummary,
  ChartIntelligenceZone,
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
        className="inline-flex text-muted transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        aria-label="What is this candlestick pattern?"
        title={description}
      >
        <CircleHelp className="h-4 w-4" aria-hidden />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-64 -translate-x-1/2 border border-border bg-background px-2.5 py-2 text-left text-[11px] font-normal normal-case leading-relaxed tracking-normal text-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
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

function formatMoney(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value))
    return "Unavailable";
  return `$${value.toFixed(2)}`;
}

function formatLevelRole(role: ChartIntelligenceZone["levelRole"]): string {
  if (role === "actionable") return "Actionable";
  if (role === "majorHistorical") return "Major";
  return "Context";
}

function levelRoleClass(role: ChartIntelligenceZone["levelRole"]): string {
  if (role === "actionable") return "text-success";
  if (role === "majorHistorical") return "text-muted";
  return "text-accent-strong";
}

function formatZoneState(zone: ChartIntelligenceZone): string {
  switch (zone.zoneState) {
    case "insideZone":
      return "Price inside zone";
    case "brokenAbove":
      return "Broken above";
    case "brokenBelow":
      return "Broken below";
    case "belowPrice":
      return "Below price";
    case "abovePrice":
      return "Above price";
    default:
      return "Chart context";
  }
}

function zoneDisplayPrice(zone: ChartIntelligenceZone): number | null {
  if (
    typeof zone.displayLevel === "number" &&
    Number.isFinite(zone.displayLevel)
  ) {
    return zone.displayLevel;
  }
  if (typeof zone.midpoint === "number" && Number.isFinite(zone.midpoint)) {
    return zone.midpoint;
  }
  if (
    typeof zone.priceLow === "number" &&
    Number.isFinite(zone.priceLow) &&
    typeof zone.priceHigh === "number" &&
    Number.isFinite(zone.priceHigh)
  ) {
    return (zone.priceLow + zone.priceHigh) / 2;
  }
  return null;
}

function LevelRow({
  title,
  zone,
}: {
  title: string;
  zone: ChartIntelligenceZone;
}) {
  const role = formatLevelRole(zone.levelRole);
  const state = formatZoneState(zone);
  const displayPrice = zoneDisplayPrice(zone);
  const mechanics: string[] = [];
  if (zone.actionableFor?.tradeStop) mechanics.push("Trade stop");
  if (zone.actionableFor?.tradeTarget) mechanics.push("Trade target");
  if (zone.actionableFor?.breakoutTrigger && zone.breakoutLevel != null) {
    mechanics.push(`Breakout ${formatMoney(zone.breakoutLevel)}`);
  }

  return (
    <div className="py-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
          {title}
        </p>
        <span
          className={cn(
            "text-[10px] font-semibold uppercase tracking-wide",
            levelRoleClass(zone.levelRole),
          )}
        >
          {role}
        </span>
      </div>
      <p className="mt-1 font-mono text-sm font-semibold text-foreground">
        {formatMoney(displayPrice)}
      </p>
      <p className="mt-1 text-xs text-muted">
        {state}
        {zone.distancePctFromCurrent != null
          ? ` · ${zone.distancePctFromCurrent.toFixed(1)}% from price`
          : ""}
      </p>
      {mechanics.length ? (
        <p className="mt-1 text-xs font-medium text-foreground">
          {mechanics.join(" · ")}
        </p>
      ) : null}
    </div>
  );
}

function ChartLevelsSection({
  supports,
  resistances,
}: {
  supports: ChartIntelligenceZone[];
  resistances: ChartIntelligenceZone[];
}) {
  const rows = [
    ...supports.slice(0, 3).map((zone, index) => ({
      key: `support-${index}`,
      title: `Support ${index + 1}`,
      zone,
    })),
    ...resistances.slice(0, 3).map((zone, index) => ({
      key: `resistance-${index}`,
      title: `Resistance ${index + 1}`,
      zone,
    })),
  ];

  if (!rows.length) return null;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        Chart levels
      </p>
      <div className="mt-2 grid divide-y divide-border/60 md:grid-cols-2 md:divide-x md:divide-y-0">
        {rows.map(({ key, title, zone }) => (
          <div key={key} className="md:px-3 first:md:pl-0">
            <LevelRow title={title} zone={zone} />
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalystSummaryBody({
  summary,
  isBenchmark,
  benchmarkNotice,
  pattern,
  asOfDate,
  supports,
  resistances,
}: {
  summary: ChartAnalystSummary;
  isBenchmark: boolean;
  benchmarkNotice: string;
  pattern: PrimaryCandlestickPattern | null;
  asOfDate: string;
  supports: ChartIntelligenceZone[];
  resistances: ChartIntelligenceZone[];
}) {
  const { outlook, keyLevel, whyThisOutlook, thesis } = summary;
  const tone = outlookTone(outlook);

  return (
    <>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Chart structure
        </p>
        <p
          className={cn(
            "mt-2 text-2xl font-semibold tracking-tight",
            isBenchmark ? "text-foreground" : signalToneClass[tone],
          )}
        >
          Chart structure: {outlookHeadline(outlook)}
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
        <div>
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

      <ChartLevelsSection supports={supports} resistances={resistances} />

      {whyThisOutlook.length > 0 ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Why this chart read
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
                    bullet.tone === "caution" ? "text-warning" : "text-success",
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

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Structure thesis
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
      title="Price structure evidence"
      description={
        isBenchmark
          ? "Qualitative 5-day read from price structure and patterns"
          : "Chart structure and pattern evidence for the next 5 sessions"
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
          supports={intelligence.chartIntelligence?.supportZones ?? []}
          resistances={intelligence.chartIntelligence?.resistanceZones ?? []}
        />
      </div>
    </ResearchSectionCard>
  );
}
