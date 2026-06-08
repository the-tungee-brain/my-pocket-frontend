"use client";

import { ArrowDown, PiggyBank, Scissors, TrendingUp } from "lucide-react";
import type {
  HoldingAllocationReview,
  PortfolioAnalysisPrecomputed,
} from "@/app/types/portfolioAnalysis";
import { formatUsd } from "@/lib/formatCurrency";
import { cn } from "@/lib/utils";

function statusTone(status: string): string {
  if (status.startsWith("Too large") || status.startsWith("Very large")) {
    return "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400";
  }
  if (
    status.startsWith("Large") ||
    status.startsWith("Above your") ||
    status.startsWith("Above ETF")
  ) {
    return "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300";
  }
  if (status.startsWith("Below ETF") || status.startsWith("Small position")) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
  }
  return "border-border/80 bg-background/60 text-muted";
}

function MetricChip({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "positive" | "neutral";
}) {
  return (
    <div className="flex h-full min-h-[4.75rem] flex-col border border-border/80 bg-background/50 px-3 py-2.5">
      <p className="min-h-8 text-[10px] font-medium uppercase leading-snug tracking-wide text-muted">
        {label}
      </p>
      <p
        className={cn(
          "mt-auto text-base font-semibold tabular-nums",
          accent === "positive"
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function HoldingRow({ holding }: { holding: HoldingAllocationReview }) {
  const cspReserved = holding.cspReservedCash ?? 0;
  const spendingWeight = holding.spendingWeightPct ?? holding.weightPct;
  const portfolioSpending = holding.portfolioSpending ?? holding.marketValue;
  const showSpending = cspReserved > 0;

  return (
    <div className="border border-border/70 bg-background/40 px-2.5 py-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-foreground">{holding.symbol}</p>
          <p className="text-xs text-muted">
            {showSpending ? (
              <>
                {spendingWeight.toFixed(1)}% portfolio ·{" "}
                {formatUsd(portfolioSpending, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </>
            ) : (
              <>
                {holding.weightPct.toFixed(1)}% portfolio ·{" "}
                {formatUsd(holding.marketValue, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </>
            )}
          </p>
          {showSpending ? (
            <p className="mt-0.5 text-[10px] text-muted">
              {formatUsd(holding.marketValue, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}{" "}
              stock +{" "}
              {formatUsd(cspReserved, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}{" "}
              CSP reserve
              {holding.weightPct > 0
                ? ` (${holding.weightPct.toFixed(1)}% shares)`
                : null}
            </p>
          ) : null}
        </div>
        <span
          className={cn(
            "shrink-0 border px-2 py-0.5 text-[10px] font-medium",
            statusTone(holding.status),
          )}
        >
          {holding.status}
        </span>
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
        {holding.actionSummary}
      </p>
    </div>
  );
}

export function PortfolioAllocationIntro() {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
        Your money map
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        Where your cash is, how much you can invest, and whether any single
        stock takes up too much of your portfolio.
      </p>
    </div>
  );
}

export function PortfolioAllocationCard({
  precomputed,
  className,
}: {
  precomputed: PortfolioAnalysisPrecomputed;
  className?: string;
}) {
  const {
    concentration: c,
    cashMap,
    holdings,
    trimPlan,
    deployPlan,
  } = precomputed;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid auto-rows-fr grid-cols-1 gap-2 lg:grid-cols-4">
        <MetricChip
          label="Cash to invest"
          value={formatUsd(cashMap.deployableCash, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
          accent="positive"
        />
        <MetricChip
          label="Total if you trim + invest"
          value={formatUsd(cashMap.totalToRedeploy, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
          accent="positive"
        />
        <MetricChip
          label="Biggest holding"
          value={`${c.top1Pct.toFixed(1)}%`}
        />
        <MetricChip
          label="Max per stock"
          value={`${c.singleNameLimitPct.toFixed(0)}%`}
        />
      </div>

      <div className="border border-border/80 bg-background/30 px-3 py-3">
        <div className="mb-2 flex items-center gap-2">
          <PiggyBank className="h-4 w-4 text-accent-strong" aria-hidden />
          <p className="text-sm font-semibold text-foreground">Cash map</p>
        </div>
        <div>
          {cashMap.steps.map((step, index) => {
            const isHighlight = step.step === 5 || step.step === 7;
            const amount = step.amount ?? 0;
            const isLast = index === cashMap.steps.length - 1;

            return (
              <div key={step.step}>
                <div
                  className={cn(
                    "flex items-center justify-between gap-3 px-2 py-1.5 text-xs",
                    isHighlight && "border border-accent/20 bg-accent-muted/10",
                  )}
                >
                  <span className="text-muted">
                    {step.step}. {step.label}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 tabular-nums font-semibold",
                      step.isSubtraction
                        ? "text-foreground"
                        : isHighlight
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-foreground",
                    )}
                  >
                    {step.isSubtraction ? "−" : ""}
                    {formatUsd(Math.abs(amount), {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </span>
                </div>
                {!isLast ? (
                  <div
                    className="flex h-6 items-center justify-center text-muted/80"
                    aria-hidden
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {holdings.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">
            Holdings review
          </p>
          <div className="grid gap-2 lg:grid-cols-2">
            {holdings.map((holding) => (
              <HoldingRow key={holding.symbol} holding={holding} />
            ))}
          </div>
        </div>
      )}

      {(trimPlan.length > 0 || deployPlan.length > 0) && (
        <div className="space-y-3">
          {trimPlan.length > 0 && (
            <div className="w-full border border-red-500/20 bg-red-500/5 px-3 py-3">
              <div className="mb-2 flex items-center gap-2">
                <Scissors
                  className="h-4 w-4 text-red-600 dark:text-red-400"
                  aria-hidden
                />
                <p className="text-sm font-semibold text-foreground">
                  Trim oversized positions
                </p>
              </div>
              <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2 text-xs">
                {trimPlan.map((item) => (
                  <li
                    key={item.symbol}
                    className="min-w-0 border border-border/60 bg-background/50 px-2.5 py-2"
                  >
                    <p className="font-medium text-foreground">{item.symbol}</p>
                    <p className="text-muted">
                      {item.currentWeightPct.toFixed(1)}% → ~
                      {item.targetWeightPct.toFixed(0)}%
                    </p>
                    <p className="mt-0.5 font-semibold tabular-nums text-foreground">
                      Trim{" "}
                      {formatUsd(item.trimDollars, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {deployPlan.length > 0 && (
            <div className="w-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-3">
              <div className="mb-2 flex items-center gap-2">
                <TrendingUp
                  className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                  aria-hidden
                />
                <p className="text-sm font-semibold text-foreground">
                  Where to invest next
                </p>
              </div>
              <ul className="grid grid-cols-1 gap-2 lg:grid-cols-2 text-xs">
                {deployPlan.map((item) => (
                  <li
                    key={item.symbol}
                    className="min-w-0 border border-border/60 bg-background/50 px-2.5 py-2"
                  >
                    <p className="font-medium text-foreground">{item.symbol}</p>
                    <p className="font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                      {formatUsd(item.deployDollars, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      })}
                    </p>
                    {item.note && (
                      <p className="mt-0.5 text-muted">{item.note}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
