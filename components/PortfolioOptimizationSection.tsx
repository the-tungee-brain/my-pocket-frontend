"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { SectorWeight } from "@/app/types/intelligence";
import type {
  PortfolioOptimizationBreakdown,
  PortfolioOptimizationBreakdownItem,
  PortfolioOptimizationResponse,
  PortfolioOptimizationScoreTone,
  PortfolioStockWeight,
} from "@/app/types/portfolioOptimization";
import { formatUsd } from "@/lib/formatCurrency";
import { formatSectorLabel } from "@/lib/intelligence";
import { symbolHubPath } from "@/lib/symbolRoutes";
import { cn } from "@/lib/utils";

const titleClass =
  "text-[11px] font-semibold uppercase tracking-wide text-muted";
const sectionClass = "space-y-4";

const breakdownRows: Array<{
  key: keyof Pick<
    PortfolioOptimizationBreakdown,
    | "stockConcentration"
    | "sectorConcentration"
    | "etfDiversification"
    | "cashAllocation"
    | "positionCount"
  >;
  label: string;
}> = [
  { key: "stockConcentration", label: "Stock concentration" },
  { key: "sectorConcentration", label: "Sector concentration" },
  { key: "etfDiversification", label: "ETF exposure" },
  { key: "cashAllocation", label: "Cash allocation" },
  { key: "positionCount", label: "Position count" },
];

function levelText(level: PortfolioStockWeight["level"]) {
  switch (level) {
    case "critical":
      return "Critical concentration";
    case "high":
      return "High concentration";
    case "elevated":
      return "Elevated concentration";
    default:
      return "Normal";
  }
}

function formatScorePoints(item: PortfolioOptimizationBreakdownItem) {
  if (item.score == null) return `— / ${item.maxScore}`;
  return `${Math.round(item.score)} / ${item.maxScore}`;
}

function scoreTone(
  optimization: PortfolioOptimizationResponse,
): PortfolioOptimizationScoreTone {
  if (optimization.scoreTone) return optimization.scoreTone;
  const score = optimization.diversificationScore;
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 55) return "fair";
  if (score >= 40) return "weak";
  return "poor";
}

function scoreToneClass(tone: PortfolioOptimizationScoreTone) {
  switch (tone) {
    case "excellent":
    case "good":
      return "text-success";
    case "fair":
      return "text-warning";
    case "weak":
      return "text-accent-highlight";
    case "poor":
      return "text-danger";
  }
}

function scoreChipClass(tone: PortfolioOptimizationScoreTone) {
  switch (tone) {
    case "excellent":
    case "good":
      return "border-success/30 bg-success/10 text-success";
    case "fair":
      return "border-warning/30 bg-warning-muted text-warning";
    case "weak":
      return "border-accent-highlight/30 bg-accent-muted text-accent-highlight";
    case "poor":
      return "border-danger/30 bg-danger/10 text-danger";
  }
}

function scoreColorStyle(optimization: PortfolioOptimizationResponse) {
  return optimization.scoreColor
    ? { color: optimization.scoreColor }
    : undefined;
}

function formatAllocation(value: number | null | undefined) {
  if (value == null) return null;
  return `${value.toFixed(1)}%`;
}

function formatApproxUsd(value: number | null | undefined) {
  if (value == null) return null;
  return `~${formatUsd(value, { maximumFractionDigits: 0 })}`;
}

function formatScoreDelta(value: number) {
  const rounded = Math.round(value);
  return Number.isInteger(value) || Math.abs(value - rounded) < 0.05
    ? String(rounded)
    : value.toFixed(1);
}

function formatApproxShares(value: number | null | undefined) {
  if (value == null) return null;
  return `~${Math.round(value)} shares`;
}

function trimActionLabel(category: string) {
  if (category === "sectorConcentration") return "Reallocate";
  if (category === "etfDiversification") return "Buy";
  return "Trim";
}

function actionPrimary(
  item: PortfolioOptimizationResponse["rankedSuggestions"][number],
) {
  if (item.deltaValue == null) return item.action;
  const amount = formatApproxUsd(Math.abs(item.deltaValue));
  if (item.category === "etfDiversification") {
    return amount ? `${amount} ETFs` : item.action;
  }
  return amount ?? item.action;
}

function actionSecondary(
  item: PortfolioOptimizationResponse["rankedSuggestions"][number],
) {
  if (
    item.category === "stockConcentration" ||
    item.category === "portfolioRebalance"
  ) {
    return formatApproxShares(item.estimatedShares);
  }
  if (item.category === "sectorConcentration") {
    return "Healthcare, Financials, Industrials, Staples, ETFs";
  }
  if (item.category === "etfDiversification") {
    return "VOO, VTI, SCHB, or similar";
  }
  return null;
}

function MetricTile({
  label,
  children,
  compact = false,
}: {
  label: string;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "border border-border/60 bg-card/40",
        compact ? "p-2.5" : "p-3",
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <div className="mt-1 min-w-0">{children}</div>
    </div>
  );
}

export function DiversificationScoreSection({
  optimization,
  loading,
  className,
}: {
  optimization: PortfolioOptimizationResponse | null;
  loading?: boolean;
  className?: string;
}) {
  return (
    <section className={cn(sectionClass, className)}>
      <div className="flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className={titleClass}>Diversification score</h2>
          {loading && !optimization ? (
            <p className="mt-2 text-sm text-muted">
              Calculating diversification…
            </p>
          ) : optimization ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-3xl font-semibold tracking-tight text-foreground">
                <span
                  className={scoreToneClass(scoreTone(optimization))}
                  style={scoreColorStyle(optimization)}
                >
                  {optimization.diversificationScore}
                </span>
                {" / 100"}
              </p>
              <span
                className={cn(
                  "inline-flex h-6 items-center border px-2 text-xs font-semibold leading-none",
                  scoreChipClass(scoreTone(optimization)),
                )}
                style={scoreColorStyle(optimization)}
              >
                {optimization.rating}
              </span>
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted">
              Diversification score is not available yet.
            </p>
          )}
        </div>
        {optimization ? (
          <p className="max-w-md text-sm text-muted">
            The score rewards lower single-name risk, balanced sectors, ETF
            exposure, useful cash, and enough positions to diversify.
          </p>
        ) : null}
      </div>
      {optimization ? (
        <div className="divide-y divide-border/60">
          {breakdownRows.map(({ key, label }) => {
            const item = optimization.breakdown[key];
            return (
              <div
                key={key}
                className="grid gap-2 py-3 sm:grid-cols-[11rem_minmax(0,1fr)_5.5rem] sm:items-start"
              >
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-sm text-muted">{item.summary}</p>
                <p className="text-left text-sm font-medium tabular-nums text-foreground sm:text-right">
                  {formatScorePoints(item)}
                </p>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

export function PortfolioOptimizationDataQuality({
  optimization,
  className,
}: {
  optimization: PortfolioOptimizationResponse | null;
  className?: string;
}) {
  const dataGaps = optimization?.dataGaps ?? [];
  if (!dataGaps.length) return null;

  return (
    <section className={cn(sectionClass, className)}>
      <div>
        <h2 className={titleClass}>Data quality</h2>
        <p className="mt-1 text-sm text-muted">
          Metadata notes used for this optimization view.
        </p>
      </div>
      <div className="divide-y divide-border/60 border-t border-border/60">
        {dataGaps.map((gap) => (
          <p key={gap} className="py-3 text-sm text-muted">
            {gap}
          </p>
        ))}
      </div>
    </section>
  );
}

export function StockDiversificationSection({
  stockWeights,
  className,
}: {
  stockWeights: PortfolioStockWeight[];
  className?: string;
}) {
  return (
    <section className={cn(sectionClass, className)}>
      <div>
        <h2 className={titleClass}>Stock allocation</h2>
        <p className="mt-1 text-sm text-muted">
          Allocation summary by symbol. Holdings below shows the full position
          table.
        </p>
      </div>
      {stockWeights.length ? (
        <div className="divide-y divide-border/60 border-t border-border/60">
          {stockWeights.slice(0, 6).map((item) => (
            <div
              key={item.symbol}
              className="grid gap-3 py-3 sm:grid-cols-[6rem_minmax(0,1fr)_8rem_8rem] sm:items-center"
            >
              <Link
                href={symbolHubPath(item.symbol, "overview")}
                className="font-mono text-sm font-medium text-foreground hover:underline"
              >
                {item.symbol}
              </Link>
              <div className="h-2 bg-border/50">
                <div
                  className="h-full bg-foreground"
                  style={{
                    width: `${Math.min(100, item.portfolioWeightPct)}%`,
                  }}
                />
              </div>
              <p className="text-sm tabular-nums text-foreground sm:text-right">
                {item.portfolioWeightPct.toFixed(1)}%
              </p>
              <div className="sm:text-right">
                <p className="text-sm tabular-nums text-muted">
                  {formatUsd(item.marketValue)}
                </p>
                {item.level !== "normal" ? (
                  <p className="mt-0.5 text-[11px] text-warning">
                    {levelText(item.level)}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="border-t border-border/60 py-3 text-sm text-muted">
          Stock weights are not available yet.
        </p>
      )}
    </section>
  );
}

export function SectorDiversificationRows({
  sectors,
  className,
}: {
  sectors: SectorWeight[];
  className?: string;
}) {
  const sorted = [...sectors].sort((a, b) => b.weightPct - a.weightPct);

  return (
    <section className={cn(sectionClass, className)}>
      <div>
        <h2 className={titleClass}>Sector diversification</h2>
        <p className="mt-1 text-sm text-muted">
          Sector exposure often explains why a portfolio feels diversified by
          ticker but still carries concentrated risk.
        </p>
      </div>
      {sorted.length ? (
        <div className="divide-y divide-border/60 border-t border-border/60">
          {sorted.slice(0, 8).map((sector) => (
            <div
              key={sector.sector}
              className="grid gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(10rem,20rem)_4.5rem] sm:items-center"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {formatSectorLabel(sector.sector, {
                    preserveUnknown: true,
                  })}
                </p>
                {sector.symbols.length ? (
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {sector.symbols.slice(0, 6).join(", ")}
                    {sector.symbols.length > 6 ? "…" : ""}
                  </p>
                ) : null}
              </div>
              <div className="h-2 bg-border/50">
                <div
                  className="h-full bg-foreground"
                  style={{
                    width: `${Math.max(0, Math.min(100, sector.weightPct))}%`,
                  }}
                />
              </div>
              <p className="text-left text-sm font-medium tabular-nums text-foreground sm:text-right">
                {sector.weightPct.toFixed(1)}%
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="border-t border-border/60 py-3 text-sm text-muted">
          Sector weights are not available yet.
        </p>
      )}
    </section>
  );
}

export function OptimizationSuggestionsSection({
  optimization,
  className,
}: {
  optimization: PortfolioOptimizationResponse | null;
  className?: string;
}) {
  const suggestions = optimization?.rankedSuggestions.slice(0, 3) ?? [];
  const highestImpact = suggestions.slice(0, 1);
  const diversificationOpportunities = suggestions.slice(1);
  const suggestionGroups = [
    { label: "Highest Impact", items: highestImpact },
    {
      label: "Diversification Opportunities",
      items: diversificationOpportunities,
    },
  ].filter((group) => group.items.length > 0);

  return (
    <section className={cn(sectionClass, className)}>
      <div>
        <h2 className={titleClass}>Optimization suggestions</h2>
        <p className="mt-1 text-sm text-muted">
          Suggestions may overlap. Completing one action may partially satisfy
          others.
        </p>
      </div>
      {suggestions.length ? (
        <div className="space-y-5 border-t border-border/60 pt-3">
          {suggestionGroups.map((group) => (
            <div key={group.label} className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                {group.label}
              </p>
              <div
                className={cn(
                  group.label === "Highest Impact"
                    ? "space-y-0"
                    : "divide-y divide-border/50",
                )}
              >
                {group.items.map((item) => {
                  const isPrimary = group.label === "Highest Impact";
                  return (
                    <div
                      key={`${item.rank}-${item.category}-${item.title}`}
                      className={cn(
                        "space-y-2.5 first:pt-0",
                        isPrimary
                          ? "py-2"
                          : "py-3 opacity-90 transition-opacity hover:opacity-100",
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          className={cn(
                            "min-w-0 flex-1 font-medium text-foreground",
                            isPrimary ? "text-base" : "text-sm",
                          )}
                        >
                          {item.title}
                        </h3>
                        <span className="inline-flex h-6 items-center border border-success/30 bg-success/10 px-2 text-xs font-semibold tabular-nums text-success">
                          +{formatScoreDelta(item.estimatedScoreImprovement)}{" "}
                          pts
                        </span>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-3">
                        <MetricTile label="Current" compact={!isPrimary}>
                          <p
                            className={cn(
                              "font-semibold tabular-nums text-foreground",
                              isPrimary ? "text-lg" : "text-base",
                            )}
                          >
                            {formatAllocation(item.currentAllocationPct) ?? "—"}
                          </p>
                          <p className="mt-0.5 text-xs tabular-nums text-muted">
                            {formatApproxUsd(item.currentValue) ?? "—"}
                          </p>
                        </MetricTile>

                        <MetricTile label="Target" compact={!isPrimary}>
                          <p
                            className={cn(
                              "font-semibold tabular-nums text-foreground",
                              isPrimary ? "text-lg" : "text-base",
                            )}
                          >
                            {formatAllocation(item.targetAllocationPct) ?? "—"}
                          </p>
                          <p className="mt-0.5 text-xs tabular-nums text-muted">
                            {formatApproxUsd(item.targetValue) ?? "—"}
                          </p>
                        </MetricTile>

                        <MetricTile
                          label={trimActionLabel(item.category)}
                          compact={!isPrimary}
                        >
                          <p
                            className={cn(
                              "truncate font-semibold tabular-nums text-foreground",
                              isPrimary ? "text-lg" : "text-base",
                            )}
                          >
                            {actionPrimary(item)}
                          </p>
                          {actionSecondary(item) ? (
                            <p className="mt-0.5 truncate text-xs text-muted">
                              {actionSecondary(item)}
                            </p>
                          ) : null}
                        </MetricTile>
                      </div>

                      <p className="text-sm text-muted">{item.why}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="border-t border-border/60 py-3 text-sm text-muted">
          No diversification suggestions available yet.
        </p>
      )}
    </section>
  );
}
