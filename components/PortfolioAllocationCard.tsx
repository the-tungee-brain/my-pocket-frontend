"use client";

import { ArrowDown, PiggyBank, Scissors, TrendingUp } from "lucide-react";
import type {
  HoldingAllocationReview,
  PortfolioAnalysisPrecomputed,
} from "@/app/types/portfolioAnalysis";
import { formatUsd } from "@/lib/formatCurrency";
import { cn } from "@/lib/utils";

function statusTone(status: string): string {
  if (status.startsWith("CRITICAL") || status.startsWith("HIGH")) {
    return "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400";
  }
  if (status.startsWith("ELEVATED") || status.startsWith("ABOVE")) {
    return "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300";
  }
  if (status.includes("UNDERWEIGHT")) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
  }
  if (status.includes("OVERWEIGHT")) {
    return "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300";
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
    <div className="rounded-lg border border-border/80 bg-background/50 px-2.5 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-sm font-semibold tabular-nums",
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
  return (
    <div className="rounded-lg border border-border/70 bg-background/40 px-2.5 py-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-foreground">{holding.symbol}</p>
          <p className="text-xs text-muted">
            {holding.weightPct.toFixed(1)}% ·{" "}
            {formatUsd(holding.marketValue, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium",
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
        Precomputed from your Schwab cash, CSP reserves, and position weights —
        how much you can deploy and where concentration risk sits.
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
  const { concentration: c, cashMap, holdings, trimPlan, deployPlan } =
    precomputed;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <MetricChip
          label="Deployable cash"
          value={formatUsd(cashMap.deployableCash, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
          accent="positive"
        />
        <MetricChip
          label="Total to redeploy"
          value={formatUsd(cashMap.totalToRedeploy, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
          accent="positive"
        />
        <MetricChip
          label="Top holding"
          value={`${c.top1Pct.toFixed(1)}%`}
        />
        <MetricChip
          label="Max single name"
          value={`${c.singleNameLimitPct.toFixed(0)}%`}
        />
      </div>

      <div className="rounded-xl border border-border/80 bg-background/30 px-3 py-3">
        <div className="mb-2 flex items-center gap-2">
          <PiggyBank className="h-4 w-4 text-accent-strong" aria-hidden />
          <p className="text-sm font-semibold text-foreground">Cash map</p>
        </div>
        <div className="space-y-1.5">
          {cashMap.steps.map((step, index) => {
            const isHighlight = step.step === 5 || step.step === 7;
            const amount = step.amount ?? 0;
            return (
              <div key={step.step}>
                <div
                  className={cn(
                    "flex items-baseline justify-between gap-3 rounded-lg px-2 py-1.5 text-xs",
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
                {index < cashMap.steps.length - 1 && (
                  <div className="flex justify-center py-0.5 text-muted" aria-hidden>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </div>
                )}
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
        <div className="grid gap-3 lg:grid-cols-2">
          {trimPlan.length > 0 && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-3">
              <div className="mb-2 flex items-center gap-2">
                <Scissors className="h-4 w-4 text-red-600 dark:text-red-400" aria-hidden />
                <p className="text-sm font-semibold text-foreground">Trim first</p>
              </div>
              <ul className="space-y-2 text-xs">
                {trimPlan.map((item) => (
                  <li
                    key={item.symbol}
                    className="rounded-lg border border-border/60 bg-background/50 px-2.5 py-2"
                  >
                    <p className="font-medium text-foreground">{item.symbol}</p>
                    <p className="text-muted">
                      {item.currentWeightPct.toFixed(1)}% → ~{item.targetWeightPct.toFixed(0)}%
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
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-3">
              <div className="mb-2 flex items-center gap-2">
                <TrendingUp
                  className="h-4 w-4 text-emerald-600 dark:text-emerald-400"
                  aria-hidden
                />
                <p className="text-sm font-semibold text-foreground">Deploy plan</p>
              </div>
              <ul className="space-y-2 text-xs">
                {deployPlan.map((item) => (
                  <li
                    key={item.symbol}
                    className="rounded-lg border border-border/60 bg-background/50 px-2.5 py-2"
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
