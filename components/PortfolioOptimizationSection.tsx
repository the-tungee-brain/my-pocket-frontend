"use client";

import Link from "next/link";
import type { SectorWeight } from "@/app/types/intelligence";
import type {
  PortfolioOptimizationBreakdown,
  PortfolioOptimizationBreakdownItem,
  PortfolioOptimizationResponse,
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
            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {optimization.diversificationScore} / 100
              <span className="ml-2 text-lg font-medium text-muted">
                · {optimization.rating}
              </span>
            </p>
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
  const currentScore = optimization?.diversificationScore ?? 0;
  const suggestions = optimization?.rankedSuggestions.slice(0, 3) ?? [];

  return (
    <section className={cn(sectionClass, className)}>
      <div>
        <h2 className={titleClass}>Optimization suggestions</h2>
        <p className="mt-1 text-sm text-muted">
          Highest-impact changes ranked by estimated score improvement.
        </p>
      </div>
      {suggestions.length ? (
        <div className="divide-y divide-border/60 border-t border-border/60">
          {suggestions.map((item) => (
            <div
              key={`${item.rank}-${item.category}-${item.title}`}
              className="grid gap-2 py-3 sm:grid-cols-[3rem_minmax(0,1fr)_8rem]"
            >
              <p className="text-sm text-muted">{item.rank}.</p>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {item.title}
                </p>
                <p className="mt-1 text-sm text-muted">{item.why}</p>
                <p className="mt-1 text-sm text-muted">{item.action}</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-sm font-medium tabular-nums text-foreground">
                  {currentScore} →{" "}
                  {Math.min(
                    100,
                    Math.round(currentScore + item.estimatedScoreImprovement),
                  )}
                </p>
                <p className="mt-0.5 text-[11px] text-muted">
                  +{item.estimatedScoreImprovement.toFixed(1)} pts
                </p>
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
