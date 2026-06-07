"use client";

import { CircleHelp } from "lucide-react";
import type {
  ChartAnalystSummary,
  ChartIntelligenceSelectedLevels,
  ChartIntelligenceZone,
  PatternIntelligence,
  PrimaryCandlestickPattern,
} from "@/app/types/intelligence";
import { ResearchSection } from "@/components/research/ResearchMemoPrimitives";
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
  currentPrice?: number | null;
  className?: string;
};

type LevelListRow = {
  key: string;
  title: string;
} & (
  | {
      kind: "zone";
      zone: ChartIntelligenceZone;
    }
  | {
      kind: "price";
      value: number;
    }
);

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

function levelTitle(kind: "support" | "resistance", index: number) {
  if (kind === "support") {
    if (index === 0) return "Nearest support";
    if (index === 1) return "Next support";
    return "Major support";
  }
  if (index === 0) return "Nearest resistance";
  if (index === 1) return "Next resistance";
  return "Major resistance";
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

function zoneBreakoutPrice(zone: ChartIntelligenceZone): number | null {
  if (
    typeof zone.breakoutLevel === "number" &&
    Number.isFinite(zone.breakoutLevel)
  ) {
    return zone.breakoutLevel;
  }
  return zoneDisplayPrice(zone);
}

function isActiveSupport(
  zone: ChartIntelligenceZone | null | undefined,
  referencePrice: number | null | undefined,
): zone is ChartIntelligenceZone {
  if (
    !zone ||
    typeof referencePrice !== "number" ||
    !Number.isFinite(referencePrice)
  ) {
    return false;
  }
  const price = zoneDisplayPrice(zone);
  return typeof price === "number" && price < referencePrice;
}

function isActiveResistance(
  zone: ChartIntelligenceZone | null | undefined,
  referencePrice: number | null | undefined,
): zone is ChartIntelligenceZone {
  if (
    !zone ||
    typeof referencePrice !== "number" ||
    !Number.isFinite(referencePrice)
  ) {
    return false;
  }
  const price = zoneDisplayPrice(zone);
  const breakout = zoneBreakoutPrice(zone);
  return (
    typeof price === "number" &&
    typeof breakout === "number" &&
    price > referencePrice &&
    breakout > referencePrice
  );
}

function LevelRow({
  row,
}: {
  row: LevelListRow;
}) {
  const displayPrice =
    row.kind === "zone" ? zoneDisplayPrice(row.zone) : row.value;
  const detail =
    row.kind === "zone"
      ? row.zone.distancePctFromCurrent != null
        ? `${Math.abs(row.zone.distancePctFromCurrent).toFixed(1)}% from current price`
        : "Distance unavailable"
      : "Reference price";

  return (
    <div className="grid gap-1 border-b border-border/60 py-3 last:border-b-0 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
        {row.title}
      </p>
      <div className="min-w-0">
        <p className="font-mono text-sm font-semibold text-foreground">
          {formatMoney(displayPrice)}
        </p>
        <p className="mt-1 text-xs text-muted">{detail}</p>
      </div>
    </div>
  );
}

function ChartLevelsSection({
  supports,
  resistances,
  selectedLevels,
  currentPrice,
}: {
  supports: ChartIntelligenceZone[];
  resistances: ChartIntelligenceZone[];
  selectedLevels?: ChartIntelligenceSelectedLevels | null;
  currentPrice?: number | null;
}) {
  const referencePrice =
    typeof currentPrice === "number" && Number.isFinite(currentPrice)
      ? currentPrice
      : selectedLevels?.referencePrice;
  const selectedRows: LevelListRow[] = [];
  const nearestSupport = selectedLevels?.nearestSupport;
  const nextSupport = selectedLevels?.nextSupport;
  const nearestResistance = selectedLevels?.nearestResistance;
  const nextResistance = selectedLevels?.nextResistance;
  if (isActiveResistance(nextResistance, referencePrice)) {
    selectedRows.push({
      key: "next-resistance",
      title: "Next resistance",
      kind: "zone",
      zone: nextResistance,
    });
  }
  if (isActiveResistance(nearestResistance, referencePrice)) {
    selectedRows.push({
      key: "nearest-resistance",
      title: "Nearest resistance",
      kind: "zone",
      zone: nearestResistance,
    });
  }
  if (typeof referencePrice === "number" && Number.isFinite(referencePrice)) {
    selectedRows.push({
      key: "current-price",
      title: "Current price",
      kind: "price",
      value: referencePrice,
    });
  }
  if (isActiveSupport(nearestSupport, referencePrice)) {
    selectedRows.push({
      key: "nearest-support",
      title: "Nearest support",
      kind: "zone",
      zone: nearestSupport,
    });
  }
  if (isActiveSupport(nextSupport, referencePrice)) {
    selectedRows.push({
      key: "next-support",
      title: "Next support",
      kind: "zone",
      zone: nextSupport,
    });
  }

  const fallbackSupports = supports
    .filter((zone) => isActiveSupport(zone, referencePrice))
    .sort(
      (a, b) =>
        (zoneDisplayPrice(b) ?? Number.NEGATIVE_INFINITY) -
        (zoneDisplayPrice(a) ?? Number.NEGATIVE_INFINITY),
    )
    .slice(0, 2)
    .map((zone, index) => ({
      key: `support-${index}`,
      title: levelTitle("support", index),
      kind: "zone" as const,
      zone,
    }));
  const fallbackResistances = resistances
    .filter((zone) => isActiveResistance(zone, referencePrice))
    .sort(
      (a, b) =>
        (zoneDisplayPrice(a) ?? Number.POSITIVE_INFINITY) -
        (zoneDisplayPrice(b) ?? Number.POSITIVE_INFINITY),
    )
    .slice(0, 2)
    .map((zone, index) => ({
      key: `resistance-${index}`,
      title: levelTitle("resistance", index),
      kind: "zone" as const,
      zone,
    }));
  const fallbackRows: LevelListRow[] = [
    fallbackResistances[1],
    fallbackResistances[0],
    typeof referencePrice === "number" && Number.isFinite(referencePrice)
      ? {
          key: "current-price",
          title: "Current price",
          kind: "price",
          value: referencePrice,
        }
      : undefined,
    fallbackSupports[0],
    fallbackSupports[1],
  ].filter((row): row is LevelListRow => Boolean(row));
  const hasSelectedZoneRows = selectedRows.some((row) => row.kind === "zone");
  const rows = (hasSelectedZoneRows ? selectedRows : fallbackRows).slice(0, 5);

  if (!rows.length) return null;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        Important price levels
      </p>
      <div className="mt-2">
        {rows.map((row) => (
          <LevelRow key={row.key} row={row} />
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
  supports,
  resistances,
  selectedLevels,
  currentPrice,
}: {
  summary: ChartAnalystSummary;
  isBenchmark: boolean;
  benchmarkNotice: string;
  pattern: PrimaryCandlestickPattern | null;
  supports: ChartIntelligenceZone[];
  resistances: ChartIntelligenceZone[];
  selectedLevels?: ChartIntelligenceSelectedLevels | null;
  currentPrice?: number | null;
}) {
  const { outlook, keyLevel, whyThisOutlook, thesis } = summary;
  const tone = outlookTone(outlook);

  return (
    <>
      <div>
        <p
          className={cn(
            "text-sm font-semibold",
            isBenchmark ? "text-foreground" : signalToneClass[tone],
          )}
        >
          Chart trend: {outlookHeadline(outlook)}
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
            Key chart level
          </p>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {keyLevel.display}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            {keyLevel.implication}
          </p>
        </div>
      ) : null}

      <ChartLevelsSection
        supports={supports}
        resistances={resistances}
        selectedLevels={selectedLevels}
        currentPrice={currentPrice}
      />

      {whyThisOutlook.length > 0 ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Why
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
          Chart summary
        </p>
        <p className="mt-2 text-sm leading-relaxed text-foreground">{thesis}</p>
      </div>

    </>
  );
}

export function PatternIntelligenceCard({
  intelligence,
  currentPrice,
  className,
}: Props) {
  if (!hasPatternIntelligence(intelligence)) return null;

  const summary = intelligence.chartIntelligence?.summary;
  if (!summary || !hasChartAnalystSummary(intelligence.chartIntelligence)) {
    return null;
  }

  const isBenchmark = isPatternIntelligenceBenchmark(intelligence);
  const benchmarkNotice = patternIntelligenceBenchmarkNotice(intelligence);
  const primaryPattern = patternIntelligencePrimaryPattern(intelligence);

  return (
    <ResearchSection title="Chart trend" className={className}>
      <div className="app-stack">
        <AnalystSummaryBody
          summary={summary}
          isBenchmark={isBenchmark}
          benchmarkNotice={benchmarkNotice}
          pattern={primaryPattern}
          supports={intelligence.chartIntelligence?.supportZones ?? []}
          resistances={intelligence.chartIntelligence?.resistanceZones ?? []}
          selectedLevels={intelligence.chartIntelligence?.selectedLevels}
          currentPrice={currentPrice}
        />
      </div>
    </ResearchSection>
  );
}
