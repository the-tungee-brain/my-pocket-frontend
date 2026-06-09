"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { BriefcaseBusiness } from "lucide-react";
import { usePortfolioContext } from "@/app/contextSelectors";
import { usePositionGuidance } from "@/app/hooks/usePositionGuidance";
import { useResearchSymbolHeader } from "@/app/research/[symbol]/ResearchSymbolHeaderContext";
import { useResearchSymbolIntelligence } from "@/app/research/[symbol]/ResearchSymbolIntelligenceContext";
import type {
  PositionGuidanceItem,
  PositionVerdict,
  SymbolPositionGuidance,
} from "@/app/types/positionGuidance";
import type { Position } from "@/app/types/schwab";
import { OptionsTabPrompt } from "@/components/OptionsTabPrompt";
import { RecentActivitySection } from "@/components/RecentActivitySection";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { appPanelSubtleClass, appStackClass } from "@/lib/appUi";
import { formatOptionExpiration } from "@/lib/dateUtils";
import { formatSignedUsd, formatUsd } from "@/lib/formatCurrency";
import {
  buildPositionDriverDisplay,
  type DedupedDriver,
  driverCategory,
} from "@/lib/guidanceScoringContributors";
import {
  plainEnglishFromDriver,
  urgencyQualitativeLabel,
} from "@/lib/guidancePlainEnglish";
import { optionStrategyLabel } from "@/lib/optionStrategyLabel";
import {
  openProfitLossPct,
  sumCostBasis,
  sumOpenProfitLoss,
  sumPortfolioWeight,
} from "@/lib/positionMetrics";
import { shouldShowOptionsTab } from "@/lib/symbolOptions";
import { symbolHubPath } from "@/lib/symbolRoutes";
import { cn } from "@/lib/utils";

type Props = {
  symbol: string;
};

type Tone = "positive" | "negative" | "muted";

type ReviewMetric = {
  label: string;
  value: string;
  tone?: Tone;
  note?: string | null;
};

type DecisionDriver = {
  title: string;
  detail?: string | null;
  category?: string;
};

type CompositionItem = {
  title: string;
  quantity: string;
  detail?: string | null;
  context?: string | null;
};

const VERDICT_LABEL: Record<PositionVerdict, string> = {
  HOLD: "Hold",
  TRIM: "Trim",
  REVIEW_SELL: "Review sell",
  EXIT: "Exit",
  REVIEW_CLOSE: "Review close",
  CLOSE: "Close",
  ROLL: "Roll",
  REVIEW_ASSIGNMENT_RISK: "Review risk",
};

function verdictTone(verdict: PositionVerdict | null | undefined) {
  switch (verdict) {
    case "HOLD":
      return "border-success/25 bg-success/10 text-success";
    case "TRIM":
    case "ROLL":
    case "REVIEW_SELL":
    case "REVIEW_CLOSE":
    case "REVIEW_ASSIGNMENT_RISK":
      return "border-warning/25 bg-warning-muted text-warning";
    case "EXIT":
    case "CLOSE":
      return "border-danger/25 bg-danger/10 text-danger";
    default:
      return "border-border bg-muted-bg text-muted";
  }
}

function metricToneClass(tone?: Tone) {
  if (tone === "positive") return "text-success";
  if (tone === "negative") return "text-danger";
  return "text-foreground";
}

function formatPct(value: number | null | undefined, digits = 1) {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

function formatSignedPct(value: number | null | undefined, digits = 1) {
  if (value == null || !Number.isFinite(value)) return null;
  return `${value >= 0 ? "+" : ""}${value.toFixed(digits)}%`;
}

function quantityFor(position: Position) {
  return position.longQuantity - position.shortQuantity;
}

function formatQuantity(value: number) {
  return Number.isInteger(value)
    ? value.toLocaleString()
    : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function estimateCurrentPrice(positions: Position[]) {
  const equity = positions.find(
    (position) => position.instrument.assetType !== "OPTION",
  );
  if (!equity) return null;
  const qty = Math.abs(quantityFor(equity));
  if (!qty || !Number.isFinite(equity.marketValue)) return null;
  return Math.abs(equity.marketValue) / qty;
}

function averageCost(positions: Position[]) {
  const equity = positions.find(
    (position) => position.instrument.assetType !== "OPTION",
  );
  if (!equity) return null;
  return (
    equity.averageLongPrice ??
    equity.taxLotAverageLongPrice ??
    equity.averagePrice ??
    null
  );
}

function primaryGuidance(guidance: SymbolPositionGuidance | null | undefined) {
  if (!guidance?.hasPositions || guidance.positions.length === 0) return null;
  return [...guidance.positions].sort((a, b) => {
    const urgencyDiff = b.urgency - a.urgency;
    if (urgencyDiff !== 0) return urgencyDiff;
    return (a.relativeRiskRank ?? 99) - (b.relativeRiskRank ?? 99);
  })[0];
}

function fallbackReason(item: PositionGuidanceItem | null) {
  if (!item) return "Position guidance is loading.";
  return (
    item.primaryReason ||
    item.justification ||
    "Review the position in context."
  );
}

function headlineReason(
  symbol: string,
  positions: Position[],
  item: PositionGuidanceItem | null,
) {
  const weight = sumPortfolioWeight(positions);
  if (weight != null && weight >= 20) {
    return `${symbol} represents ${formatPct(weight)} of your portfolio and creates significant concentration risk.`;
  }
  return fallbackReason(item);
}

function concentrationSummary(positions: Position[]) {
  const weight = sumPortfolioWeight(positions);
  if (weight == null || weight < 20) return null;
  return {
    value: weight,
    text: `${formatPct(weight)} of portfolio`,
    sentence: `This position is ${formatPct(weight)} of your portfolio, so concentration risk is the deciding issue.`,
  };
}

function normalizeMessage(value: string) {
  return value
    .toLowerCase()
    .replace(/\d+(\.\d+)?%/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isConcentrationMessage(value: string | null | undefined) {
  if (!value) return false;
  return /portfolio weight|of your portfolio|represents|concentration|allocation/i.test(
    value,
  );
}

function shouldSuppressRepeat(
  value: string | null | undefined,
  headline: string,
) {
  if (!value) return true;
  if (normalizeMessage(value) === normalizeMessage(headline)) return true;
  return isConcentrationMessage(headline) && isConcentrationMessage(value);
}

function dedupeText(items: (string | null | undefined)[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const text = item?.trim();
    if (!text) continue;
    const key = normalizeMessage(text);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text);
  }
  return out;
}

function labelForCategory(driver: DedupedDriver) {
  switch (driver.category) {
    case "concentration":
      return "High concentration risk";
    case "technical":
      return "Technical conditions weakened";
    case "regime":
      return "Market regime matters";
    case "pnl_assignment":
      return "Position outcome risk";
    default:
      return "Position risk factor";
  }
}

function detailForDriver(driver: DedupedDriver) {
  const mapped = plainEnglishFromDriver(driver);
  if (mapped && mapped !== labelForCategory(driver)) return mapped;
  return driver.label;
}

function driverKey(title: string, detail?: string | null, category?: string) {
  const normalized = normalizeMessage(
    `${category ?? ""} ${title} ${detail ?? ""}`,
  );
  if (normalized.includes("concentration")) return "concentration";
  if (normalized.includes("portfolio weight")) return "concentration";
  if (normalized.includes("portfolio allocation")) return "concentration";
  if (normalized.includes("regime")) return "regime";
  if (normalized.includes("technical")) return "technical";
  if (normalized.includes("trade quality")) return "technical";
  if (normalized.includes("assignment")) return "assignment";
  if (normalized.includes("expiration")) return "technical";
  return normalized;
}

function decisionDrivers(
  symbol: string,
  positions: Position[],
  guidance: SymbolPositionGuidance | null | undefined,
  primary: PositionGuidanceItem | null,
  headline: string,
): DecisionDriver[] {
  const weight = sumPortfolioWeight(positions);
  const drivers: DecisionDriver[] = [];
  const seen = new Set<string>();

  const add = (title: string, detail?: string | null) => {
    if (shouldSuppressRepeat(title, headline) && drivers.length > 0) return;
    const key = driverKey(title, detail);
    if (seen.has(key)) return;
    seen.add(key);
    drivers.push({ title, detail, category: key });
  };

  if (weight != null && weight >= 20) {
    add("Concentration is the primary constraint", null);
  }

  const display = guidance?.positions?.length
    ? buildPositionDriverDisplay(guidance.positions)
    : new Map<string, DedupedDriver[]>();
  const primaryDrivers = primary
    ? (display.get(primary.positionKey) ?? [])
    : [];

  for (const driver of primaryDrivers) {
    if (driver.category === "concentration" && weight != null && weight >= 20) {
      continue;
    }
    add(labelForCategory(driver), detailForDriver(driver));
    if (drivers.length >= 3) break;
  }

  if (drivers.length < 3 && primary) {
    for (const item of [
      primary.primaryDriver?.detail,
      primary.secondaryDriver?.detail,
      ...primary.riskFactors,
      ...primary.supportingFactors,
    ]) {
      if (shouldSuppressRepeat(item, headline)) continue;
      add(item ?? "", null);
      if (drivers.length >= 3) break;
    }
  }

  if (!drivers.length) {
    add(`${symbol} needs review`, fallbackReason(primary));
  }

  return drivers.slice(0, 3);
}

function reviewMetrics(
  positions: Position[],
  authoritativePrice: number | null | undefined,
): ReviewMetric[] {
  const price = authoritativePrice ?? estimateCurrentPrice(positions);
  const avgCost = averageCost(positions);
  const openPL = sumOpenProfitLoss(positions);
  const costBasis = sumCostBasis(positions);
  const openPLPct = openProfitLossPct(openPL, costBasis);

  return [
    { label: "Current price", value: price != null ? formatUsd(price) : "—" },
    {
      label: "Average cost",
      value: avgCost != null ? formatUsd(avgCost) : "—",
    },
    {
      label: "Open P/L",
      value: openPL != null ? formatSignedUsd(openPL) : "—",
      tone: openPL == null ? "muted" : openPL >= 0 ? "positive" : "negative",
      note: formatSignedPct(openPLPct),
    },
  ];
}

function snapshotMetrics(positions: Position[]): ReviewMetric[] {
  const marketValue = positions.reduce(
    (sum, position) => sum + Math.abs(position.marketValue),
    0,
  );
  const costBasis = sumCostBasis(positions);
  const openPL = sumOpenProfitLoss(positions);
  const openPLPct = openProfitLossPct(openPL, costBasis);

  return [
    { label: "Market value", value: formatUsd(marketValue) },
    {
      label: "Cost basis",
      value: costBasis != null ? formatUsd(costBasis) : "—",
    },
    {
      label: "P/L",
      value: openPL != null ? formatSignedUsd(openPL) : "—",
      tone: openPL == null ? "muted" : openPL >= 0 ? "positive" : "negative",
      note: formatSignedPct(openPLPct),
    },
  ];
}

function optionContractDetail(position: Position) {
  const { instrument } = position;
  const parts = [
    instrument.strikePrice != null
      ? `${formatUsd(instrument.strikePrice)} strike`
      : null,
    instrument.expirationDate
      ? formatOptionExpiration(instrument.expirationDate)
      : null,
  ];
  return parts.filter((part): part is string => !!part).join(" · ") || null;
}

function compositionItems(positions: Position[]): CompositionItem[] {
  return positions.map((position) => {
    const quantity = quantityFor(position);
    const absQuantity = Math.abs(quantity);
    const openPL =
      position.openProfitLoss ??
      position.longOpenProfitLoss ??
      position.shortOpenProfitLoss ??
      null;
    const context = [
      Number.isFinite(position.marketValue)
        ? `${formatUsd(Math.abs(position.marketValue))} value`
        : null,
      openPL != null ? `${formatSignedUsd(openPL)} open P/L` : null,
    ]
      .filter((part): part is string => !!part)
      .join(" · ");

    if (position.instrument.assetType === "OPTION") {
      const label =
        optionStrategyLabel(position, positions) ??
        (position.longQuantity > 0 ? "Option owned" : "Option sold");
      const side = position.shortQuantity > 0 ? "Short" : "Long";
      return {
        title: label,
        quantity: `${side} ${formatQuantity(absQuantity)} ${absQuantity === 1 ? "contract" : "contracts"}`,
        detail: optionContractDetail(position),
        context: context || null,
      };
    }

    const assetLabel =
      position.instrument.assetType === "ETF" ? "ETF shares" : "Equity shares";
    const direction = quantity < 0 ? "Short" : "Long";
    return {
      title: assetLabel,
      quantity: `${direction} ${formatQuantity(absQuantity)} ${absQuantity === 1 ? "share" : "shares"}`,
      detail: position.instrument.description ?? position.instrument.symbol,
      context: context || null,
    };
  });
}

function changeTriggers(
  positions: Position[],
  primary: PositionGuidanceItem | null,
  guidance: SymbolPositionGuidance | null | undefined,
  headline: string,
) {
  const weight = sumPortfolioWeight(positions);
  const triggers: string[] = [];
  if (weight != null && weight >= 20) {
    triggers.push("Position size falls below your concentration threshold");
  }

  const hasTechnical = primary?.scoringContributors?.some(
    (item) => driverCategory(item) === "technical",
  );
  const hasRegime =
    primary?.scoringContributors?.some(
      (item) => driverCategory(item) === "regime",
    ) || guidance?.thesis?.regimeId;

  if (hasTechnical) triggers.push("Technical score improves");
  if (hasRegime) triggers.push("Market regime strengthens");

  for (const item of [
    ...(primary?.supportingFactors ?? []),
    ...(primary?.riskFactors ?? []),
  ]) {
    if (shouldSuppressRepeat(item, headline)) continue;
    triggers.push(item);
    if (triggers.length >= 3) break;
  }

  if (!triggers.length) {
    triggers.push(
      "Price action, setup quality, or portfolio risk materially changes",
    );
  }

  return dedupeText(triggers).slice(0, 3);
}

function positionRiskScore(
  positions: Position[],
  primary: PositionGuidanceItem | null,
) {
  const weight = sumPortfolioWeight(positions);
  const concentrationRisk =
    weight == null
      ? 0
      : weight >= 50
        ? 35
        : weight >= 30
          ? 25
          : weight >= 20
            ? 15
            : 0;
  const urgency = primary?.urgency ?? 0;
  return Math.max(
    0,
    Math.min(100, Math.round(urgency * 0.65 + concentrationRisk)),
  );
}

function riskLabel(score: number) {
  if (score >= 75) return "Very high risk";
  if (score >= 55) return "High risk";
  if (score >= 30) return "Moderate risk";
  return "Low risk";
}

function heroRationale(
  symbol: string,
  positions: Position[],
  guidance: SymbolPositionGuidance | null | undefined,
  primary: PositionGuidanceItem | null,
  drivers: DecisionDriver[],
) {
  const concentration = concentrationSummary(positions);
  const parts = [
    concentration?.sentence ?? headlineReason(symbol, positions, primary),
    primary?.urgency != null
      ? `${urgencyQualitativeLabel(primary.urgency)} based on the current position model.`
      : null,
    guidance?.thesis?.summary &&
    !isConcentrationMessage(guidance.thesis.summary)
      ? guidance.thesis.summary
      : null,
    ...drivers
      .filter((driver) => driver.category !== "concentration")
      .slice(0, 2)
      .map((driver) => driver.detail ?? driver.title),
  ];
  return dedupeText(parts).slice(0, 4);
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
      {title}
    </h2>
  );
}

function MetricStrip({ metrics }: { metrics: ReviewMetric[] }) {
  return (
    <div className="grid gap-x-6 gap-y-4 sm:grid-cols-3">
      {metrics.map((metric) => (
        <div key={metric.label} className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            {metric.label}
          </p>
          <p
            className={cn(
              "mt-1 truncate text-base font-semibold tabular-nums",
              metricToneClass(metric.tone),
            )}
          >
            {metric.value}
          </p>
          {metric.note ? (
            <p className="mt-0.5 text-xs text-muted">{metric.note}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function PositionReviewHero({
  symbol,
  positions,
  guidance,
  loading,
  drivers,
  currentPrice,
}: {
  symbol: string;
  positions: Position[];
  guidance: SymbolPositionGuidance | null | undefined;
  loading: boolean;
  drivers: DecisionDriver[];
  currentPrice?: number | null;
}) {
  const primary = primaryGuidance(guidance);
  const verdict = primary ? VERDICT_LABEL[primary.verdict] : "Review";
  const riskScore = positionRiskScore(positions, primary);
  const rationale = heroRationale(
    symbol,
    positions,
    guidance,
    primary,
    drivers,
  );

  return (
    <section className="border-b border-border/60 pb-8">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_12rem]">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-mono text-sm font-semibold text-foreground">
              {symbol}
            </p>
            <span
              className={cn(
                "inline-flex items-center border px-2 py-0.5 text-[11px] font-semibold",
                verdictTone(primary?.verdict),
              )}
            >
              {loading && !guidance ? "Loading" : verdict}
            </span>
          </div>

          {loading && !guidance ? (
            <div className="mt-5 space-y-2">
              <Skeleton className="h-5 w-full max-w-2xl" />
              <Skeleton className="h-5 w-full max-w-xl" />
            </div>
          ) : (
            <div className="mt-5 max-w-3xl space-y-3 text-lg leading-relaxed text-foreground">
              {rationale.map((item, index) => (
                <p
                  key={item}
                  className={
                    index === 0 ? "font-medium" : "text-base text-muted"
                  }
                >
                  {item}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="self-start border-l border-border/60 pl-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Position risk
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-foreground">
            {riskScore}
          </p>
          <p className="mt-1 text-sm text-muted">{riskLabel(riskScore)}</p>
        </div>
      </div>

      <div className="mt-8">
        <MetricStrip metrics={reviewMetrics(positions, currentPrice)} />
      </div>
    </section>
  );
}

function DecisionDriversSection({ drivers }: { drivers: DecisionDriver[] }) {
  return (
    <section className="border-b border-border/60 py-7">
      <SectionHeader title="Decision drivers" />
      <ol className="mt-5 space-y-4">
        {drivers.map((driver, index) => (
          <li
            key={`${driver.title}-${driver.detail ?? "driver"}`}
            className="grid gap-3 sm:grid-cols-[3rem_1fr]"
          >
            <span className="font-mono text-xs font-semibold text-muted">
              #{index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-base font-semibold text-foreground">
                {driver.title}
              </p>
              {driver.detail ? (
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {driver.detail}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function SnapshotSection({ metrics }: { metrics: ReviewMetric[] }) {
  return (
    <section className="border-b border-border/60 py-7">
      <SectionHeader title="Position snapshot" />
      <div className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              {metric.label}
            </p>
            <p
              className={cn(
                "mt-1 truncate text-sm font-semibold tabular-nums",
                metricToneClass(metric.tone),
              )}
            >
              {metric.value}
            </p>
            {metric.note ? (
              <p className="mt-0.5 text-xs text-muted">{metric.note}</p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function PositionCompositionSection({ items }: { items: CompositionItem[] }) {
  if (!items.length) return null;

  return (
    <section className="border-b border-border/60 py-7">
      <SectionHeader title="Position composition" />
      <div className="mt-5 divide-y divide-border/60">
        {items.map((item) => (
          <div
            key={`${item.title}-${item.quantity}-${item.detail ?? ""}`}
            className="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {item.title}
              </p>
              <p className="mt-1 text-sm text-muted">{item.quantity}</p>
            </div>
            <div className="min-w-0 text-sm leading-relaxed text-muted sm:text-right">
              {item.detail ? <p>{item.detail}</p> : null}
              {item.context ? <p>{item.context}</p> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function WhatChangesSection({ triggers }: { triggers: string[] }) {
  return (
    <section className="border-b border-border/60 py-7">
      <SectionHeader title="What changes the decision" />
      <ul className="mt-4 space-y-2 text-sm leading-relaxed text-foreground">
        {triggers.map((trigger) => (
          <li key={trigger} className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-muted" aria-hidden />
            <span>{trigger}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PositionEmptyState({ symbol }: { symbol: string }) {
  return (
    <div className={cn(appStackClass, "w-full max-w-none")}>
      <EmptyState
        icon={BriefcaseBusiness}
        title="No active position"
        description={`No linked Schwab position is currently open for ${symbol}.`}
        variant="solid"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href={symbolHubPath(symbol, "overview")}
          className={cn(
            appPanelSubtleClass,
            "px-4 py-3 text-sm transition hover:bg-muted-bg",
          )}
        >
          <p className="font-semibold text-foreground">Review research</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Check the company setup, key levels, and current context.
          </p>
        </Link>
        <Link
          href={symbolHubPath(symbol, "analysis")}
          className={cn(
            appPanelSubtleClass,
            "px-4 py-3 text-sm transition hover:bg-muted-bg",
          )}
        >
          <p className="font-semibold text-foreground">Check setup</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Review signals, risks, and pattern context before acting.
          </p>
        </Link>
      </div>
    </div>
  );
}

export function SymbolPositionContent({ symbol }: Props) {
  const { error, positionMap } = usePortfolioContext();
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const symbolUpper = symbol.toUpperCase();
  const { snapshot } = useResearchSymbolHeader();

  const intelligence = useResearchSymbolIntelligence()?.intelligence ?? null;
  const {
    guidance,
    isLoading: guidanceLoading,
    error: guidanceError,
  } = usePositionGuidance(symbolUpper, { accessToken });
  const positionsForSelectedSymbol = positionMap[symbolUpper] ?? null;
  const positions = positionsForSelectedSymbol ?? [];
  const hasPosition = positions.length > 0;
  const showOptionsPrompt = shouldShowOptionsTab(
    positionsForSelectedSymbol,
    intelligence,
  );
  const primary = useMemo(() => primaryGuidance(guidance), [guidance]);
  const headline = useMemo(
    () => headlineReason(symbolUpper, positions, primary),
    [symbolUpper, positions, primary],
  );
  const drivers = useMemo(
    () => decisionDrivers(symbolUpper, positions, guidance, primary, headline),
    [symbolUpper, positions, guidance, primary, headline],
  );
  const triggers = useMemo(
    () => changeTriggers(positions, primary, guidance, headline),
    [positions, primary, guidance, headline],
  );
  const metrics = useMemo(() => snapshotMetrics(positions), [positions]);
  const composition = useMemo(() => compositionItems(positions), [positions]);

  if (!hasPosition) {
    return <PositionEmptyState symbol={symbolUpper} />;
  }

  return (
    <div className="w-full max-w-none">
      {error && <ErrorBanner message={error} />}
      {guidanceError && !guidance ? (
        <div className="mb-6">
          <ErrorBanner message={guidanceError} />
        </div>
      ) : null}

      <PositionReviewHero
        symbol={symbolUpper}
        positions={positions}
        guidance={guidance}
        loading={guidanceLoading}
        drivers={drivers}
        currentPrice={snapshot?.price}
      />

      <DecisionDriversSection drivers={drivers} />
      <SnapshotSection metrics={metrics} />
      <PositionCompositionSection items={composition} />
      <WhatChangesSection triggers={triggers} />

      {showOptionsPrompt ? (
        <div className="border-b border-border/60 py-7">
          <OptionsTabPrompt
            symbol={symbolUpper}
            className="w-full max-w-none"
          />
        </div>
      ) : null}

      {accessToken ? (
        <RecentActivitySection
          className="py-7"
          accessToken={accessToken}
          symbol={symbolUpper}
          hideSuggestedActions
          variant="position"
        />
      ) : null}
    </div>
  );
}
