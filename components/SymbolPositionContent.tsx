"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSession } from "next-auth/react";
import { Activity, BriefcaseBusiness, ShieldCheck, Target } from "lucide-react";
import { usePortfolioContext } from "@/app/contextSelectors";
import { usePositionGuidance } from "@/app/hooks/usePositionGuidance";
import { useResearchSymbolIntelligence } from "@/app/research/[symbol]/ResearchSymbolIntelligenceContext";
import type {
  PositionGuidanceItem,
  PositionVerdict,
  SymbolPositionGuidance,
} from "@/app/types/positionGuidance";
import type { Position } from "@/app/types/schwab";
import { SymbolLegsTable } from "@/components/analysis/analysisPanelHoldings";
import { OptionsTabPrompt } from "@/components/OptionsTabPrompt";
import { RecentActivitySection } from "@/components/RecentActivitySection";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { appPanelSubtleClass, appStackClass } from "@/lib/appUi";
import { formatSignedUsd, formatUsd } from "@/lib/formatCurrency";
import {
  buildPositionDriverDisplay,
  contributorScoringLabel,
  driverCategory,
} from "@/lib/guidanceScoringContributors";
import {
  buildPositionPlainEnglish,
  formatSymbolThesisPlainEnglish,
  urgencyQualitativeLabel,
} from "@/lib/guidancePlainEnglish";
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

type PositionMetric = {
  label: string;
  value: string;
  tone?: "positive" | "negative" | "muted";
  note?: string | null;
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
      return "border-warning/25 bg-warning-muted text-warning";
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

function metricToneClass(tone: PositionMetric["tone"]) {
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

function sameMessage(
  a: string | null | undefined,
  b: string | null | undefined,
) {
  if (!a || !b) return false;
  return (
    a
      .toLowerCase()
      .replace(/\d+(\.\d+)?%/g, "")
      .replace(/\s+/g, " ")
      .trim() ===
    b
      .toLowerCase()
      .replace(/\d+(\.\d+)?%/g, "")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function isConcentrationMessage(value: string | null | undefined) {
  if (!value) return false;
  return /portfolio weight|of your portfolio|concentration|allocation/i.test(
    value,
  );
}

function shouldSuppressRepeat(
  value: string | null | undefined,
  summaryReason: string,
) {
  if (!value) return true;
  if (sameMessage(value, summaryReason)) return true;
  return isConcentrationMessage(summaryReason) && isConcentrationMessage(value);
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

function guidanceReason(item: PositionGuidanceItem | null) {
  if (!item) return "Position guidance is loading.";
  return (
    item.primaryReason ||
    item.justification ||
    "Review the position in context."
  );
}

function heroReason(
  symbol: string,
  positions: Position[],
  item: PositionGuidanceItem | null,
) {
  const weight = sumPortfolioWeight(positions);
  if (weight != null && weight >= 20) {
    return `${symbol} is ${formatPct(weight)} of your portfolio.`;
  }
  return guidanceReason(item);
}

function guidanceCopy(guidance: SymbolPositionGuidance | null | undefined) {
  if (!guidance?.hasPositions || guidance.positions.length === 0)
    return new Map();
  const drivers = buildPositionDriverDisplay(guidance.positions);
  const map = new Map<string, ReturnType<typeof buildPositionPlainEnglish>>();
  for (const item of guidance.positions) {
    map.set(
      item.positionKey,
      buildPositionPlainEnglish(item, drivers.get(item.positionKey) ?? []),
    );
  }
  return map;
}

function buildMetrics(positions: Position[]): PositionMetric[] {
  const marketValue = positions.reduce(
    (sum, position) => sum + Math.abs(position.marketValue),
    0,
  );
  const costBasis = sumCostBasis(positions);
  const openPL = sumOpenProfitLoss(positions);
  const openPLPct = openProfitLossPct(openPL, costBasis);
  const weightPct = sumPortfolioWeight(positions);
  const dayPL = positions.reduce(
    (sum, position) => sum + position.currentDayProfitLoss,
    0,
  );
  const equityShares = positions
    .filter((position) => position.instrument.assetType !== "OPTION")
    .reduce((sum, position) => sum + quantityFor(position), 0);
  const optionContracts = positions
    .filter((position) => position.instrument.assetType === "OPTION")
    .reduce((sum, position) => sum + Math.abs(quantityFor(position)), 0);

  return [
    {
      label: optionContracts > 0 ? "Shares / contracts" : "Shares",
      value:
        optionContracts > 0
          ? `${formatQuantity(equityShares)} / ${formatQuantity(optionContracts)}`
          : formatQuantity(equityShares),
      note: optionContracts > 0 ? "Equity / options" : null,
    },
    { label: "Market value", value: formatUsd(marketValue) },
    {
      label: "Cost basis",
      value: costBasis != null ? formatUsd(costBasis) : "—",
    },
    {
      label: "Unrealized P/L",
      value: openPL != null ? formatSignedUsd(openPL) : "—",
      tone: openPL == null ? "muted" : openPL >= 0 ? "positive" : "negative",
      note: formatSignedPct(openPLPct),
    },
    { label: "Allocation", value: formatPct(weightPct) },
    {
      label: "Today",
      value: formatSignedUsd(dayPL),
      tone: dayPL >= 0 ? "positive" : "negative",
    },
  ];
}

function PositionMetricGrid({ metrics }: { metrics: PositionMetric[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {metrics.map((metric) => (
        <div key={metric.label} className="min-w-0 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            {metric.label}
          </p>
          <p
            className={cn(
              "mt-1 truncate text-lg font-semibold tabular-nums",
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

function PositionSummaryCard({
  symbol,
  positions,
  guidance,
  loading,
}: {
  symbol: string;
  positions: Position[];
  guidance: SymbolPositionGuidance | null | undefined;
  loading: boolean;
}) {
  const primary = primaryGuidance(guidance);
  const price = estimateCurrentPrice(positions);
  const avgCost = averageCost(positions);
  const openPL = sumOpenProfitLoss(positions);
  const costBasis = sumCostBasis(positions);
  const openPLPct = openProfitLossPct(openPL, costBasis);
  const verdict = primary ? VERDICT_LABEL[primary.verdict] : "Review";
  const reason = heroReason(symbol, positions, primary);

  return (
    <section className={cn(appPanelSubtleClass, "overflow-hidden")}>
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(17rem,0.55fr)]">
        <div className="min-w-0">
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
          <h2 className="mt-4 text-2xl font-semibold tracking-normal text-foreground">
            {verdict}
          </h2>
          {loading && !guidance ? (
            <div className="mt-3 space-y-2">
              <Skeleton className="h-4 w-full max-w-xl" />
              <Skeleton className="h-4 w-full max-w-md" />
            </div>
          ) : (
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-foreground">
              {reason}
            </p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <MiniMetric
            label="Current"
            value={price != null ? formatUsd(price) : "—"}
          />
          <MiniMetric
            label="Avg cost"
            value={avgCost != null ? formatUsd(avgCost) : "—"}
          />
          <MiniMetric
            label="Open P/L"
            value={openPL != null ? formatSignedUsd(openPL) : "—"}
            tone={
              openPL == null ? "muted" : openPL >= 0 ? "positive" : "negative"
            }
            note={formatSignedPct(openPLPct)}
          />
        </div>
      </div>
    </section>
  );
}

function MiniMetric({
  label,
  value,
  tone,
  note,
}: {
  label: string;
  value: string;
  tone?: PositionMetric["tone"];
  note?: string | null;
}) {
  return (
    <div className="min-w-0 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 truncate text-sm font-semibold tabular-nums",
          metricToneClass(tone),
        )}
      >
        {value}
      </p>
      {note ? <p className="text-[11px] text-muted">{note}</p> : null}
    </div>
  );
}

function PositionRiskCard({
  positions,
  primary,
  summaryReason,
}: {
  positions: Position[];
  primary: PositionGuidanceItem | null;
  summaryReason: string;
}) {
  const weight = sumPortfolioWeight(positions);
  const hasOptions = positions.some(
    (position) => position.instrument.assetType === "OPTION",
  );
  const concentration =
    weight == null
      ? "Allocation unavailable"
      : weight >= 30
        ? "High concentration"
        : weight >= 20
          ? "Elevated concentration"
          : "Position size looks contained";
  const optionRisk = hasOptions
    ? "Options are part of this position; watch expiration, moneyness, and assignment or decay risk."
    : "No option legs detected for this symbol.";
  const riskFactors = primary?.riskFactors?.filter(Boolean).slice(0, 2) ?? [];
  const riskNote = riskFactors.find(
    (item) => !shouldSuppressRepeat(item, summaryReason),
  );

  return (
    <ResearchSectionCard title="Risk checks" icon={ShieldCheck}>
      <div className="grid gap-3 md:grid-cols-3">
        <RiskCheck
          label="Allocation"
          value={formatPct(weight)}
          note={concentration}
        />
        <RiskCheck
          label="Options"
          value={hasOptions ? "Options exposure" : "Equity only"}
          note={optionRisk}
        />
        <RiskCheck
          label="Urgency"
          value={primary ? urgencyQualitativeLabel(primary.urgency) : "Pending"}
          note={riskNote}
        />
      </div>
    </ResearchSectionCard>
  );
}

function RiskCheck({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string | null;
}) {
  return (
    <div className="min-w-0 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
      {note ? (
        <p className="mt-1 text-xs leading-relaxed text-muted">{note}</p>
      ) : null}
    </div>
  );
}

function PositionNextActionCard({
  guidance,
  primary,
  loading,
  error,
  summaryReason,
}: {
  guidance: SymbolPositionGuidance | null | undefined;
  primary: PositionGuidanceItem | null;
  loading: boolean;
  error: string | null | undefined;
  summaryReason: string;
}) {
  const copy = useMemo(() => guidanceCopy(guidance), [guidance]);
  const primaryCopy = primary ? copy.get(primary.positionKey) : null;
  const thesis = guidance?.thesis;
  const hasRegime = !!primary?.scoringContributors?.some(
    (item) => driverCategory(item) === "regime",
  );
  const hasTradeQuality = !!primary?.scoringContributors?.some((item) =>
    contributorScoringLabel(item).toLowerCase().includes("trade quality"),
  );
  const watchItems =
    primary?.supportingFactors?.filter(Boolean).slice(0, 2) ??
    primaryCopy?.supportingPoints.slice(0, 2) ??
    [];
  const nextReason =
    primaryCopy?.mainReason &&
    !shouldSuppressRepeat(primaryCopy.mainReason, summaryReason)
      ? primaryCopy.mainReason
      : null;
  const whyItems = [
    primary?.primaryDriver?.detail,
    ...(primaryCopy?.supportingPoints ?? []),
  ].filter((item) => !shouldSuppressRepeat(item, summaryReason));

  return (
    <ResearchSectionCard title="Next step" icon={Target}>
      {loading && !guidance ? (
        <div className="space-y-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-full max-w-xl" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
      ) : error && !guidance ? (
        <ErrorBanner message={error} />
      ) : primary ? (
        <div className="space-y-5 mt-3">
          <div>
            <p
              className={cn(
                "inline-flex border px-2.5 py-1 text-sm font-semibold",
                verdictTone(primary.verdict),
              )}
            >
              {VERDICT_LABEL[primary.verdict]}
            </p>
            {nextReason ? (
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-foreground">
                {nextReason}
              </p>
            ) : null}
            {thesis ? (
              <p className="mt-2 max-w-3xl text-xs leading-relaxed text-muted">
                {formatSymbolThesisPlainEnglish(thesis, {
                  hasRegimeInPositions: hasRegime,
                  hasTradeQualityInPositions: hasTradeQuality,
                })}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <ActionList title="Why" items={whyItems} />
            <ActionList
              title="What to watch"
              items={
                watchItems.length
                  ? watchItems
                  : ["Watch price action, earnings/news flow, and risk level."]
              }
            />
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted">
          No open position guidance is available.
        </p>
      )}
    </ResearchSectionCard>
  );
}

function ActionList({
  title,
  items,
  className,
}: {
  title: string;
  items: (string | null | undefined)[];
  className?: string;
}) {
  const filtered = items.filter((item): item is string => !!item).slice(0, 3);
  if (!filtered.length) return null;

  return (
    <div className={className}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
        {title}
      </p>
      <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-foreground">
        {filtered.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-muted" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PositionDetailsSection({ positions }: { positions: Position[] }) {
  const equityShares = positions
    .filter((position) => position.instrument.assetType !== "OPTION")
    .reduce((sum, position) => sum + quantityFor(position), 0);
  const optionContracts = positions
    .filter((position) => position.instrument.assetType === "OPTION")
    .reduce((sum, position) => sum + Math.abs(quantityFor(position)), 0);
  const hasOptions = optionContracts > 0;
  const summary = hasOptions
    ? `${formatQuantity(equityShares)} shares · ${formatQuantity(optionContracts)} option contracts`
    : `${formatQuantity(equityShares)} shares · no active option legs`;

  return (
    <ResearchSectionCard title="Position details" icon={Activity}>
      <p className="text-sm font-medium text-foreground">{summary}</p>
      {hasOptions ? (
        <div className="mt-4 overflow-hidden">
          <SymbolLegsTable positions={positions} />
        </div>
      ) : null}
    </ResearchSectionCard>
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

  const intelligence = useResearchSymbolIntelligence()?.intelligence ?? null;
  const {
    guidance,
    isLoading: guidanceLoading,
    error: guidanceError,
  } = usePositionGuidance(symbolUpper, { accessToken });
  const positionsForSelectedSymbol = positionMap[symbolUpper] ?? null;
  const hasPosition = (positionsForSelectedSymbol?.length ?? 0) > 0;
  const showOptionsPrompt = shouldShowOptionsTab(
    positionsForSelectedSymbol,
    intelligence,
  );

  const metrics = useMemo(
    () => buildMetrics(positionsForSelectedSymbol ?? []),
    [positionsForSelectedSymbol],
  );
  const primary = useMemo(() => primaryGuidance(guidance), [guidance]);
  const summaryReason = useMemo(
    () => heroReason(symbolUpper, positionsForSelectedSymbol ?? [], primary),
    [symbolUpper, positionsForSelectedSymbol, primary],
  );

  if (!hasPosition) {
    return <PositionEmptyState symbol={symbolUpper} />;
  }

  return (
    <div className={cn(appStackClass, "w-full max-w-none")}>
      {error && <ErrorBanner message={error} />}

      <PositionSummaryCard
        symbol={symbolUpper}
        positions={positionsForSelectedSymbol ?? []}
        guidance={guidance}
        loading={guidanceLoading}
      />

      <ResearchSectionCard title="Position snapshot" icon={BriefcaseBusiness}>
        <PositionMetricGrid metrics={metrics} />
      </ResearchSectionCard>

      <PositionRiskCard
        positions={positionsForSelectedSymbol ?? []}
        primary={primary}
        summaryReason={summaryReason}
      />

      <PositionNextActionCard
        guidance={guidance}
        primary={primary}
        loading={guidanceLoading}
        error={guidanceError}
        summaryReason={summaryReason}
      />

      {showOptionsPrompt && (
        <OptionsTabPrompt symbol={symbolUpper} className="w-full max-w-none" />
      )}

      {accessToken && (
        <RecentActivitySection
          className="w-full max-w-none"
          accessToken={accessToken}
          symbol={symbolUpper}
          hideSuggestedActions
          variant="position"
        />
      )}

      <PositionDetailsSection positions={positionsForSelectedSymbol ?? []} />
    </div>
  );
}
