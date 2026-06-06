"use client";

import { Target } from "lucide-react";
import {
  useTradeDecision,
  type ScoreBucket,
  type TradeAction,
  type TradeDecision,
  type TradeEnvironment,
  type TradeVerdict,
} from "@/app/hooks/useTradeDecision";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

type TradeDecisionPanelProps = {
  symbol: string | null;
  accessToken?: string | null;
  enabled?: boolean;
  compact?: boolean;
  className?: string;
};

const VERDICT_LABEL: Record<TradeVerdict, string> = {
  TRADE: "Trade",
  WATCHLIST: "Watchlist",
  NO_TRADE: "No trade",
};

const BUCKET_LABEL: Record<ScoreBucket, string> = {
  TRADE: "Trade",
  SETUP: "Setup",
  WATCHLIST: "Watchlist",
  NO_TRADE: "No trade",
};

const ACTION_LABEL: Record<TradeAction, string> = {
  ENTER: "Enter",
  WAIT_FOR_SETUP: "Wait for setup",
  AVOID: "Avoid",
};

function verdictTone(verdict: TradeVerdict): string {
  switch (verdict) {
    case "TRADE":
      return "border-success/40 bg-success/10 text-success";
    case "WATCHLIST":
      return "border-border bg-muted/30 text-foreground";
    case "NO_TRADE":
      return "border-danger/40 bg-danger/10 text-danger";
  }
}

function bucketTone(bucket: ScoreBucket): string {
  switch (bucket) {
    case "TRADE":
      return "text-success";
    case "SETUP":
      return "text-accent-highlight";
    case "WATCHLIST":
      return "text-foreground";
    case "NO_TRADE":
      return "text-danger";
  }
}

function regimeTone(env: TradeEnvironment): string {
  switch (env) {
    case "FAVORABLE":
      return "text-success";
    case "NEUTRAL":
      return "text-foreground";
    case "AVOID":
      return "text-danger";
  }
}

function scoreTone(score: number): string {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-accent-highlight";
  if (score >= 40) return "text-foreground";
  return "text-danger";
}

function MetricCell({
  label,
  value,
  sub,
  valueClassName,
}: {
  label: string;
  value: string;
  sub?: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/60 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className={cn("mt-0.5 text-sm font-semibold", valueClassName)}>{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-muted">{sub}</p> : null}
    </div>
  );
}

function ReasonBreakdown({
  breakdown,
}: {
  breakdown: TradeDecision["reasonBreakdown"];
}) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/20 px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        Reason breakdown
      </p>

      {breakdown.hardBlockers.length > 0 ? (
        <div>
          <p className="text-xs font-semibold text-danger">Hard blockers</p>
          <ul className="mt-1 space-y-1">
            {breakdown.hardBlockers.map((line) => (
              <li
                key={line}
                className="text-sm text-foreground before:mr-2 before:text-danger before:content-['•']"
              >
                {line}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {breakdown.primaryWeakness ? (
        <div>
          <p className="text-xs font-semibold text-foreground">Primary weakness</p>
          <p className="mt-1 text-sm text-foreground before:mr-2 before:text-muted before:content-['•']">
            {breakdown.primaryWeakness}
          </p>
        </div>
      ) : null}

      {breakdown.secondaryFactors.length > 0 ? (
        <div>
          <p className="text-xs font-semibold text-muted">Secondary factors</p>
          <ul className="mt-1 space-y-1">
            {breakdown.secondaryFactors.map((line) => (
              <li
                key={line}
                className="text-sm text-foreground before:mr-2 before:text-muted before:content-['•']"
              >
                {line}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function PipelineContent({
  decision,
  compact = false,
}: {
  decision: TradeDecision;
  compact?: boolean;
}) {
  const env = decision.regime.tradeEnvironment;

  if (compact) {
    return (
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]">
        <div
          className={cn(
            "rounded-xl border px-4 py-3",
            verdictTone(decision.verdict),
          )}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
            Decision
          </p>
          <p className="mt-1 text-xl font-bold leading-tight">
            {VERDICT_LABEL[decision.verdict]}
          </p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide opacity-80">
            {ACTION_LABEL[decision.action]}
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <MetricCell
            label="Regime"
            value={env}
            sub={decision.regime.regimeId ?? undefined}
            valueClassName={regimeTone(env)}
          />
          <MetricCell
            label="Quality"
            value={`${decision.tradeQualityScore} / 100`}
            valueClassName={cn("tabular-nums", scoreTone(decision.tradeQualityScore))}
          />
          <MetricCell
            label="Bucket"
            value={BUCKET_LABEL[decision.scoreBucket]}
            valueClassName={bucketTone(decision.scoreBucket)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCell
          label="Regime"
          value={env}
          sub={decision.regime.regimeId ?? undefined}
          valueClassName={regimeTone(env)}
        />
        <MetricCell
          label="Trade quality score"
          value={`${decision.tradeQualityScore} / 100`}
          valueClassName={cn("tabular-nums", scoreTone(decision.tradeQualityScore))}
        />
        <MetricCell
          label="Score bucket"
          value={BUCKET_LABEL[decision.scoreBucket]}
          valueClassName={bucketTone(decision.scoreBucket)}
        />
      </div>

      <div
        className={cn(
          "rounded-xl border px-4 py-3",
          verdictTone(decision.verdict),
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
              Final verdict
            </p>
            <p className="text-lg font-bold leading-tight">
              {VERDICT_LABEL[decision.verdict]}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
              Action
            </p>
            <p className="text-sm font-bold uppercase tracking-wide">
              {ACTION_LABEL[decision.action]}
            </p>
          </div>
        </div>
      </div>

      <ReasonBreakdown breakdown={decision.reasonBreakdown} />
    </div>
  );
}

function DecisionSkeleton() {
  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <Skeleton className="h-14 rounded-lg" />
        <Skeleton className="h-14 rounded-lg" />
        <Skeleton className="h-14 rounded-lg" />
      </div>
      <Skeleton className="h-16 w-full rounded-xl" />
    </div>
  );
}

export function TradeDecisionPanel({
  symbol,
  accessToken,
  enabled = true,
  compact = false,
  className,
}: TradeDecisionPanelProps) {
  const { decision, isLoading, error } = useTradeDecision(symbol, {
    accessToken,
    enabled,
  });

  return (
    <ResearchSectionCard
      title="Trade decision"
      description={
        compact
          ? "Execution readiness and key gates"
          : "Execution readiness, score, bucket, and reasoning"
      }
      icon={Target}
      className={className}
    >
      {error && !decision ? (
        <ErrorBanner message={error} />
      ) : isLoading && !decision ? (
        <DecisionSkeleton />
      ) : !decision ? (
        <p className="text-sm text-muted">Trade decision is not available.</p>
      ) : (
        <PipelineContent decision={decision} compact={compact} />
      )}
    </ResearchSectionCard>
  );
}
