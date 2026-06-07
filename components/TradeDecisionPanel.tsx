"use client";

import { Target } from "lucide-react";
import {
  type ScoreBucket,
  type TradeAction,
  type TradeDecision,
  type TradeEnvironment,
  type TradeVerdict,
  useTradeDecision,
} from "@/app/hooks/useTradeDecision";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import {
  ResearchMetricList,
  ResearchSection,
} from "@/components/research/ResearchMemoPrimitives";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

type TradeDecisionPanelProps = {
  symbol: string | null;
  accessToken?: string | null;
  enabled?: boolean;
  compact?: boolean;
  diagnosticsOnly?: boolean;
  decisionOverride?: TradeDecision | null;
  isLoadingOverride?: boolean;
  errorOverride?: string | null;
  className?: string;
};

const READINESS_LABEL: Record<TradeVerdict, string> = {
  TRADE: "Actionable",
  WATCHLIST: "Wait for setup",
  NO_TRADE: "Not actionable",
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

function setupQualityExplanation(score: number): string {
  if (score >= 80) return "The setup quality is strong.";
  if (score >= 60)
    return "The setup quality is constructive but still needs confirmation.";
  if (score >= 40) return "The setup quality is mixed.";
  return "The setup quality is weak right now.";
}

function formatTradeEnvironment(env: TradeEnvironment): string {
  switch (env) {
    case "FAVORABLE":
      return "Supportive market";
    case "NEUTRAL":
      return "Mixed market";
    case "AVOID":
      return "Difficult market";
  }
}

function formatRegimeId(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const normalized = value.toLowerCase();
  const labels: Record<string, string> = {
    risk_on_chop: "Choppy market",
    risk_on_trend: "Risk-on trend",
    risk_off: "Risk-off market",
    neutral: "Mixed market",
  };
  return labels[normalized] ?? `Technical: ${value.replace(/_/g, " ")}`;
}

function formatDiagnosticLine(value: string): string {
  return value
    .replace(/weak breakout quality/gi, "Breakout not yet confirmed")
    .replace(/breakout quality is weak/gi, "Breakout not yet confirmed")
    .replace(/wait for setup/gi, "Wait for a cleaner trigger")
    .replace(/\bwatch\b/gi, "Watch for confirmation");
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
    <div className="border border-border bg-background/60 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className={cn("mt-0.5 text-sm font-semibold", valueClassName)}>
        {value}
      </p>
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
    <div className="space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        Reason breakdown
      </p>

      {breakdown.hardBlockers.length > 0 ? (
        <div>
          <p className="text-xs font-semibold text-danger">
            What blocks the setup
          </p>
          <ul className="mt-1 space-y-1">
            {breakdown.hardBlockers.map((line) => (
              <li
                key={line}
                className="text-sm text-foreground before:mr-2 before:text-danger before:content-['•']"
              >
                {formatDiagnosticLine(line)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {breakdown.primaryWeakness ? (
        <div>
          <p className="text-xs font-semibold text-foreground">
            Main weak spot
          </p>
          <p className="mt-1 text-sm text-foreground before:mr-2 before:text-muted before:content-['•']">
            {formatDiagnosticLine(breakdown.primaryWeakness)}
          </p>
        </div>
      ) : null}

      {breakdown.secondaryFactors.length > 0 ? (
        <div>
          <p className="text-xs font-semibold text-muted">
            Other things to watch
          </p>
          <ul className="mt-1 space-y-1">
            {breakdown.secondaryFactors.map((line) => (
              <li
                key={line}
                className="text-sm text-foreground before:mr-2 before:text-muted before:content-['•']"
              >
                {formatDiagnosticLine(line)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function ExecutionDiagnosticsContent({
  decision,
}: {
  decision: TradeDecision;
}) {
  const env = decision.regime.tradeEnvironment;
  const blockers = decision.reasonBreakdown.hardBlockers;
  const secondary = decision.reasonBreakdown.secondaryFactors;
  const hasReasonDetails =
    blockers.length > 0 ||
    !!decision.reasonBreakdown.primaryWeakness ||
    secondary.length > 0;

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-foreground">
        {setupQualityExplanation(decision.tradeQualityScore)}
      </p>
      <ResearchMetricList
        items={[
          {
            label: "Market environment",
            value: formatTradeEnvironment(env),
            note: formatRegimeId(decision.regime.regimeId),
          },
          {
            label: "Setup quality score",
            value: `${decision.tradeQualityScore} / 100`,
          },
        ]}
        columns={2}
      />

      {hasReasonDetails ? (
        <ReasonBreakdown breakdown={decision.reasonBreakdown} />
      ) : (
        <p className="text-sm text-muted">
          No major setup-quality issues were returned.
        </p>
      )}
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
      <div className="grid gap-2 md:grid-cols-[minmax(0,1.35fr)_repeat(3,minmax(0,1fr))]">
        <div className={cn("border px-3 py-2", verdictTone(decision.verdict))}>
          <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
            Is it actionable now?
          </p>
          <p className="mt-0.5 text-sm font-semibold leading-tight">
            {READINESS_LABEL[decision.verdict]}
          </p>
          <p className="mt-0.5 text-xs font-medium opacity-80">
            {ACTION_LABEL[decision.action]}
          </p>
        </div>

        <MetricCell
          label="Market environment"
          value={formatTradeEnvironment(env)}
          sub={formatRegimeId(decision.regime.regimeId)}
          valueClassName={regimeTone(env)}
        />
        <MetricCell
          label="Quality"
          value={`${decision.tradeQualityScore} / 100`}
          valueClassName={cn(
            "tabular-nums",
            scoreTone(decision.tradeQualityScore),
          )}
        />
        <MetricCell
          label="Gate"
          value={BUCKET_LABEL[decision.scoreBucket]}
          valueClassName={bucketTone(decision.scoreBucket)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCell
          label="Market environment"
          value={formatTradeEnvironment(env)}
          sub={formatRegimeId(decision.regime.regimeId)}
          valueClassName={regimeTone(env)}
        />
        <MetricCell
          label="Setup quality score"
          value={`${decision.tradeQualityScore} / 100`}
          valueClassName={cn(
            "tabular-nums",
            scoreTone(decision.tradeQualityScore),
          )}
        />
        <MetricCell
          label="Score bucket"
          value={BUCKET_LABEL[decision.scoreBucket]}
          valueClassName={bucketTone(decision.scoreBucket)}
        />
      </div>

      <div className={cn("border px-4 py-3", verdictTone(decision.verdict))}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
              Is it actionable now?
            </p>
            <p className="text-lg font-bold leading-tight">
              {READINESS_LABEL[decision.verdict]}
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
        <Skeleton className="h-14" />
        <Skeleton className="h-14" />
        <Skeleton className="h-14" />
      </div>
      <Skeleton className="h-16 w-full" />
    </div>
  );
}

export function TradeDecisionPanel({
  symbol,
  accessToken,
  enabled = true,
  compact = false,
  diagnosticsOnly = false,
  decisionOverride,
  isLoadingOverride,
  errorOverride,
  className,
}: TradeDecisionPanelProps) {
  const fetched = useTradeDecision(symbol, {
    accessToken,
    enabled: enabled && decisionOverride === undefined,
  });
  const decision =
    decisionOverride !== undefined ? decisionOverride : fetched.decision;
  const isLoading =
    isLoadingOverride !== undefined ? isLoadingOverride : fetched.isLoading;
  const error = errorOverride !== undefined ? errorOverride : fetched.error;

  if (diagnosticsOnly) {
    return (
      <ResearchSection
        title="Setup quality"
        subtitle="Why the setup quality is high or low. Technical execution details are shown below."
        className={className}
      >
        {error && !decision ? (
          <ErrorBanner message={error} />
        ) : isLoading && !decision ? (
          <DecisionSkeleton />
        ) : !decision ? (
          <p className="text-sm text-muted">Setup quality is not available.</p>
        ) : (
          <ExecutionDiagnosticsContent decision={decision} />
        )}
      </ResearchSection>
    );
  }

  return (
    <ResearchSectionCard
      title={diagnosticsOnly ? "Setup quality" : "Execution readiness"}
      description={
        diagnosticsOnly
          ? "Market environment, setup score, blockers, and secondary factors"
          : compact
            ? "Whether the current setup is actionable now"
            : "Actionability, score, gates, and execution reasoning"
      }
      icon={Target}
      className={className}
    >
      {error && !decision ? (
        <ErrorBanner message={error} />
      ) : isLoading && !decision ? (
        <DecisionSkeleton />
      ) : !decision ? (
        <p className="text-sm text-muted">
          {diagnosticsOnly
            ? "Setup quality is not available."
            : "Execution readiness is not available."}
        </p>
      ) : diagnosticsOnly ? (
        <ExecutionDiagnosticsContent decision={decision} />
      ) : (
        <PipelineContent decision={decision} compact={compact} />
      )}
    </ResearchSectionCard>
  );
}
