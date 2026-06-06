"use client";

import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { useState } from "react";
import { useTraderPlaybook } from "@/app/hooks/useTraderPlaybook";
import {
  useTradeDecision,
  type TradeAction,
} from "@/app/hooks/useTradeDecision";
import type {
  TraderPlaybookLevels,
  TraderPlaybookResponse,
  TraderPlaybookStatus,
  TradingBiasLabel,
} from "@/app/types/research";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

type TraderPlaybookCardProps = {
  symbol: string;
  accessToken?: string | null;
  enabled?: boolean;
  className?: string;
};

const DIRECTION_TONE: Record<TradingBiasLabel, string> = {
  Bullish: "border-success/35 bg-success/10 text-success",
  Neutral: "border-border bg-muted/30 text-foreground",
  Bearish: "border-danger/35 bg-danger/10 text-danger",
};

const STATUS_COPY: Record<
  TraderPlaybookStatus,
  { label: string; badge: "success" | "warning" | "danger" | "muted"; title: string }
> = {
  Valid: { label: "Setup active", badge: "success", title: "Setup active" },
  Waiting: { label: "No trigger yet", badge: "warning", title: "No trigger yet" },
  Invalid: {
    label: "Setup invalidated",
    badge: "danger",
    title: "Setup invalidated",
  },
  NoSetup: {
    label: "No clean setup",
    badge: "muted",
    title: "No clean trade plan",
  },
};

type ExecutionGate = "Ready" | "Watch" | "Avoid";
type LevelRole = "actionable" | "context" | "major" | "unavailable";

const EXECUTION_GATE_COPY: Record<
  ExecutionGate,
  {
    badge: "success" | "warning" | "danger";
    label: string;
    description: string;
  }
> = {
  Ready: {
    badge: "success",
    label: "Ready",
    description: "Execution gate supports action if the plan is valid.",
  },
  Watch: {
    badge: "warning",
    label: "Watch",
    description: "Execution gate says wait for the setup trigger.",
  },
  Avoid: {
    badge: "danger",
    label: "Avoid",
    description: "Execution gate blocks a clean actionable plan.",
  },
};

function formatMoney(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "N/A";
  return `$${value.toFixed(2)}`;
}

function formatNumber(value: number | null | undefined, suffix = ""): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "N/A";
  return `${value.toFixed(2)}${suffix}`;
}

function formatLabel(value: string): string {
  const explicitLabels: Record<string, string> = {
    BreakoutContinuation: "Breakout Continuation",
    FailedBreakout: "Failed Breakout",
    NoSetup: "No Setup",
    PullbackToSupport: "Pullback To Support",
    RangeDay: "Range Day",
    TrendContinuation: "Trend Continuation",
  };
  if (explicitLabels[value]) return explicitLabels[value];
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function executionGateFromAction(action: TradeAction | null | undefined): ExecutionGate | null {
  if (action === "ENTER") return "Ready";
  if (action === "WAIT_FOR_SETUP") return "Watch";
  if (action === "AVOID") return "Avoid";
  return null;
}

function executionGateFromPlaybook(data: TraderPlaybookResponse): ExecutionGate {
  if (data.alignment.executionReadiness === "ready") return "Ready";
  if (data.alignment.executionReadiness === "avoid") return "Avoid";
  return "Watch";
}

function displayStatusForGate(
  status: TraderPlaybookStatus,
  gate: ExecutionGate,
): TraderPlaybookStatus {
  if (gate === "Avoid") return status === "Invalid" ? "Invalid" : "NoSetup";
  if (gate === "Watch" && status === "Valid") return "Waiting";
  return status;
}

function hasTradeLevels(levels: TraderPlaybookLevels): boolean {
  return levels.entry != null && levels.stop != null;
}

function hasRiskReward(data: TraderPlaybookResponse): boolean {
  return (
    hasTradeLevels(data.levels) &&
    (data.levels.target1 != null || data.levels.target2 != null) &&
    data.risk.riskRewardLabel !== "unavailable"
  );
}

function classifyLevelDistance({
  entry,
  level,
}: {
  entry: number | null | undefined;
  level: number | null | undefined;
}): LevelRole {
  if (
    typeof entry !== "number" ||
    typeof level !== "number" ||
    !Number.isFinite(entry) ||
    !Number.isFinite(level) ||
    entry <= 0 ||
    level <= 0
  ) {
    return "unavailable";
  }
  const distance = Math.abs(entry - level) / entry;
  if (distance <= 0.08) return "actionable";
  if (distance <= 0.12) return "context";
  return "major";
}

function levelRoleLabel(role: LevelRole): string {
  switch (role) {
    case "actionable":
      return "Actionable";
    case "context":
      return "Context";
    case "major":
      return "Major";
    case "unavailable":
      return "Unavailable";
  }
}

function levelRoleClass(role: LevelRole): string {
  switch (role) {
    case "actionable":
      return "text-success";
    case "context":
      return "text-accent-highlight";
    case "major":
      return "text-muted";
    case "unavailable":
      return "text-muted";
  }
}

function TraderPlaybookSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-24 rounded-xl" />
      <div className="grid gap-3 md:grid-cols-3">
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
      </div>
      <Skeleton className="h-32 rounded-lg" />
    </div>
  );
}

function Checklist({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "valid" | "invalid";
}) {
  const Icon = tone === "valid" ? CheckCircle2 : ShieldAlert;
  const iconClass = tone === "valid" ? "text-success" : "text-danger";

  return (
    <div className="rounded-lg border border-border bg-background/55 px-3 py-3">
      <div className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", iconClass)} aria-hidden="true" />
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
          {title}
        </p>
      </div>
      {items.length ? (
        <ul className="mt-2 space-y-1.5">
          {items.map((item) => (
            <li
              key={item}
              className="flex gap-2 text-sm leading-snug text-foreground"
            >
              <span
                className={cn(
                  "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                  tone === "valid" ? "bg-success" : "bg-danger",
                )}
                aria-hidden="true"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted">No condition available.</p>
      )}
    </div>
  );
}

function LevelsGrid({ levels }: { levels: TraderPlaybookLevels }) {
  const rows = [
    ["Entry", levels.entry, "Actionable trigger"],
    ["Stop", levels.stop, levels.stop == null ? "No actionable stop" : "Actionable risk"],
    [
      "Target 1",
      levels.target1,
      levels.target1 == null ? "No actionable target" : "Actionable target",
    ],
    [
      "Target 2",
      levels.target2,
      levels.target2 == null ? "Not forced" : "Secondary target",
    ],
  ] as const;

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {rows.map(([label, value, role]) => (
        <div
          key={label}
          className="rounded-lg border border-border bg-muted/15 px-3 py-2"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            {label}
          </p>
          <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">
            {formatMoney(value)}
          </p>
          <p className="mt-0.5 text-xs text-muted">{role}</p>
        </div>
      ))}
    </div>
  );
}

function SupportResistanceHierarchy({
  levels,
}: {
  levels: TraderPlaybookLevels;
}) {
  const rows = [
    [
      "Support",
      levels.support,
      classifyLevelDistance({ entry: levels.entry, level: levels.support }),
    ],
    [
      "Resistance",
      levels.resistance,
      classifyLevelDistance({ entry: levels.entry, level: levels.resistance }),
    ],
  ] as const;

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {rows.map(([label, value, role]) => (
        <div
          key={label}
          className="rounded-lg border border-border bg-background/55 px-3 py-2"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              {label}
            </p>
            <p
              className={cn(
                "text-[10px] font-semibold uppercase tracking-wide",
                levelRoleClass(role),
              )}
            >
              {levelRoleLabel(role)}
            </p>
          </div>
          <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">
            {formatMoney(value)}
          </p>
        </div>
      ))}
    </div>
  );
}

function RiskGrid({ data }: { data: TraderPlaybookResponse }) {
  const rows = [
    ["Risk/share", formatMoney(data.risk.riskPerShare)],
    ["R target 1", formatNumber(data.risk.rMultipleTarget1, "R")],
    ["R target 2", formatNumber(data.risk.rMultipleTarget2, "R")],
    ["Risk/reward", formatLabel(data.risk.riskRewardLabel)],
  ] as const;

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="rounded-lg border border-border bg-background/55 px-3 py-2"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            {label}
          </p>
          <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
        </div>
      ))}
    </div>
  );
}

function NoSetupSummary({ data }: { data: TraderPlaybookResponse }) {
  const explanation =
    data.warnings[0] ??
    data.conditions.invalidIf[0] ??
    "No actionable entry, stop, and target are available from current daily levels.";

  return (
    <div className="rounded-lg border border-border bg-muted/20 px-3 py-3">
      <p className="text-sm font-semibold text-foreground">
        No clean setup available.
      </p>
      <p className="mt-1 text-sm leading-relaxed text-muted">{explanation}</p>
    </div>
  );
}

function WaitingSummary({ data }: { data: TraderPlaybookResponse }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Checklist
        title="Trigger"
        items={data.conditions.validIf}
        tone="valid"
      />
      <Checklist
        title="Invalidation"
        items={data.conditions.invalidIf}
        tone="invalid"
      />
    </div>
  );
}

function MessageList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "warning" | "muted";
}) {
  if (!items.length) return null;
  return (
    <div
      className={cn(
        "flex gap-2 rounded-lg border px-3 py-3",
        tone === "warning"
          ? "border-warning/25 bg-warning-muted"
          : "border-border bg-muted/20",
      )}
    >
      <AlertTriangle
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          tone === "warning" ? "text-warning" : "text-muted",
        )}
        aria-hidden="true"
      />
      <div>
        <p
          className={cn(
            "text-[10px] font-semibold uppercase tracking-wide",
            tone === "warning" ? "text-warning" : "text-muted",
          )}
        >
          {title}
        </p>
        <ul className="mt-1 space-y-1 text-sm leading-relaxed text-foreground">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ReasonsList({ reasons }: { reasons: string[] }) {
  if (!reasons.length) return null;
  return (
    <div className="rounded-lg border border-border bg-background/55 px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        Top reasons
      </p>
      <ul className="mt-2 space-y-1.5">
        {reasons.slice(0, 4).map((reason) => (
          <li
            key={reason}
            className="flex gap-2 text-sm leading-snug text-foreground"
          >
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
              aria-hidden="true"
            />
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExecutionGatePanel({
  gate,
  loading,
}: {
  gate: ExecutionGate;
  loading: boolean;
}) {
  const copy = EXECUTION_GATE_COPY[gate];

  return (
    <div className="rounded-lg border border-border bg-background/55 px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-muted" aria-hidden="true" />
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Execution gate
          </p>
        </div>
        {loading ? (
          <Badge variant="muted">Checking</Badge>
        ) : (
          <Badge variant={copy.badge}>{copy.label}</Badge>
        )}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground">
        {loading ? "Checking actionability score and regime gate." : copy.description}
      </p>
    </div>
  );
}

function TraderPlaybookContent({
  data,
  executionGate,
  executionLoading,
}: {
  data: TraderPlaybookResponse;
  executionGate: ExecutionGate;
  executionLoading: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const displayStatus = displayStatusForGate(data.status, executionGate);
  const status = STATUS_COPY[displayStatus];
  const headerTone =
    displayStatus === "NoSetup" ? "border-border bg-muted/30 text-foreground" : DIRECTION_TONE[data.direction];
  const showTradeLevels = displayStatus !== "NoSetup" && hasTradeLevels(data.levels);
  const showRiskReward = displayStatus !== "NoSetup" && hasRiskReward(data);
  const showSrHierarchy = displayStatus !== "NoSetup" && showTradeLevels;

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "rounded-xl border px-4 py-4",
          headerTone,
        )}
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
              Conditional daily trade plan
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <p className="text-2xl font-bold leading-tight">
                {status.title}
              </p>
              <Badge variant={status.badge}>{status.label}</Badge>
              <Badge variant="muted">Daily bias: {data.direction}</Badge>
              <Badge variant="muted">{data.confidence} confidence</Badge>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed opacity-85">
              This is not a buy/sell command. It shows the conditions that
              would make the setup valid or invalid.
            </p>
          </div>

          <div className="grid min-w-[240px] gap-2 sm:grid-cols-2 lg:text-right">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide opacity-75">
                Best setup
              </p>
              <p className="text-sm font-semibold">
                {formatLabel(data.bestSetup)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide opacity-75">
                Horizon
              </p>
              <p className="text-sm font-semibold">{data.horizon}</p>
            </div>
          </div>
        </div>
      </div>

      {displayStatus === "NoSetup" ? (
        <NoSetupSummary data={data} />
      ) : displayStatus === "Waiting" ? (
        <WaitingSummary data={data} />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          <Checklist
            title="Valid if"
            items={data.conditions.validIf}
            tone="valid"
          />
          <Checklist
            title="Invalid if"
            items={data.conditions.invalidIf}
            tone="invalid"
          />
        </div>
      )}

      {showTradeLevels ? <LevelsGrid levels={data.levels} /> : null}
      {showRiskReward ? <RiskGrid data={data} /> : null}
      <ExecutionGatePanel gate={executionGate} loading={executionLoading} />
      {showSrHierarchy ? <SupportResistanceHierarchy levels={data.levels} /> : null}

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="muted">Data mode: {formatLabel(data.dataMode)}</Badge>
        <Badge variant="muted">
          Execution gate: {executionGate}
        </Badge>
        <Badge variant="muted">
          Market: {formatLabel(data.alignment.marketRegime)}
        </Badge>
        <Badge variant="muted">
          Price structure: {formatLabel(data.alignment.priceStructure)}
        </Badge>
      </div>

      {expanded ? (
        <div className="space-y-3">
          <ReasonsList reasons={data.reasons} />
          <MessageList title="Warnings" items={data.warnings} tone="warning" />
          <MessageList title="Data gaps" items={data.dataGaps} tone="muted" />
        </div>
      ) : null}

      <Button
        type="button"
        size="xs"
        variant="ghost"
        onClick={() => setExpanded((value) => !value)}
        className="px-0"
      >
        {expanded ? "Hide details" : "Show reasons, warnings, and data gaps"}
      </Button>
    </div>
  );
}

export function TraderPlaybookCard({
  symbol,
  accessToken,
  enabled = true,
  className,
}: TraderPlaybookCardProps) {
  const { traderPlaybook, isLoading, error } = useTraderPlaybook(
    symbol,
    accessToken ?? undefined,
    {
      enabled,
    },
  );
  const { decision, isLoading: decisionLoading } = useTradeDecision(symbol, {
    accessToken,
    enabled,
  });
  const executionGate = decision
    ? executionGateFromAction(decision.action)
    : traderPlaybook
      ? executionGateFromPlaybook(traderPlaybook)
      : null;

  return (
    <ResearchSectionCard
      title="Trader Playbook"
      description="Conditional daily trade plan"
      icon={ClipboardCheck}
      className={className}
    >
      {error && !traderPlaybook ? (
        <ErrorBanner message={error} />
      ) : isLoading && !traderPlaybook ? (
        <TraderPlaybookSkeleton />
      ) : !traderPlaybook ? (
        <p className="text-sm text-muted">Trader playbook is not available.</p>
      ) : (
        <TraderPlaybookContent
          data={traderPlaybook}
          executionGate={executionGate ?? executionGateFromPlaybook(traderPlaybook)}
          executionLoading={decisionLoading && !decision}
        />
      )}
    </ResearchSectionCard>
  );
}
