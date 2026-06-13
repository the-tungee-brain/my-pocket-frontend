"use client";

import {
  ArrowDown,
  ArrowUp,
  Circle,
  CircleCheck,
  CircleDot,
} from "lucide-react";
import type { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useFundamentals } from "@/app/hooks/useFundamentals";
import { useIntradayTradingBias } from "@/app/hooks/useIntradayTradingBias";
import { useStreetAnalysis } from "@/app/hooks/useStreetAnalysis";
import { useTradeReplay } from "@/app/hooks/useTradeReplay";
import { useTraderPlaybook } from "@/app/hooks/useTraderPlaybook";
import type {
  IntradayTradingBiasResponse,
  TraderPlaybookResponse,
  TraderPlaybookSide,
  TraderPlaybookStatus,
  TradingBiasConfidence,
} from "@/app/types/research";
import type { TradeReplayEvent } from "@/app/types/tradeReplay";
import {
  ResearchRow,
  ResearchSection,
  researchMemo,
} from "@/components/research/ResearchMemoPrimitives";
import { SessionReplaySection } from "@/components/research/SessionReplaySection";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { appStackClass } from "@/lib/appUi";
import { pageSectionClass } from "@/lib/pageLayout";
import { hasStreetAnalysis } from "@/lib/streetAnalysisUtils";
import { cn } from "@/lib/utils";
import { EtfFundsOverview } from "./EtfFundsOverview";
import { useResearchAssetTypeContext } from "./ResearchAssetTypeContext";
import { useResearchSymbolHeader } from "./ResearchSymbolHeaderContext";

type Props = {
  symbol: string;
};

function SectionSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      <Skeleton className="h-4 w-56" />
      <Skeleton className="h-4 w-full max-w-3xl" />
      <Skeleton className="h-4 w-full max-w-2xl" />
    </div>
  );
}

function listText(items: string[] | undefined, fallback: string): string {
  const visible = (items ?? []).map((item) => item.trim()).filter(Boolean);
  return visible.length ? visible.slice(0, 2).join(" · ") : fallback;
}

export function LongTermResearchPageContent({ symbol }: Props) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const { isEtf } = useResearchAssetTypeContext();
  const { fundamentals, isLoading, error } = useFundamentals(symbol, {
    accessToken,
    includeAiOverview: false,
    includeStreetAnalysis: !isEtf,
  });
  const {
    street,
    isLoading: streetLoading,
    error: streetError,
  } = useStreetAnalysis(symbol, {
    accessToken,
    enabled: !isEtf,
  });

  if (isEtf) {
    return <EtfFundsOverview symbol={symbol} className={pageSectionClass} />;
  }

  const overview = fundamentals?.overview;
  const thesis = overview?.investmentThesis;
  const strength = fundamentals?.strength;
  const streetTargets = street?.priceTargets;

  return (
    <div className={appStackClass}>
      {error ? <ErrorBanner message={error} /> : null}

      <ResearchSection
        title="Long-Term Thesis"
        subtitle="Business quality, growth, valuation, competitive position, and durable risks."
        className={pageSectionClass}
      >
        {isLoading && !fundamentals ? (
          <SectionSkeleton />
        ) : (
          <div className="divide-y divide-border/60">
            <ResearchRow
              label="Verdict"
              status={
                strength?.financialVerdict ??
                strength?.rating ??
                "Long-term thesis review"
              }
              body={strength?.scoreExplanation ?? overview?.valuationConclusion}
            />
            <ResearchRow
              label="Bull case"
              status={listText(
                thesis?.bullCase,
                "Bull case is not available yet.",
              )}
            />
            <ResearchRow
              label="Bear case"
              status={listText(
                thesis?.bearCase,
                "Risk case is not available yet.",
              )}
            />
          </div>
        )}
      </ResearchSection>

      <ResearchSection
        title="Valuation / Analysts"
        className={pageSectionClass}
      >
        {streetError ? <ErrorBanner message={streetError} /> : null}
        {streetLoading && !street ? (
          <SectionSkeleton />
        ) : (
          <div className="divide-y divide-border/60">
            <ResearchRow
              label="Valuation"
              status={overview?.valuationConclusion ?? "Unavailable"}
              body={overview?.valuationSummary}
            />
            <ResearchRow
              label="Analyst view"
              status={
                hasStreetAnalysis(street)
                  ? (street.consensusLabel ?? "Analyst context available")
                  : "Unavailable"
              }
              body={
                streetTargets?.mean != null
                  ? `Mean target $${streetTargets.mean.toFixed(2)}.`
                  : "Street target context is not available."
              }
            />
            <ResearchRow
              label="Risks"
              status={listText(
                strength?.risks,
                "Risk list is not available yet.",
              )}
            />
          </div>
        )}
      </ResearchSection>
    </div>
  );
}

type SwingTradeLevel = {
  label: string;
  value: number | null;
  reason: string;
};

type SwingTradePlan = {
  verdict: string;
  confidence: TradingBiasConfidence;
  status: string;
  side: Exclude<TraderPlaybookSide, "NoTrade"> | "NoTrade";
  expectedHold: string;
  entry: SwingTradeLevel;
  stop: SwingTradeLevel;
  target: SwingTradeLevel;
  rMultiple: number | null;
  riskPerShare: number | null;
  rewardPerShare: number | null;
  validation: Array<{
    label: string;
    value: string;
    tone?: "positive" | "negative" | "muted";
  }>;
  conditions: string[];
  warnings: string[];
};

type SwingLifecycleStatus = "Waiting" | "Active" | "Extended" | "Invalidated";

type SwingLifecycle = {
  status: SwingLifecycleStatus;
  canEnterNow: string;
  currentPrice: number | null;
  distanceFromTriggerPct: number | null;
  remainingRewardPct: number | null;
  currentRMultiple: number | null;
  currentRiskPerShare: number | null;
  currentRewardPerShare: number | null;
};

function statusLabel(status: TraderPlaybookStatus): string {
  switch (status) {
    case "Valid":
      return "Setup active";
    case "Waiting":
      return "Waiting for trigger";
    case "Invalid":
      return "Setup invalidated";
    case "NoSetup":
      return "No clean setup";
  }
}

function setupLabel(value: string): string {
  const labels: Record<string, string> = {
    BreakoutContinuation: "Breakout continuation",
    FailedBreakout: "Failed breakout",
    NoSetup: "No setup",
    PullbackToSupport: "Pullback to support",
    RangeDay: "Range setup",
    TrendContinuation: "Trend continuation",
  };
  return labels[value] ?? readableLabel(value);
}

function alignmentLabel(value: string): string {
  if (value === "aligned") return "Aligned";
  if (value === "mixed") return "Mixed";
  if (value === "against") return "Against";
  if (value === "unavailable") return "Unavailable";
  return readableLabel(value);
}

function alignmentTone(
  value: string,
): "positive" | "negative" | "muted" | undefined {
  if (value === "aligned" || value === "confirmed") return "positive";
  if (value === "against" || value === "avoid" || value === "poor") {
    return "negative";
  }
  if (value === "mixed" || value === "unavailable") return "muted";
  return undefined;
}

function sideFromPlaybook(
  data: TraderPlaybookResponse,
): SwingTradePlan["side"] {
  if (data.side) return data.side;
  if (data.status === "NoSetup" || data.bestSetup === "None") return "NoTrade";
  return data.direction === "Bearish" ? "Short" : "Long";
}

function deriveFallbackEntry(
  data: TraderPlaybookResponse,
  side: SwingTradePlan["side"],
): number | null {
  if (data.levels.entry != null) return data.levels.entry;
  if (data.levels.breakoutLevel != null) return data.levels.breakoutLevel;
  if (side === "Long" && data.levels.resistance != null) {
    return Number((data.levels.resistance + 0.01).toFixed(2));
  }
  if (side === "Short" && data.levels.support != null) {
    return Number((data.levels.support - 0.01).toFixed(2));
  }
  return null;
}

function deriveFallbackStop(
  data: TraderPlaybookResponse,
  side: SwingTradePlan["side"],
): number | null {
  if (data.levels.stop != null) return data.levels.stop;
  if (side === "Long") return data.levels.support;
  if (side === "Short") return data.levels.resistance;
  return null;
}

function deriveFallbackTarget(
  data: TraderPlaybookResponse,
  side: SwingTradePlan["side"],
  entry: number | null,
  stop: number | null,
): number | null {
  if (data.levels.target1 != null) return data.levels.target1;
  if (data.levels.target2 != null) return data.levels.target2;
  if (side === "Long" && data.levels.resistance != null) {
    return data.levels.resistance > (entry ?? 0)
      ? data.levels.resistance
      : null;
  }
  if (side === "Short" && data.levels.support != null) {
    return data.levels.support < (entry ?? Number.POSITIVE_INFINITY)
      ? data.levels.support
      : null;
  }
  if (entry != null && stop != null) {
    const risk = Math.abs(entry - stop);
    if (risk > 0) {
      return side === "Short"
        ? Number((entry - risk * 2).toFixed(2))
        : Number((entry + risk * 2).toFixed(2));
    }
  }
  return null;
}

function swingRiskReward(
  side: SwingTradePlan["side"],
  entry: number | null,
  stop: number | null,
  target: number | null,
): {
  riskPerShare: number | null;
  rewardPerShare: number | null;
  rMultiple: number | null;
} {
  if (side === "NoTrade") {
    return { riskPerShare: null, rewardPerShare: null, rMultiple: null };
  }
  return riskReward(side, entry, stop, target);
}

function formatPctValue(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function lifecycleStatusTone(status: SwingLifecycleStatus) {
  if (status === "Active") return "border-success/40 text-success";
  if (status === "Extended") return "border-warning/50 text-warning";
  if (status === "Invalidated") return "border-danger/40 text-danger";
  return "border-border text-foreground";
}

function buildSwingLifecycle(
  plan: SwingTradePlan,
  currentPrice: number | null | undefined,
): SwingLifecycle {
  const price =
    typeof currentPrice === "number" && Number.isFinite(currentPrice)
      ? currentPrice
      : null;
  const entry = plan.entry.value;
  const stop = plan.stop.value;
  const target = plan.target.value;
  const side = plan.side;

  if (side === "NoTrade" || price == null || entry == null) {
    return {
      status: "Waiting",
      canEnterNow: "No complete setup yet.",
      currentPrice: price,
      distanceFromTriggerPct: null,
      remainingRewardPct: null,
      currentRMultiple: null,
      currentRiskPerShare: null,
      currentRewardPerShare: null,
    };
  }

  const triggered = side === "Long" ? price >= entry : price <= entry;
  const invalidated =
    stop != null && (side === "Long" ? price <= stop : price >= stop);
  const reachedTarget =
    target != null && (side === "Long" ? price >= target : price <= target);
  const distanceFromTriggerPct =
    entry > 0
      ? side === "Long"
        ? ((price - entry) / entry) * 100
        : ((entry - price) / entry) * 100
      : null;
  const remainingRewardPct =
    target != null && price > 0
      ? side === "Long"
        ? ((target - price) / price) * 100
        : ((price - target) / price) * 100
      : null;
  const currentRisk = swingRiskReward(side, price, stop, target);
  const extended =
    reachedTarget ||
    (currentRisk.rMultiple != null && currentRisk.rMultiple < 1) ||
    (remainingRewardPct != null && remainingRewardPct <= 2);

  if (invalidated) {
    return {
      status: "Invalidated",
      canEnterNow: "No. The setup has violated its stop/invalidation level.",
      currentPrice: price,
      distanceFromTriggerPct,
      remainingRewardPct,
      currentRMultiple: currentRisk.rMultiple,
      currentRiskPerShare: currentRisk.riskPerShare,
      currentRewardPerShare: currentRisk.rewardPerShare,
    };
  }

  if (!triggered) {
    return {
      status: "Waiting",
      canEnterNow: "Not yet. Wait for the trigger.",
      currentPrice: price,
      distanceFromTriggerPct,
      remainingRewardPct,
      currentRMultiple: null,
      currentRiskPerShare: null,
      currentRewardPerShare: null,
    };
  }

  if (extended) {
    return {
      status: "Extended",
      canEnterNow: "Entry missed. Wait for a pullback or a new setup.",
      currentPrice: price,
      distanceFromTriggerPct,
      remainingRewardPct,
      currentRMultiple: currentRisk.rMultiple,
      currentRiskPerShare: currentRisk.riskPerShare,
      currentRewardPerShare: currentRisk.rewardPerShare,
    };
  }

  return {
    status: "Active",
    canEnterNow: "Maybe, but only with current-price risk/reward.",
    currentPrice: price,
    distanceFromTriggerPct,
    remainingRewardPct,
    currentRMultiple: currentRisk.rMultiple,
    currentRiskPerShare: currentRisk.riskPerShare,
    currentRewardPerShare: currentRisk.rewardPerShare,
  };
}

function buildSwingTradePlan(data: TraderPlaybookResponse): SwingTradePlan {
  const side = sideFromPlaybook(data);
  const entry = side === "NoTrade" ? null : deriveFallbackEntry(data, side);
  const stop = side === "NoTrade" ? null : deriveFallbackStop(data, side);
  const target =
    side === "NoTrade" ? null : deriveFallbackTarget(data, side, entry, stop);
  const risk = swingRiskReward(side, entry, stop, target);
  const hasPlan = entry != null && stop != null && target != null;
  const setup = setupLabel(data.bestSetup);
  const expectedHold = "5-20 trading sessions";

  return {
    verdict: data.direction,
    confidence: data.confidence,
    status: hasPlan ? statusLabel(data.status) : "No complete trade plan",
    side,
    expectedHold,
    entry: {
      label: "Entry",
      value: entry,
      reason:
        data.levels.entry != null
          ? "Uses the model trade trigger."
          : side === "Short"
            ? "Breakdown below meaningful support."
            : "Breakout above nearest resistance.",
    },
    stop: {
      label: "Stop",
      value: stop,
      reason:
        data.levels.stop != null
          ? "Uses the model invalidation level."
          : side === "Short"
            ? "Above next meaningful resistance."
            : "Below next meaningful support.",
    },
    target: {
      label: "Target",
      value: target,
      reason:
        data.levels.target1 != null
          ? "Uses the model first target."
          : side === "Short"
            ? "Next major support zone or risk-based extension."
            : "Next major resistance zone or risk-based extension.",
    },
    rMultiple: risk.rMultiple,
    riskPerShare: risk.riskPerShare,
    rewardPerShare: risk.rewardPerShare,
    validation: [
      {
        label: "Trend",
        value: alignmentLabel(data.alignment.priceStructure),
        tone: alignmentTone(data.alignment.priceStructure),
      },
      {
        label: "Relative strength",
        value: alignmentLabel(data.alignment.relativeStrength),
        tone: alignmentTone(data.alignment.relativeStrength),
      },
      {
        label: "Regime",
        value: alignmentLabel(data.alignment.marketRegime),
        tone: alignmentTone(data.alignment.marketRegime),
      },
      {
        label: "Breakout quality",
        value:
          data.risk.riskRewardLabel === "unavailable"
            ? setup
            : `${setup} · ${readableLabel(data.risk.riskRewardLabel)}`,
        tone: alignmentTone(data.alignment.executionReadiness),
      },
    ],
    conditions: [
      ...data.conditions.validIf.slice(0, 2),
      ...data.conditions.invalidIf.slice(0, 1),
    ],
    warnings: [...data.warnings, ...data.dataGaps],
  };
}

function SwingMetric({
  label,
  value,
  note,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className={researchMemo.rowLabel}>{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">
        {value}
      </p>
      {note ? <p className={cn("mt-1", researchMemo.rowBody)}>{note}</p> : null}
    </div>
  );
}

function SwingTradePlanContent({
  data,
  symbol,
  accessToken,
}: {
  data: TraderPlaybookResponse;
  symbol: string;
  accessToken?: string | null;
}) {
  const plan = buildSwingTradePlan(data);
  const { snapshot } = useResearchSymbolHeader();
  const lifecycle = buildSwingLifecycle(plan, snapshot?.price);
  const triggered = lifecycle.status !== "Waiting";

  return (
    <>
      <ResearchSection
        title="Swing Trade Verdict"
        className={pageSectionClass}
        bodyClassName="space-y-5"
      >
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={cn(
              "inline-flex border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
              lifecycleStatusTone(lifecycle.status),
            )}
          >
            Trade Status · {lifecycle.status}
          </span>
          <span
            className={cn(
              "inline-flex border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
              plan.verdict === "Bullish"
                ? "border-success/40 text-success"
                : plan.verdict === "Bearish"
                  ? "border-danger/40 text-danger"
                  : "border-border text-foreground",
            )}
          >
            {plan.verdict}
          </span>
          <span className="text-sm font-medium text-muted">
            {plan.confidence} confidence · {plan.status}
          </span>
        </div>
        <div>
          <p className="text-2xl font-semibold tracking-normal text-foreground">
            {lifecycle.canEnterNow}
          </p>
          <p className="mt-2 text-sm font-medium text-muted">
            {plan.side === "NoTrade"
              ? "No execution plan yet."
              : `${plan.side} swing setup · Expected hold ${plan.expectedHold}`}
          </p>
        </div>
      </ResearchSection>

      <ResearchSection title="Swing Trade Plan" className={pageSectionClass}>
        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-6">
          <SwingMetric
            label={triggered ? "Original entry" : "Entry trigger"}
            value={formatMoney(plan.entry.value)}
          />
          {triggered ? (
            <SwingMetric
              label="Current price"
              value={formatMoney(lifecycle.currentPrice)}
              note={
                lifecycle.distanceFromTriggerPct != null
                  ? `${formatPctValue(lifecycle.distanceFromTriggerPct)} from trigger`
                  : undefined
              }
            />
          ) : null}
          <SwingMetric label="Stop" value={formatMoney(plan.stop.value)} />
          <SwingMetric label="Target" value={formatMoney(plan.target.value)} />
          {triggered ? (
            <SwingMetric
              label="Remaining upside"
              value={formatPctValue(lifecycle.remainingRewardPct)}
            />
          ) : null}
          <SwingMetric
            label={triggered ? "Current R/R" : "Risk/Reward"}
            value={formatR(
              triggered ? lifecycle.currentRMultiple : plan.rMultiple,
            )}
            note={
              triggered && plan.rMultiple != null
                ? `Original ${formatR(plan.rMultiple)}`
                : undefined
            }
          />
          <SwingMetric label="Expected hold" value={plan.expectedHold} />
        </div>
      </ResearchSection>

      <SessionReplaySection
        symbol={symbol}
        accessToken={accessToken}
        workflow="swing_trade"
        className={pageSectionClass}
      />

      <ResearchSection title="Why These Levels" className={pageSectionClass}>
        <div className="grid gap-5 md:grid-cols-2">
          {[
            {
              ...plan.entry,
              label: triggered ? "Original entry" : plan.entry.label,
            },
            plan.stop,
            plan.target,
          ].map((level) => (
            <div key={level.label} className="border-l border-border/60 pl-4">
              <p className={researchMemo.rowLabel}>{level.label}</p>
              <p className="mt-1 text-base font-semibold tabular-nums text-foreground">
                {formatMoney(level.value)}
              </p>
              <p className={cn("mt-1", researchMemo.rowBody)}>{level.reason}</p>
            </div>
          ))}
          {triggered ? (
            <div className="border-l border-border/60 pl-4">
              <p className={researchMemo.rowLabel}>Current context</p>
              <p className="mt-1 text-base font-semibold tabular-nums text-foreground">
                {formatMoney(lifecycle.currentPrice)}
              </p>
              <p className={cn("mt-1", researchMemo.rowBody)}>
                Setup already triggered. New entries should use current
                risk/reward, not the original trigger math.
              </p>
            </div>
          ) : null}
          <div className="border-l border-border/60 pl-4">
            <p className={researchMemo.rowLabel}>Holding period</p>
            <p className="mt-1 text-base font-semibold text-foreground">
              {plan.expectedHold}
            </p>
            <p className={cn("mt-1", researchMemo.rowBody)}>
              Derived from model horizon, trend stage, setup type, and expected
              outcome window.
            </p>
          </div>
        </div>
      </ResearchSection>

      <ResearchSection title="Setup Validation" className={pageSectionClass}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {plan.validation.map((item) => (
            <div
              key={item.label}
              className="min-w-0 border-l border-border/60 pl-3"
            >
              <p className={researchMemo.rowLabel}>{item.label}</p>
              <p
                className={cn(
                  "mt-1 text-sm font-semibold text-foreground",
                  item.tone === "positive" && "text-success",
                  item.tone === "negative" && "text-danger",
                  item.tone === "muted" && "text-muted",
                )}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>
        {plan.conditions.length ? (
          <ul className="mt-5 space-y-2 text-sm leading-relaxed text-muted">
            {plan.conditions.map((condition) => (
              <li key={condition} className="border-l border-border/60 pl-4">
                {condition}
              </li>
            ))}
          </ul>
        ) : null}
        {plan.warnings.length ? (
          <p className="mt-5 border-l border-warning/50 pl-4 text-sm font-medium text-warning">
            {plan.warnings[0]}
          </p>
        ) : null}
      </ResearchSection>

      <ResearchSection title="Historical Outcome" className={pageSectionClass}>
        <div className="grid gap-3 sm:grid-cols-3">
          {["Win rate", "Average return", "Average holding period"].map(
            (label) => (
              <div key={label} className="border-l border-border/60 pl-3">
                <p className={researchMemo.rowLabel}>{label}</p>
                <p className="mt-1 text-sm font-semibold text-muted">
                  Future phase
                </p>
              </div>
            ),
          )}
        </div>
      </ResearchSection>
    </>
  );
}

export function SwingTradeResearchPageContent({ symbol }: Props) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const { isEtf } = useResearchAssetTypeContext();
  const { traderPlaybook, isLoading, error } = useTraderPlaybook(
    symbol,
    accessToken,
    {
      enabled: !isEtf,
    },
  );

  if (isEtf) {
    return <EtfFundsOverview symbol={symbol} className={pageSectionClass} />;
  }

  return (
    <div className={appStackClass}>
      {error ? <ErrorBanner message={error} /> : null}
      {isLoading && !traderPlaybook ? (
        <ResearchSection
          title="Swing Trade Verdict"
          className={pageSectionClass}
        >
          <SectionSkeleton />
        </ResearchSection>
      ) : traderPlaybook ? (
        <SwingTradePlanContent
          data={traderPlaybook}
          symbol={symbol}
          accessToken={accessToken}
        />
      ) : (
        <ResearchSection
          title="Swing Trade Verdict"
          className={pageSectionClass}
        >
          <p className="text-sm leading-relaxed text-muted">
            Swing trade playbook is not available yet.
          </p>
        </ResearchSection>
      )}
    </div>
  );
}

type DayTradeStatus = "No trade" | "Watch" | "Long setup" | "Short setup";
type DayTradeDirectionMode = "long" | "short" | "both";
type DayTradeLifecycleState =
  | "NO_TRADE"
  | "WATCH"
  | "LONG_SETUP"
  | "SHORT_SETUP"
  | "ENTRY_TRIGGERED"
  | "IN_TRADE"
  | "TARGET_1_HIT"
  | "TARGET_2_HIT"
  | "INVALIDATED"
  | "STOP_HIT"
  | "CLOSED";

type DayTradeLevel = {
  label: string;
  value: number;
  reason: string;
};

type DayTradeTrigger = DayTradeLevel & {
  side: "Long" | "Short";
};

type DayTradeRisk = {
  riskPerShare: number | null;
  rewardPerShare: number | null;
  rMultiple: number | null;
};

type DayTradeScenarioPlan = {
  side: "Long" | "Short";
  title: string;
  activation: string;
  levels: DayTradeLevel[];
  risk: DayTradeRisk;
};

type DayTradePlan = {
  status: DayTradeStatus;
  confidence: TradingBiasConfidence;
  headline: string;
  explanation: string;
  setupLabel: string;
  dataQuality: string;
  levels: DayTradeLevel[];
  watchTriggers: DayTradeTrigger[];
  conditionalPlans: DayTradeScenarioPlan[];
  risk: DayTradeRisk;
  ladder: DayTradeLevel[];
  warnings: string[];
};

type DayTradeLifecycleViewModel = {
  state: DayTradeLifecycleState;
  label: string;
  nextAction: string;
  actionDetail: string;
  side: "Long" | "Short" | null;
  activePlan: DayTradeScenarioPlan | null;
  progress: Array<{
    key: DayTradeLifecycleState;
    label: string;
    status: "complete" | "current" | "pending";
  }>;
};

const DAY_TRADE_DIRECTION_OPTIONS: Array<{
  value: DayTradeDirectionMode;
  label: string;
}> = [
  { value: "long", label: "Long only" },
  { value: "short", label: "Short only" },
  { value: "both", label: "Long + Short" },
];

function isNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function formatMoney(value: number | null | undefined): string {
  if (!isNumber(value)) return "-";
  return `$${value.toFixed(2)}`;
}

function formatR(value: number | null | undefined): string {
  if (!isNumber(value)) return "-";
  return `${value.toFixed(1)}R`;
}

function readableLabel(value: string): string {
  const explicit: Record<string, string> = {
    ConfirmBreakout: "Confirm breakout",
    FailedBreakout: "Failed breakout",
    GapAndGo: "Gap and go",
    GapFade: "Gap fade",
    OpeningRangeBreakout: "Opening range breakout",
    RangeDay: "Range day",
    RiskOff: "Risk off",
    TrendDay: "Trend day",
    VWAPReclaim: "VWAP reclaim",
    WaitForPullback: "Wait for pullback",
  };
  return (
    explicit[value] ??
    value
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/^./, (letter) => letter.toUpperCase())
  );
}

function entryAbove(value: number): number {
  return Number((value + 0.01).toFixed(2));
}

function entryBelow(value: number): number {
  return Number((value - 0.01).toFixed(2));
}

function riskReward(
  side: "Long" | "Short",
  entry: number | null,
  stop: number | null,
  target: number | null,
): DayTradeRisk {
  if (!isNumber(entry) || !isNumber(stop) || !isNumber(target)) {
    return { riskPerShare: null, rewardPerShare: null, rMultiple: null };
  }

  const risk =
    side === "Long" ? Math.max(0, entry - stop) : Math.max(0, stop - entry);
  const reward =
    side === "Long" ? Math.max(0, target - entry) : Math.max(0, entry - target);

  return {
    riskPerShare: risk || null,
    rewardPerShare: reward || null,
    rMultiple: risk > 0 && reward > 0 ? reward / risk : null,
  };
}

function confidenceWithDataQuality(
  confidence: TradingBiasConfidence,
  hasDataQualityIssue: boolean,
): TradingBiasConfidence {
  if (!hasDataQualityIssue) return confidence;
  return confidence === "High" ? "Medium" : "Low";
}

function buildDayTradePlan(data: IntradayTradingBiasResponse): DayTradePlan {
  const levels = data.levels;
  const openRangeHigh = levels.openRangeHigh;
  const openRangeLow = levels.openRangeLow;
  const hasOpeningRange = isNumber(openRangeHigh) && isNumber(openRangeLow);
  const hasDataQualityIssue =
    !data.isRealtime ||
    data.provider === "yfinance" ||
    (isNumber(data.stalenessSeconds) && data.stalenessSeconds > 15 * 60) ||
    data.warnings.length > 0 ||
    data.dataGaps.length > 0;
  const confidence = confidenceWithDataQuality(
    data.confidence,
    hasDataQualityIssue,
  );
  const warnings = [
    ...data.warnings,
    ...data.dataGaps,
    !data.isRealtime || data.provider === "yfinance"
      ? "Educational plan only: intraday bars are delayed/polled, not a live execution feed."
      : null,
  ].filter((item): item is string => Boolean(item));

  if (!hasOpeningRange) {
    return {
      status: "No trade",
      confidence,
      headline: "No valid intraday plan yet.",
      explanation:
        "Opening range levels are missing, so entry, stop, and target quality is too low.",
      setupLabel: readableLabel(data.setupType),
      dataQuality: hasDataQualityIssue ? "Limited" : "Good",
      levels: [],
      watchTriggers: [],
      conditionalPlans: [],
      risk: { riskPerShare: null, rewardPerShare: null, rMultiple: null },
      ladder: [],
      warnings,
    };
  }

  const orHigh = openRangeHigh;
  const orLow = openRangeLow;
  const rangeWidth = Number((orHigh - orLow).toFixed(2));
  const longEntry = entryAbove(orHigh);
  const shortEntry = entryBelow(orLow);
  const longStop =
    isNumber(levels.vwap) && levels.vwap < longEntry ? levels.vwap : orLow;
  const shortStop =
    isNumber(levels.vwap) && levels.vwap > shortEntry ? levels.vwap : orHigh;
  const longTarget1 = Number((longEntry + rangeWidth).toFixed(2));
  const shortTarget1 = Number((shortEntry - rangeWidth).toFixed(2));
  const longTarget2 =
    isNumber(levels.resistance) && levels.resistance > longTarget1
      ? levels.resistance
      : Number((longEntry + rangeWidth * 1.5).toFixed(2));
  const shortTarget2 =
    isNumber(levels.support) && levels.support < shortTarget1
      ? levels.support
      : Number((shortEntry - rangeWidth * 1.5).toFixed(2));

  const longTrigger: DayTradeTrigger = {
    side: "Long",
    label: "Long trigger",
    value: longEntry,
    reason:
      "Uses OR high because a break and hold above the opening range shows buyers taking control.",
  };
  const shortTrigger: DayTradeTrigger = {
    side: "Short",
    label: "Short trigger",
    value: shortEntry,
    reason:
      "Uses OR low because a break and hold below the opening range shows sellers taking control.",
  };

  const longLevels: DayTradeLevel[] = [
    longTrigger,
    {
      label: "Stop loss",
      value: longStop,
      reason:
        isNumber(levels.vwap) && levels.vwap < longEntry
          ? "Uses VWAP because losing the intraday control line means breakout momentum failed."
          : "Uses OR low because falling back through the range invalidates the breakout.",
    },
    {
      label: "Target 1",
      value: longTarget1,
      reason:
        "Uses the opening range extension because range width estimates the first realistic expansion move.",
    },
    {
      label: "Target 2",
      value: longTarget2,
      reason:
        isNumber(levels.resistance) && levels.resistance > longTarget1
          ? "Uses next intraday resistance because that is the next known supply zone above the range extension."
          : "Uses a larger opening range extension if momentum expands beyond the first target.",
    },
  ];
  const shortLevels: DayTradeLevel[] = [
    shortTrigger,
    {
      label: "Stop loss",
      value: shortStop,
      reason:
        isNumber(levels.vwap) && levels.vwap > shortEntry
          ? "Uses VWAP because reclaiming the intraday control line means breakdown momentum failed."
          : "Uses OR high because moving back through the range invalidates the breakdown.",
    },
    {
      label: "Target 1",
      value: shortTarget1,
      reason:
        "Uses the opening range extension because range width estimates the first realistic expansion move.",
    },
    {
      label: "Target 2",
      value: shortTarget2,
      reason:
        isNumber(levels.support) && levels.support < shortTarget1
          ? "Uses next intraday support because that is the next known demand zone below the range extension."
          : "Uses a larger opening range extension if selling pressure expands beyond the first target.",
    },
  ];
  const longScenario: DayTradeScenarioPlan = {
    side: "Long",
    title: "Long Breakout Plan",
    activation: "Activates only after price breaks and holds above OR high.",
    levels: longLevels,
    risk: riskReward("Long", longEntry, longStop, longTarget1),
  };
  const shortScenario: DayTradeScenarioPlan = {
    side: "Short",
    title: "Short Breakdown Plan",
    activation: "Activates only after price breaks and holds below OR low.",
    levels: shortLevels,
    risk: riskReward("Short", shortEntry, shortStop, shortTarget1),
  };
  const ladder: DayTradeLevel[] = [
    {
      label: "Long target",
      value: longTarget1,
      reason: "Opening range extension",
    },
    {
      label: "Long trigger",
      value: longEntry,
      reason: "Break above OR high",
    },
    {
      label: "VWAP",
      value: levels.vwap ?? Number(((orHigh + orLow) / 2).toFixed(2)),
      reason: "Control level",
    },
    {
      label: "Short trigger",
      value: shortEntry,
      reason: "Break below OR low",
    },
    {
      label: "Short target",
      value: shortTarget1,
      reason: "Opening range extension",
    },
  ];

  const canUseDirectionalSetup = !hasDataQualityIssue || confidence !== "Low";
  if (data.bias === "Bullish" && canUseDirectionalSetup) {
    return {
      status: "Long setup",
      confidence,
      headline: "Long only above the opening range.",
      explanation:
        "Entry is a trigger, not a live buy call. The setup fails if price loses VWAP or falls back inside the opening range.",
      setupLabel: readableLabel(data.setupType),
      dataQuality: hasDataQualityIssue ? "Educational / delayed" : "Good",
      levels: longLevels,
      watchTriggers: [],
      conditionalPlans: [longScenario],
      risk: longScenario.risk,
      ladder,
      warnings,
    };
  }

  if (data.bias === "Bearish" && canUseDirectionalSetup) {
    return {
      status: "Short setup",
      confidence,
      headline: "Short only below the opening range.",
      explanation:
        "Entry is a trigger, not a live short call. The setup fails if price reclaims VWAP or moves back inside the opening range.",
      setupLabel: readableLabel(data.setupType),
      dataQuality: hasDataQualityIssue ? "Educational / delayed" : "Good",
      levels: shortLevels,
      watchTriggers: [],
      conditionalPlans: [shortScenario],
      risk: shortScenario.risk,
      ladder,
      warnings,
    };
  }

  return {
    status: "Watch",
    confidence,
    headline: "No trade while price is inside the opening range.",
    explanation:
      "Range-day conditions require confirmation. A trade only exists after price breaks and holds outside the opening range.",
    setupLabel: readableLabel(data.setupType),
    dataQuality: hasDataQualityIssue ? "Educational / delayed" : "Good",
    levels: [
      {
        label: "VWAP",
        value: levels.vwap ?? Number(((orHigh + orLow) / 2).toFixed(2)),
        reason:
          "VWAP is the momentum line; losing or reclaiming it helps confirm whether the breakout has real control.",
      },
    ],
    watchTriggers: [longTrigger, shortTrigger],
    conditionalPlans: [longScenario, shortScenario],
    risk: { riskPerShare: null, rewardPerShare: null, rMultiple: null },
    ladder,
    warnings,
  };
}

function scenarioMatchesDirection(
  scenario: DayTradeScenarioPlan,
  direction: DayTradeDirectionMode,
): boolean {
  if (direction === "both") return true;
  return direction === "long"
    ? scenario.side === "Long"
    : scenario.side === "Short";
}

function triggerMatchesDirection(
  trigger: DayTradeTrigger,
  direction: DayTradeDirectionMode,
): boolean {
  if (direction === "both") return true;
  return direction === "long"
    ? trigger.side === "Long"
    : trigger.side === "Short";
}

function applyDayTradeDirectionMode(
  plan: DayTradePlan,
  direction: DayTradeDirectionMode,
): DayTradePlan {
  if (direction === "both") return plan;

  const conditionalPlans = plan.conditionalPlans.filter((scenario) =>
    scenarioMatchesDirection(scenario, direction),
  );
  const watchTriggers = plan.watchTriggers.filter((trigger) =>
    triggerMatchesDirection(trigger, direction),
  );
  const selectedSide = direction === "long" ? "Long" : "Short";
  const sideBlocked =
    (plan.status === "Long setup" && direction === "short") ||
    (plan.status === "Short setup" && direction === "long");

  if (!sideBlocked) {
    return { ...plan, conditionalPlans, watchTriggers };
  }

  return {
    ...plan,
    status: "No trade",
    headline: `No ${selectedSide.toLowerCase()} setup right now.`,
    explanation:
      "The selected direction does not have a valid setup. Switch modes to review the other side.",
    levels: [],
    watchTriggers: [],
    conditionalPlans: [],
    risk: { riskPerShare: null, rewardPerShare: null, rMultiple: null },
  };
}

function eventDirection(
  event: TradeReplayEvent,
): DayTradeDirectionMode | "neutral" {
  const text = `${event.event_type} ${event.message}`.toLowerCase();
  if (/\bshort\b|breakdown|below|downside/.test(text)) return "short";
  if (/\blong\b|breakout|above|upside/.test(text)) return "long";
  return "neutral";
}

function filterReplayEventsForDirection(
  events: TradeReplayEvent[],
  direction: DayTradeDirectionMode,
): TradeReplayEvent[] {
  if (direction === "both") return events;
  return events.filter((event) => {
    const inferred = eventDirection(event);
    return inferred === "neutral" || inferred === direction;
  });
}

function latestReplayState(
  events: TradeReplayEvent[],
): DayTradeLifecycleState | null {
  let state: DayTradeLifecycleState | null = null;
  for (const event of events) {
    if (event.event_type === "stop_hit") state = "STOP_HIT";
    else if (
      event.event_type === "setup_invalidated" ||
      event.event_type === "opening_range_failed" ||
      event.event_type === "long_breakout_failed_same_candle"
    ) {
      state = "INVALIDATED";
    } else if (event.event_type === "target_2_hit") state = "TARGET_2_HIT";
    else if (
      event.event_type === "target_1_hit" ||
      event.event_type === "target_hit"
    ) {
      state = "TARGET_1_HIT";
    } else if (
      event.event_type === "entry_triggered" ||
      event.event_type === "long_trigger_activated" ||
      event.event_type === "short_trigger_activated" ||
      event.event_type === "opening_range_broke"
    ) {
      state = "ENTRY_TRIGGERED";
    } else if (
      event.event_type === "closed" ||
      event.event_type === "close_exit"
    ) {
      state = "CLOSED";
    }
  }
  return state;
}

function activeScenarioForPlan(
  plan: DayTradePlan,
  direction: DayTradeDirectionMode,
  events: TradeReplayEvent[],
): DayTradeScenarioPlan | null {
  if (plan.conditionalPlans.length === 1) return plan.conditionalPlans[0];
  const triggered = [...events]
    .reverse()
    .find((event) =>
      [
        "entry_triggered",
        "long_trigger_activated",
        "short_trigger_activated",
        "opening_range_broke",
      ].includes(event.event_type),
    );
  if (triggered) {
    const inferred = eventDirection(triggered);
    if (inferred === "long") {
      return (
        plan.conditionalPlans.find((scenario) => scenario.side === "Long") ??
        null
      );
    }
    if (inferred === "short") {
      return (
        plan.conditionalPlans.find((scenario) => scenario.side === "Short") ??
        null
      );
    }
  }
  if (direction === "long") {
    return (
      plan.conditionalPlans.find((scenario) => scenario.side === "Long") ?? null
    );
  }
  if (direction === "short") {
    return (
      plan.conditionalPlans.find((scenario) => scenario.side === "Short") ??
      null
    );
  }
  return null;
}

function lifecycleStateFromPlan(plan: DayTradePlan): DayTradeLifecycleState {
  if (plan.status === "Long setup") return "LONG_SETUP";
  if (plan.status === "Short setup") return "SHORT_SETUP";
  if (plan.status === "Watch") return "WATCH";
  return "NO_TRADE";
}

function lifecycleLabel(state: DayTradeLifecycleState): string {
  const labels: Record<DayTradeLifecycleState, string> = {
    NO_TRADE: "No Trade",
    WATCH: "Watch",
    LONG_SETUP: "Long Setup",
    SHORT_SETUP: "Short Setup",
    ENTRY_TRIGGERED: "Entry Triggered",
    IN_TRADE: "In Trade",
    TARGET_1_HIT: "Target 1 Hit",
    TARGET_2_HIT: "Target 2 Hit",
    INVALIDATED: "Invalidated",
    STOP_HIT: "Stop Hit",
    CLOSED: "Closed",
  };
  return labels[state];
}

function buildLifecycleProgress(state: DayTradeLifecycleState) {
  const terminal =
    state === "INVALIDATED" || state === "STOP_HIT" || state === "CLOSED"
      ? state
      : state === "TARGET_2_HIT"
        ? "TARGET_2_HIT"
        : null;
  const steps: Array<{ key: DayTradeLifecycleState; label: string }> = [
    { key: "WATCH", label: "Watch" },
    { key: "ENTRY_TRIGGERED", label: "Entry Triggered" },
    { key: "TARGET_1_HIT", label: "Target 1" },
    {
      key: terminal ?? "TARGET_2_HIT",
      label: lifecycleLabel(terminal ?? "TARGET_2_HIT"),
    },
  ];
  const currentIndex = Math.max(
    0,
    steps.findIndex((step) => step.key === state),
  );
  return steps.map((step, index) => ({
    ...step,
    status:
      index < currentIndex
        ? ("complete" as const)
        : index === currentIndex
          ? ("current" as const)
          : ("pending" as const),
  }));
}

function buildLifecycleViewModel(
  plan: DayTradePlan,
  direction: DayTradeDirectionMode,
  replayEvents: TradeReplayEvent[],
): DayTradeLifecycleViewModel {
  const events = filterReplayEventsForDirection(replayEvents, direction);
  const replayState = latestReplayState(events);
  const activePlan = activeScenarioForPlan(plan, direction, events);
  const state = replayState ?? lifecycleStateFromPlan(plan);
  const side =
    activePlan?.side ??
    (state === "LONG_SETUP"
      ? "Long"
      : state === "SHORT_SETUP"
        ? "Short"
        : null);
  const entryLabel = side === "Short" ? "Short trigger" : "Long trigger";
  const entry = activePlan ? levelValue(activePlan, entryLabel) : null;
  const stop = activePlan ? levelValue(activePlan, "Stop loss") : null;

  const nextActionByState: Record<DayTradeLifecycleState, string> = {
    NO_TRADE: "Do not enter",
    WATCH: "Wait for breakout",
    LONG_SETUP: "Wait for close above trigger",
    SHORT_SETUP: "Wait for close below trigger",
    ENTRY_TRIGGERED: "Monitor stop",
    IN_TRADE: "Hold position",
    TARGET_1_HIT: "Review Target 2",
    TARGET_2_HIT: "Trade complete",
    INVALIDATED: "Do not enter",
    STOP_HIT: "Trade stopped out",
    CLOSED: "Trade complete",
  };
  const detailByState: Record<DayTradeLifecycleState, string> = {
    NO_TRADE: "No valid setup exists for the selected direction.",
    WATCH: entry
      ? `Wait for a confirmed move through ${formatMoney(entry)}.`
      : "Wait for price to break and hold outside the opening range.",
    LONG_SETUP: entry
      ? `Wait for close above ${formatMoney(entry)}.`
      : "Wait for a confirmed long breakout.",
    SHORT_SETUP: entry
      ? `Wait for close below ${formatMoney(entry)}.`
      : "Wait for a confirmed short breakdown.",
    ENTRY_TRIGGERED: stop
      ? `Trade active. Monitor stop at ${formatMoney(stop)}.`
      : "Trade active. Monitor the stop level.",
    IN_TRADE: stop
      ? `Hold position while stop at ${formatMoney(stop)} is intact.`
      : "Hold position while the setup remains valid.",
    TARGET_1_HIT: "Target 1 achieved. Review remaining risk.",
    TARGET_2_HIT: "Target 2 achieved. Trade complete.",
    INVALIDATED: "Setup failed. No entry.",
    STOP_HIT: "Trade stopped out.",
    CLOSED: "Trade complete.",
  };

  return {
    state,
    label: lifecycleLabel(state),
    nextAction: nextActionByState[state],
    actionDetail: detailByState[state],
    side,
    activePlan,
    progress: buildLifecycleProgress(state),
  };
}

function DayTradeMetric({
  label,
  value,
  note,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className={researchMemo.rowLabel}>{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
        {value}
      </p>
      {note ? <p className={cn("mt-1", researchMemo.rowBody)}>{note}</p> : null}
    </div>
  );
}

function levelValue(plan: DayTradeScenarioPlan, label: string): number | null {
  return plan.levels.find((level) => level.label === label)?.value ?? null;
}

function DayTradeScenarioCard({ plan }: { plan: DayTradeScenarioPlan }) {
  const triggerLabel = plan.side === "Long" ? "Long trigger" : "Short trigger";

  return (
    <div className="space-y-4 border-l border-border/60 pl-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-base font-semibold text-foreground">
            {plan.title}
          </p>
          <p className="mt-1 text-xs font-medium text-muted">
            {plan.activation}
          </p>
        </div>
        <p className="text-sm font-semibold tabular-nums text-foreground">
          {formatR(plan.risk.rMultiple)}
        </p>
      </div>

      <div className="grid gap-x-6 gap-y-4 sm:grid-cols-4">
        <DayTradeMetric
          label="Entry"
          value={formatMoney(levelValue(plan, triggerLabel))}
        />
        <DayTradeMetric
          label="Stop"
          value={formatMoney(levelValue(plan, "Stop loss"))}
        />
        <DayTradeMetric
          label="Target"
          value={formatMoney(levelValue(plan, "Target 1"))}
        />
        <DayTradeMetric label="R/R" value={formatR(plan.risk.rMultiple)} />
      </div>
    </div>
  );
}

function directionFromSearchParam(value: string | null): DayTradeDirectionMode {
  if (value === "short") return "short";
  if (value === "both") return "both";
  return "long";
}

function directionToSearchParam(value: DayTradeDirectionMode): string {
  if (value === "short") return "short";
  if (value === "both") return "both";
  return "long";
}

function directionToBackendMode(
  value: DayTradeDirectionMode,
): "long_only" | "short_only" | "long_and_short" {
  if (value === "short") return "short_only";
  if (value === "both") return "long_and_short";
  return "long_only";
}

function DirectionIcon({ side }: { side: "Long" | "Short" | null }) {
  if (side === "Short") return <ArrowDown className="h-5 w-5" aria-hidden />;
  return <ArrowUp className="h-5 w-5" aria-hidden />;
}

function DayTradeDirectionSelector({
  value,
  onChange,
}: {
  value: DayTradeDirectionMode;
  onChange: (value: DayTradeDirectionMode) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="inline-grid grid-cols-3 border border-border bg-background">
        {DAY_TRADE_DIRECTION_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "px-3 py-2 text-xs font-semibold transition sm:px-4",
              value === option.value
                ? "bg-muted-bg text-foreground"
                : "text-muted hover:text-foreground",
            )}
            aria-pressed={value === option.value}
          >
            {option.label}
          </button>
        ))}
      </div>
      <p className="text-xs leading-relaxed text-muted">
        Choose whether this strategy looks for upside breakouts, downside
        breakdowns, or both.
      </p>
    </div>
  );
}

function lifecycleTone(
  state: DayTradeLifecycleState,
  side: "Long" | "Short" | null,
): string {
  if (state === "INVALIDATED" || state === "STOP_HIT") {
    return "border-danger/40 text-danger";
  }
  if (
    state === "TARGET_1_HIT" ||
    state === "TARGET_2_HIT" ||
    state === "CLOSED"
  ) {
    return "border-success/40 text-success";
  }
  if (side === "Short" || state === "SHORT_SETUP")
    return "border-danger/40 text-danger";
  if (
    side === "Long" ||
    state === "LONG_SETUP" ||
    state === "ENTRY_TRIGGERED"
  ) {
    return "border-success/40 text-success";
  }
  if (state === "WATCH") return "border-warning/50 text-warning";
  return "border-border text-muted";
}

function CurrentStateCard({
  lifecycle,
  plan,
}: {
  lifecycle: DayTradeLifecycleViewModel;
  plan: DayTradePlan;
}) {
  return (
    <ResearchSection
      title="Current State"
      className={pageSectionClass}
      bodyClassName="space-y-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "inline-flex h-11 w-11 items-center justify-center border",
              lifecycleTone(lifecycle.state, lifecycle.side),
            )}
          >
            <DirectionIcon side={lifecycle.side} />
          </span>
          <div>
            <p className="text-2xl font-semibold tracking-normal text-foreground">
              {lifecycle.label}
            </p>
            <p className="mt-1 text-sm font-medium text-muted">
              {plan.confidence} confidence · {plan.setupLabel}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex border px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
            lifecycleTone(lifecycle.state, lifecycle.side),
          )}
        >
          {lifecycle.side ?? "No Direction"}
        </span>
      </div>
      <div className="border-l border-accent/60 pl-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Next Action
        </p>
        <p className="mt-1 text-xl font-semibold text-foreground">
          {lifecycle.nextAction}
        </p>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          {lifecycle.actionDetail}
        </p>
      </div>
    </ResearchSection>
  );
}

function ActionLevelsGrid({ plan }: { plan: DayTradeScenarioPlan | null }) {
  const triggerLabel =
    plan?.side === "Short" ? "Short trigger" : "Long trigger";
  const target1 = plan ? levelValue(plan, "Target 1") : null;
  const target2 = plan ? levelValue(plan, "Target 2") : null;
  const items = [
    { label: "Entry", value: plan ? levelValue(plan, triggerLabel) : null },
    { label: "Stop", value: plan ? levelValue(plan, "Stop loss") : null },
    { label: "Target 1", value: target1 },
    { label: "Target 2", value: target2 },
    { label: "Risk / Reward", value: formatR(plan?.risk.rMultiple) },
  ];

  return (
    <ResearchSection title="Action Levels" className={pageSectionClass}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {items.map((item) => (
          <div
            key={item.label}
            className="border border-border bg-background p-4"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {item.label}
            </p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
              {typeof item.value === "number"
                ? formatMoney(item.value)
                : (item.value ?? "-")}
            </p>
          </div>
        ))}
      </div>
    </ResearchSection>
  );
}

function LifecycleTracker({
  lifecycle,
}: {
  lifecycle: DayTradeLifecycleViewModel;
}) {
  return (
    <ResearchSection title="Lifecycle" className={pageSectionClass}>
      <div className="grid gap-2 sm:grid-cols-4">
        {lifecycle.progress.map((step) => (
          <div
            key={`${step.key}-${step.label}`}
            className={cn(
              "flex items-center gap-2 border px-3 py-3 text-sm font-semibold",
              step.status === "current"
                ? "border-accent/70 bg-muted-bg text-foreground"
                : step.status === "complete"
                  ? "border-success/40 text-success"
                  : "border-border text-muted",
            )}
          >
            {step.status === "complete" ? (
              <CircleCheck className="h-4 w-4" aria-hidden />
            ) : step.status === "current" ? (
              <CircleDot className="h-4 w-4" aria-hidden />
            ) : (
              <Circle className="h-4 w-4" aria-hidden />
            )}
            <span>{step.label}</span>
          </div>
        ))}
      </div>
    </ResearchSection>
  );
}

function EvidenceSection({ plan }: { plan: DayTradePlan }) {
  const primaryWarning = plan.warnings[0];

  return (
    <ResearchSection
      title="Evidence / Reasoning"
      className={pageSectionClass}
      bodyClassName="space-y-4"
    >
      <div>
        <p className="text-lg font-semibold text-foreground">{plan.headline}</p>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
          {plan.explanation}
        </p>
      </div>
      {primaryWarning ? (
        <p className="border-l border-warning/50 pl-3 text-sm font-medium text-warning">
          {primaryWarning}
        </p>
      ) : null}
    </ResearchSection>
  );
}

function PriceLadder({ levels }: { levels: DayTradeLevel[] }) {
  if (!levels.length) return null;

  return (
    <ResearchSection title="Activation Levels" className={pageSectionClass}>
      <div className="space-y-0">
        {levels.map((level) => (
          <div
            key={`${level.label}-${level.value}`}
            className={cn(
              "grid grid-cols-[minmax(7rem,0.4fr)_minmax(0,1fr)_auto] items-center gap-4 border-b border-border/50 py-3 last:border-b-0",
              level.label.includes("Long") && "text-success",
              level.label.includes("Short") && "text-danger",
              level.label === "VWAP" && "text-foreground",
            )}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-current">
              {level.label}
            </p>
            <div className="h-px bg-current/25" aria-hidden="true" />
            <div className="text-right">
              <p className="text-base font-semibold tabular-nums text-current">
                {formatMoney(level.value)}
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-muted">
                {level.reason}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ResearchSection>
  );
}

function MethodologySection({ hasWarnings }: { hasWarnings: boolean }) {
  const items = [
    "Entry: opening range break above/below.",
    "Stop: VWAP as intraday control.",
    "Target: one opening range extension.",
    hasWarnings ? "Data: educational / delayed, not live execution." : null,
  ].filter((item): item is string => Boolean(item));

  return (
    <ResearchSection title="Methodology" className={pageSectionClass}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {items.map((item) => (
          <p
            key={item}
            className="border-l border-border/60 pl-3 text-sm leading-snug text-muted"
          >
            {item}
          </p>
        ))}
      </div>
    </ResearchSection>
  );
}

function DayTradePlanContent({
  data,
  symbol,
  accessToken,
}: {
  data: IntradayTradingBiasResponse;
  symbol: string;
  accessToken?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const direction = directionFromSearchParam(searchParams.get("direction"));
  const basePlan = buildDayTradePlan(data);
  const plan = applyDayTradeDirectionMode(basePlan, direction);
  const replayQuery = useTradeReplay(
    symbol,
    accessToken ?? undefined,
    "day_trade",
    {
      enabled: Boolean(accessToken),
      refreshOnLoad: false,
      directionMode: directionToBackendMode(direction),
    },
  );
  const replayEvents = filterReplayEventsForDirection(
    replayQuery.replay?.events ?? [],
    direction,
  );
  const lifecycle = buildLifecycleViewModel(plan, direction, replayEvents);

  function updateDirection(next: DayTradeDirectionMode) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("direction", directionToSearchParam(next));
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <>
      <ResearchSection title="Day Trade Mode" className={pageSectionClass}>
        <DayTradeDirectionSelector
          value={direction}
          onChange={updateDirection}
        />
      </ResearchSection>

      <CurrentStateCard lifecycle={lifecycle} plan={plan} />

      <ActionLevelsGrid plan={lifecycle.activePlan} />

      <LifecycleTracker lifecycle={lifecycle} />

      <ResearchSection title="Trade Plans" className={pageSectionClass}>
        {plan.conditionalPlans.length ? (
          <div className="grid gap-8 lg:grid-cols-2">
            {plan.conditionalPlans.map((scenario) => (
              <DayTradeScenarioCard key={scenario.title} plan={scenario} />
            ))}
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-muted">
            No trade for the selected direction. Switch modes to review other
            possible setups.
          </p>
        )}
      </ResearchSection>

      <EvidenceSection plan={plan} />

      <PriceLadder levels={plan.ladder} />

      <SessionReplaySection
        symbol={symbol}
        accessToken={accessToken}
        workflow="day_trade"
        className={pageSectionClass}
        direction={direction}
      />

      <MethodologySection hasWarnings={plan.warnings.length > 0} />
    </>
  );
}

export function DayTradeResearchPageContent({ symbol }: Props) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const { intradayTradingBias, isLoading, error } = useIntradayTradingBias(
    symbol,
    accessToken,
  );

  return (
    <div className={appStackClass}>
      {error ? <ErrorBanner message={error} /> : null}
      {isLoading && !intradayTradingBias ? (
        <ResearchSection title="Day Trade Verdict" className={pageSectionClass}>
          <SectionSkeleton />
        </ResearchSection>
      ) : intradayTradingBias ? (
        <DayTradePlanContent
          data={intradayTradingBias}
          symbol={symbol}
          accessToken={accessToken}
        />
      ) : (
        <ResearchSection title="Day Trade Verdict" className={pageSectionClass}>
          <div className="space-y-2">
            <p className="text-base font-semibold text-foreground">No trade</p>
            <p className="max-w-2xl text-sm leading-relaxed text-muted">
              We do not have enough intraday coverage for this symbol yet. This
              page will only show entry, stop, target, and risk/reward when the
              data can support those levels.
            </p>
          </div>
        </ResearchSection>
      )}
    </div>
  );
}
