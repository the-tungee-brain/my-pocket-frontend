"use client";

import { useTraderPlaybook } from "@/app/hooks/useTraderPlaybook";
import { useTradingBias } from "@/app/hooks/useTradingBias";
import type {
  TraderPlaybookResponse,
  TraderPlaybookSide,
  TraderPlaybookStatus,
  TradingBiasLabel,
  TradingBiasResponse,
} from "@/app/types/research";
import {
  ResearchDecisionBlock,
  ResearchSection,
} from "@/components/research/ResearchMemoPrimitives";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";

type Props = {
  symbol: string;
  accessToken?: string | null;
  className?: string;
};

type ResolvedSide = NonNullable<TraderPlaybookSide>;

const BIAS_TEXT: Record<TradingBiasLabel, string> = {
  Bullish: "text-success",
  Neutral: "text-foreground",
  Bearish: "text-danger",
};

const STATUS_COPY: Record<TraderPlaybookStatus, string> = {
  Valid: "Setup active.",
  Waiting: "No trigger yet.",
  Invalid: "Setup invalidated.",
  NoSetup: "No clean setup.",
};

function sideFromData(data: TraderPlaybookResponse): ResolvedSide {
  if (data.side) return data.side;
  if (data.status === "NoSetup" || data.bestSetup === "None") return "NoTrade";
  return data.direction === "Bearish" ? "Short" : "Long";
}

function concisePlaybookLine(
  data: TraderPlaybookResponse,
  displayStatus: TraderPlaybookStatus,
): string {
  const side = sideFromData(data);
  if (displayStatus === "NoSetup") {
    const bearishNoTrade =
      side === "NoTrade" && data.bestSetup === "FailedBreakout";
    if (bearishNoTrade)
      return "No clean long setup; failed breakout risk remains.";
    return (
      data.warnings[0] ??
      data.conditions.invalidIf[0] ??
      "No clean setup is available."
    );
  }
  if (displayStatus === "Waiting") {
    const trigger = data.conditions.validIf[0];
    return trigger
      ? `Waiting for ${trigger.toLowerCase()}`
      : "Waiting for a cleaner trigger.";
  }
  if (displayStatus === "Invalid") {
    return (
      data.conditions.invalidIf[0] ?? "The current setup has been invalidated."
    );
  }
  return (
    data.conditions.validIf[0] ??
    "The setup is active with current daily levels."
  );
}

function decisionConclusion(
  data: TraderPlaybookResponse,
  displayStatus: TraderPlaybookStatus,
): string {
  const line = concisePlaybookLine(data, displayStatus);
  if (line.toLowerCase().startsWith(STATUS_COPY[displayStatus].toLowerCase())) {
    return line;
  }
  if (
    displayStatus === "NoSetup" &&
    line.toLowerCase().startsWith("no clean")
  ) {
    return line;
  }
  if (displayStatus === "NoSetup" && line.includes(";")) return line;
  return `${STATUS_COPY[displayStatus]} ${line}`;
}

function DecisionSkeleton() {
  return (
    <div className="space-y-4" aria-hidden>
      <Skeleton className="h-9 w-72" />
      <Skeleton className="h-5 w-full max-w-2xl" />
      <Skeleton className="h-4 w-full max-w-xl" />
    </div>
  );
}

function sentenceCase(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function shouldSuppressBullishFactor(
  factor: string,
  data: TraderPlaybookResponse | null,
  displayStatus: TraderPlaybookStatus | undefined,
) {
  if (!data || data.bestSetup !== "FailedBreakout") return false;
  if (displayStatus !== "NoSetup" && displayStatus !== "Invalid") return false;
  const lower = factor.toLowerCase();
  return (
    lower.includes("confirmed breakout") ||
    lower.includes("breakout above") ||
    lower.includes("above resistance")
  );
}

function hasConfirmedBreakoutCopy(value: string): boolean {
  const lower = value.toLowerCase();
  return (
    lower.includes("confirmed breakout") ||
    lower.includes("breakout above") ||
    lower.includes("above resistance")
  );
}

function hasFailedBreakoutCopy(value: string): boolean {
  const lower = value.toLowerCase();
  return (
    lower.includes("failed breakout") ||
    lower.includes("breakout risk") ||
    lower.includes("rejection")
  );
}

function whyBullets({
  tradingBias,
  traderPlaybook,
  displayStatus,
}: {
  tradingBias: TradingBiasResponse | null;
  traderPlaybook: TraderPlaybookResponse | null;
  displayStatus?: TraderPlaybookStatus;
}) {
  const bullets: string[] = [];
  if (traderPlaybook?.reasons.length) {
    bullets.push(...traderPlaybook.reasons);
  }
  if (traderPlaybook?.warnings.length) {
    bullets.push(...traderPlaybook.warnings);
  }

  const cautionFirst =
    tradingBias?.bias !== "Bullish" ||
    displayStatus === "NoSetup" ||
    displayStatus === "Invalid" ||
    traderPlaybook?.bestSetup === "FailedBreakout";
  const bullishFactors = (tradingBias?.bullishFactors ?? []).filter(
    (factor) =>
      !shouldSuppressBullishFactor(factor, traderPlaybook, displayStatus),
  );
  const directionalFactors = cautionFirst
    ? [...(tradingBias?.bearishFactors ?? []), ...bullishFactors]
    : [...bullishFactors, ...(tradingBias?.bearishFactors ?? [])];
  bullets.push(...directionalFactors);

  const unique = Array.from(
    new Map(
      bullets
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => [item.toLowerCase(), item] as const),
    ).values(),
  );

  const hasConfirmed = unique.some(hasConfirmedBreakoutCopy);
  const hasFailed = unique.some(hasFailedBreakoutCopy);
  const reconciled =
    hasConfirmed && hasFailed
      ? [
          "Mixed breakout evidence; no clean trigger yet.",
          ...unique.filter(
            (item) =>
              !hasConfirmedBreakoutCopy(item) && !hasFailedBreakoutCopy(item),
          ),
        ]
      : unique;

  return reconciled.slice(0, 2).map(sentenceCase);
}

export function ResearchOverviewDecision({
  symbol,
  accessToken,
  className,
}: Props) {
  const {
    tradingBias,
    isLoading: biasLoading,
    error: biasError,
  } = useTradingBias(symbol, accessToken ?? undefined);
  const {
    traderPlaybook,
    isLoading: playbookLoading,
    error: playbookError,
  } = useTraderPlaybook(symbol, accessToken ?? undefined);
  const loading =
    (biasLoading && !tradingBias) || (playbookLoading && !traderPlaybook);
  const displayStatus = traderPlaybook?.status;

  return (
    <ResearchSection title="Decision" className={className}>
      {loading ? (
        <DecisionSkeleton />
      ) : biasError && !tradingBias ? (
        <ErrorBanner message={biasError} />
      ) : playbookError && !traderPlaybook ? (
        <ErrorBanner message={playbookError} />
      ) : !tradingBias && !traderPlaybook ? (
        <p className="text-sm text-muted">Decision data is not available.</p>
      ) : (
        <ResearchDecisionBlock
          headline={
            tradingBias ? (
              <>
                <span className={BIAS_TEXT[tradingBias.bias]}>
                  {tradingBias.bias}
                </span>
                <span className="text-muted"> · </span>
                <span>{tradingBias.confidence} confidence</span>
              </>
            ) : (
              "Decision unavailable"
            )
          }
          conclusion={
            traderPlaybook && displayStatus
              ? decisionConclusion(traderPlaybook, displayStatus)
              : undefined
          }
          meta={
            tradingBias
              ? `${tradingBias.horizon} · Daily data`
              : traderPlaybook
                ? `${traderPlaybook.horizon} · Daily data`
                : undefined
          }
          why={whyBullets({
            tradingBias,
            traderPlaybook,
            displayStatus,
          })}
        />
      )}
    </ResearchSection>
  );
}
