"use client";

import { useEffect, useState, type MouseEvent } from "react";
import type {
  AnnualDividendIncome,
  DividendAdvancedSnowballScenario,
  DividendHistoryContext,
  DividendPaymentItem,
  DividendScenarioParams,
} from "@/app/types/research";
import { DIVIDEND_PROJECTION_YEAR_PRESETS } from "@/app/types/research";
import { formatUsd } from "@/lib/formatCurrency";
import {
  dividendProjectionWindow,
  resolveCurrentYieldPct,
  resolveSnowballAdvancedMetrics,
  resolveSnowballPriceCagrPct,
} from "@/lib/dividendHistory";
import { formatExpenseRatio } from "@/lib/etfHoldings";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";

const BAR_FILL = "#34d399";
const BAR_FILL_PARTIAL = "#6ee7b7";
const LINE_STROKE = "#34d399";
const GRID_STROKE = "currentColor";

function formatPct(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(1)}%`;
}

function formatPerShare(value: number): string {
  if (value === 0) return "$0";
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.1) return `$${value.toFixed(3)}`;
  return `$${value.toFixed(4)}`;
}

function formatSnowballShares(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function roundSnowball(value: number): number {
  return Math.round(value * 100) / 100;
}

type SnowballNumericInputProps = {
  value: number | null | undefined;
  onCommit: (value: number) => void;
  onClear?: () => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
};

function SnowballNumericInput({
  value,
  onCommit,
  onClear,
  min,
  max,
  step,
  className,
}: SnowballNumericInputProps) {
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (isFocused) return;
    setText(value != null && value > 0 ? String(roundSnowball(value)) : "");
  }, [value, isFocused]);

  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={text}
      onFocus={() => setIsFocused(true)}
      onBlur={() => {
        setIsFocused(false);
        const trimmed = text.trim();
        if (trimmed === "") {
          onClear?.();
          setText("");
          return;
        }
        const next = Number(trimmed);
        if (Number.isFinite(next) && next > 0) {
          onCommit(next);
          setText(String(roundSnowball(next)));
          return;
        }
        setText(value != null && value > 0 ? String(roundSnowball(value)) : "");
      }}
      onChange={(event) => {
        const nextText = event.target.value;
        setText(nextText);
        const trimmed = nextText.trim();
        if (trimmed === "") return;
        const next = Number(trimmed);
        if (Number.isFinite(next) && next > 0) {
          onCommit(next);
        }
      }}
      className={className}
    />
  );
}

type SnowballInputSource = "investment" | "shares";

function buildScenarioParams(
  base: DividendScenarioParams | undefined,
  source: SnowballInputSource,
  values: {
    investmentUsd?: number | null;
    sharePrice?: number | null;
    shares?: number | null;
    projectYears?: number | null;
    dividendCagrPct?: number | null;
    reinvestDividends?: boolean;
    priceCagrPct?: number | null;
    annualContributionUsd?: number | null;
  },
): DividendScenarioParams {
  const sharePrice = values.sharePrice ?? base?.sharePrice ?? null;
  const reinvestDividends =
    values.reinvestDividends ?? base?.reinvestDividends ?? false;
  const priceCagrPct = values.priceCagrPct ?? base?.priceCagrPct ?? null;
  const projectYears = values.projectYears ?? base?.projectYears ?? 10;
  const dividendCagrPct =
    values.dividendCagrPct ?? base?.dividendCagrPct ?? null;
  const annualContributionUsd =
    values.annualContributionUsd ?? base?.annualContributionUsd ?? null;

  if (sharePrice != null && sharePrice > 0) {
    if (source === "shares" && values.shares != null && values.shares > 0) {
      const shares = roundSnowball(values.shares);
      return {
        investmentUsd: roundSnowball(shares * sharePrice),
        sharePrice: roundSnowball(sharePrice),
        shares,
        projectYears,
        dividendCagrPct,
        reinvestDividends,
        priceCagrPct,
        annualContributionUsd,
      };
    }

    if (values.investmentUsd != null && values.investmentUsd > 0) {
      const investmentUsd = roundSnowball(values.investmentUsd);
      return {
        investmentUsd,
        sharePrice: roundSnowball(sharePrice),
        shares: roundSnowball(investmentUsd / sharePrice),
        projectYears,
        dividendCagrPct,
        reinvestDividends,
        priceCagrPct,
        annualContributionUsd,
      };
    }
  }

  return {
    investmentUsd: values.investmentUsd ?? base?.investmentUsd ?? null,
    sharePrice,
    shares: values.shares ?? base?.shares ?? null,
    projectYears,
    dividendCagrPct,
    reinvestDividends,
    priceCagrPct,
    annualContributionUsd,
  };
}

function mergeScenarioParams(
  base: DividendScenarioParams | undefined,
  next: Partial<DividendScenarioParams>,
): DividendScenarioParams {
  return {
    investmentUsd: next.investmentUsd ?? base?.investmentUsd ?? null,
    sharePrice: next.sharePrice ?? base?.sharePrice ?? null,
    shares: next.shares ?? base?.shares ?? null,
    projectYears: next.projectYears ?? base?.projectYears ?? 10,
    dividendCagrPct: next.dividendCagrPct ?? base?.dividendCagrPct ?? null,
    reinvestDividends:
      next.reinvestDividends ?? base?.reinvestDividends ?? false,
    priceCagrPct: next.priceCagrPct ?? base?.priceCagrPct ?? null,
    annualContributionUsd:
      next.annualContributionUsd ?? base?.annualContributionUsd ?? null,
  };
}

function formatDate(value: string): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatAxisYear(value: string): string {
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value.slice(0, 4);
  return String(parsed.getFullYear());
}

const DEFAULT_PADDING = {
  top: 16,
  right: 12,
  bottom: 32,
  left: 48,
};

function buildYTicks(maxValue: number, tickCount = 4): number[] {
  if (maxValue <= 0) return [0];
  const step = maxValue / tickCount;
  return Array.from({ length: tickCount + 1 }, (_, index) =>
    Number((step * index).toFixed(4)),
  );
}

function nearestSeriesIndex(
  pointerX: number,
  paddingLeft: number,
  plotWidth: number,
  pointCount: number,
): number {
  if (pointCount <= 0) return 0;
  if (pointCount === 1) return 0;

  const step = plotWidth / (pointCount - 1);
  const relativeX = Math.max(0, Math.min(plotWidth, pointerX - paddingLeft));
  return Math.round(relativeX / step);
}

function svgPointerX(event: MouseEvent<SVGElement>): number | null {
  const svg = event.currentTarget.ownerSVGElement;
  if (!svg) return null;

  const ctm = svg.getScreenCTM();
  if (!ctm) return null;

  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  return point.matrixTransform(ctm.inverse()).x;
}

type ChartHoverReadoutProps = {
  label: string;
  value: string;
  sublabel?: string | null;
  highlighted?: boolean;
};

function ChartHoverReadout({
  label,
  value,
  sublabel,
  highlighted = false,
}: ChartHoverReadoutProps) {
  return (
    <div className="mb-2 h-14 shrink-0" aria-live="polite">
      <div
        className={cn(
          "flex h-full items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-colors duration-150",
          highlighted
            ? "border-border/70 bg-surface-elevated/50"
            : "border-border/40 bg-surface-elevated/25",
        )}
      >
        <div className="min-w-0">
          <p className="truncate text-xs text-muted">{label}</p>
          {sublabel ? (
            <p className="truncate text-[10px] text-muted">{sublabel}</p>
          ) : null}
        </div>
        <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}

type StatProps = {
  label: string;
  value: string;
  hint?: string;
};

function StatCard({ label, value, hint }: StatProps) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-surface-elevated/40 px-3 py-2.5">
      <p className="min-h-10 text-[11px] font-medium uppercase leading-snug tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 min-h-7 text-lg font-semibold tabular-nums leading-none text-foreground">
        {value}
      </p>
      <p className="mt-2 min-h-11 text-[11px] leading-snug text-muted">
        {hint ?? ""}
      </p>
    </div>
  );
}

function formatYieldPct(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(2)}%`;
}

export function DividendSnowballStats({
  history,
  sharePrice,
  isEtf = false,
  expenseRatio,
}: {
  history: DividendHistoryContext;
  sharePrice?: number | null;
  isEtf?: boolean;
  expenseRatio?: string | null;
}) {
  const { scenario } = history;
  const { currentYear, endYear, projectYears } = dividendProjectionWindow(
    scenario.projectYears,
  );
  const currentYieldPct = resolveCurrentYieldPct(history, sharePrice);
  const priceGrowthPct =
    history.priceCagrPct ?? history.scenario.advanced?.priceCagrPct ?? null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 items-stretch gap-2 sm:grid-cols-3">
        <StatCard
          label="Dividend streak"
          value={
            history.consecutiveAnnualIncreases > 0
              ? `${history.consecutiveAnnualIncreases} yrs`
              : "—"
          }
          hint="Years in a row the annual dividend per share increased"
        />
        <StatCard
          label="Current yield"
          value={formatYieldPct(currentYieldPct)}
          hint="Latest annual dividend per share ÷ your share price"
        />
        {isEtf ? (
          <StatCard
            label="Expense ratio"
            value={formatExpenseRatio(expenseRatio) ?? "—"}
            hint="Annual fund fee deducted from ETF returns"
          />
        ) : null}
        <StatCard
          label="5Y dividend CAGR"
          value={formatPct(history.cagr5yPct)}
          hint="Average annual dividend growth, completed years"
        />
        <StatCard
          label="5Y price growth"
          value={formatPct(priceGrowthPct)}
          hint="Average annual share price growth, applied automatically"
        />
        <StatCard
          label={`${projectYears}-year total`}
          value={formatUsd(scenario.totalCollected, {
            maximumFractionDigits: 0,
          })}
          hint={`Estimated dividend cash collected ${currentYear}–${endYear}`}
        />
      </div>
      <p className="text-xs leading-relaxed text-muted">
        Projections combine historic dividend growth (5Y CAGR when available),{" "}
        {priceGrowthPct != null ? `${priceGrowthPct.toFixed(1)}%` : "estimated"}{" "}
        annual price growth, and your share count. Portfolio value also reflects
        price growth; enable DRIP below to reinvest dividends into more shares.
        Past growth rates are not guaranteed to continue.
      </p>
    </div>
  );
}

export function DividendAnnualTotalsChart({
  rows,
  limit = 15,
}: {
  rows: AnnualDividendIncome[];
  limit?: number;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const chartRows = rows.slice(-limit);
  if (chartRows.length === 0) {
    return (
      <p className="text-sm text-muted">
        Annual dividend totals are not available.
      </p>
    );
  }

  const width = 640;
  const height = 240;
  const padding = DEFAULT_PADDING;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maxValue = chartRows.reduce(
    (max, row) => Math.max(max, row.totalPerShare),
    0.0001,
  );
  const yTicks = buildYTicks(maxValue);
  const barGap = 6;
  const barWidth = Math.max(
    (plotWidth - barGap * (chartRows.length - 1)) / chartRows.length,
    8,
  );

  const activeRow = activeIndex != null ? chartRows[activeIndex] : null;
  const displayRow = activeRow ?? chartRows[chartRows.length - 1];

  return (
    <div className="space-y-3">
      <ChartHoverReadout
        label={`${displayRow.year}${displayRow.isPartialYear ? " (YTD)" : ""}`}
        value={`${formatPerShare(displayRow.totalPerShare)} / share`}
        sublabel={
          activeRow
            ? `${formatUsd(displayRow.incomeOnShares, { maximumFractionDigits: 2 })} on selected shares`
            : `Latest year · ${formatUsd(displayRow.incomeOnShares, { maximumFractionDigits: 2 })} on selected shares`
        }
        highlighted={activeIndex != null}
      />
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-56 w-full text-border"
        role="img"
        aria-label="Annual dividend totals per share"
        onMouseLeave={() => setActiveIndex(null)}
      >
        {yTicks.map((tick) => {
          const y = padding.top + plotHeight - (tick / maxValue) * plotHeight;
          return (
            <g key={tick}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                stroke={GRID_STROKE}
                strokeOpacity={0.25}
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-muted text-[10px]"
              >
                {formatPerShare(tick)}
              </text>
            </g>
          );
        })}

        {chartRows.map((row, index) => {
          const barHeight = (row.totalPerShare / maxValue) * plotHeight;
          const x = padding.left + index * (barWidth + barGap);
          const y = padding.top + plotHeight - barHeight;
          const isActive = activeIndex === index;
          const isDimmed = activeIndex != null && !isActive;
          return (
            <g key={row.year}>
              <rect
                x={x - 2}
                y={padding.top}
                width={barWidth + 4}
                height={plotHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
                onBlur={() => setActiveIndex(null)}
                tabIndex={0}
                aria-label={`${row.year}: ${formatPerShare(row.totalPerShare)} per share`}
              />
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 2)}
                rx={3}
                fill={row.isPartialYear ? BAR_FILL_PARTIAL : BAR_FILL}
                fillOpacity={
                  isDimmed
                    ? 0.35
                    : row.isPartialYear
                      ? 0.65
                      : isActive
                        ? 1
                        : 0.95
                }
                className="pointer-events-none transition-[fill-opacity] duration-150"
              />
              {isActive ? (
                <line
                  x1={x + barWidth / 2}
                  x2={x + barWidth / 2}
                  y1={padding.top}
                  y2={padding.top + plotHeight}
                  stroke={BAR_FILL}
                  strokeOpacity={0.35}
                  strokeDasharray="3 3"
                  className="pointer-events-none"
                />
              ) : null}
              <text
                x={x + barWidth / 2}
                y={height - 10}
                textAnchor="middle"
                className={cn(
                  "fill-muted text-[10px] pointer-events-none",
                  isActive && "fill-foreground font-medium",
                )}
              >
                {row.year}
                {row.isPartialYear ? "*" : ""}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="text-[10px] text-muted">
        Total cash dividend paid per share each calendar year. *Current year is
        year-to-date only.
      </p>
    </div>
  );
}

export function DividendPayoutHistoryChart({
  payments,
  limit = 24,
}: {
  payments: DividendPaymentItem[];
  limit?: number;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const chartPayments = payments.slice(-limit);
  if (chartPayments.length === 0) {
    return (
      <p className="text-sm text-muted">
        Dividend payout history is not available.
      </p>
    );
  }

  const width = 640;
  const height = 240;
  const padding = DEFAULT_PADDING;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const maxValue = chartPayments.reduce(
    (max, payment) => Math.max(max, payment.amountPerShare),
    0.0001,
  );
  const yTicks = buildYTicks(maxValue);
  const step =
    chartPayments.length > 1 ? plotWidth / (chartPayments.length - 1) : 0;

  const points = chartPayments.map((payment, index) => {
    const x = padding.left + index * step;
    const y =
      padding.top +
      plotHeight -
      (payment.amountPerShare / maxValue) * plotHeight;
    return { payment, x, y, index };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath = [
    `M ${points[0]?.x ?? padding.left} ${padding.top + plotHeight}`,
    ...points.map((point) => `L ${point.x} ${point.y}`),
    `L ${points[points.length - 1]?.x ?? padding.left} ${padding.top + plotHeight}`,
    "Z",
  ].join(" ");

  const xLabelIndexes = new Set([
    0,
    Math.floor((chartPayments.length - 1) / 2),
    chartPayments.length - 1,
  ]);

  const activePoint = activeIndex != null ? points[activeIndex] : null;
  const displayPoint = activePoint ?? points[points.length - 1];

  function handlePlotHover(event: MouseEvent<SVGRectElement>) {
    const pointerX = svgPointerX(event);
    if (pointerX == null) return;
    setActiveIndex(
      nearestSeriesIndex(
        pointerX,
        padding.left,
        plotWidth,
        chartPayments.length,
      ),
    );
  }

  return (
    <div className="space-y-3">
      <ChartHoverReadout
        label={formatDate(displayPoint.payment.date)}
        value={`${formatPerShare(displayPoint.payment.amountPerShare)} / share`}
        sublabel={activePoint ? null : "Most recent payment"}
        highlighted={activeIndex != null}
      />
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-56 w-full text-border"
        role="img"
        aria-label="Dividend payout per share over time"
        onMouseLeave={() => setActiveIndex(null)}
      >
        {yTicks.map((tick) => {
          const y = padding.top + plotHeight - (tick / maxValue) * plotHeight;
          return (
            <g key={tick}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                stroke={GRID_STROKE}
                strokeOpacity={0.25}
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                className="fill-muted text-[10px]"
              >
                {formatPerShare(tick)}
              </text>
            </g>
          );
        })}

        <path
          d={areaPath}
          fill={LINE_STROKE}
          fillOpacity={0.12}
          className="pointer-events-none"
        />
        <path
          d={linePath}
          fill="none"
          stroke={LINE_STROKE}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          className="pointer-events-none"
        />

        {points.map(({ payment, x, y, index }) => {
          const isActive = activeIndex === index;
          const isDimmed = activeIndex != null && !isActive;
          return (
            <g key={payment.date}>
              <circle
                cx={x}
                cy={y}
                r={isActive ? 5 : 3.5}
                fill={LINE_STROKE}
                fillOpacity={isDimmed ? 0.35 : 1}
                className="pointer-events-none transition-all duration-150"
              />
            </g>
          );
        })}

        <rect
          x={padding.left}
          y={padding.top}
          width={plotWidth}
          height={plotHeight}
          fill="transparent"
          className="cursor-crosshair"
          onMouseMove={handlePlotHover}
          aria-hidden="true"
        />

        {activePoint ? (
          <line
            x1={activePoint.x}
            x2={activePoint.x}
            y1={padding.top}
            y2={padding.top + plotHeight}
            stroke={LINE_STROKE}
            strokeOpacity={0.45}
            strokeDasharray="3 3"
            className="pointer-events-none"
          />
        ) : null}

        {points.map(({ payment, x, index }) =>
          xLabelIndexes.has(index) ? (
            <text
              key={`${payment.date}-label`}
              x={x}
              y={height - 10}
              textAnchor="middle"
              className={cn(
                "fill-muted text-[10px] pointer-events-none",
                activeIndex === index && "fill-foreground font-medium",
              )}
            >
              {formatAxisYear(payment.date)}
            </text>
          ) : null,
        )}
      </svg>
      <p className="text-[10px] text-muted">
        Each point is one dividend payment per share
        {payments.length > limit
          ? ` (showing last ${limit} of ${payments.length} payments).`
          : "."}
      </p>
    </div>
  );
}

export function DividendHistoryCharts({
  history,
}: {
  history: DividendHistoryContext;
}) {
  return (
    <div className="space-y-8">
      <div>
        <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-muted">
          Annual totals per share
        </p>
        <DividendAnnualTotalsChart rows={history.annualIncome} />
      </div>
      <div>
        <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-muted">
          Payout per share
        </p>
        <DividendPayoutHistoryChart payments={history.payments} />
      </div>
    </div>
  );
}

export function DividendSnowballScenarioCard({
  history,
  scenarioParams,
  advancedMetrics,
  onScenarioChange,
}: {
  history: DividendHistoryContext;
  scenarioParams?: DividendScenarioParams;
  advancedMetrics?: DividendAdvancedSnowballScenario | null;
  onScenarioChange?: (params: DividendScenarioParams) => void;
}) {
  const { scenario } = history;
  const [lastEdited, setLastEdited] =
    useState<SnowballInputSource>("investment");

  const sharePrice = scenarioParams?.sharePrice ?? scenario.sharePrice ?? null;
  const reinvestDividends = scenarioParams?.reinvestDividends ?? false;
  const projectYears =
    scenarioParams?.projectYears ?? scenario.projectYears ?? 10;
  const { currentYear, endYear } = dividendProjectionWindow(projectYears);
  const shares =
    scenarioParams?.shares != null && scenarioParams.shares > 0
      ? roundSnowball(scenarioParams.shares)
      : roundSnowball(scenario.shares);
  const investmentUsd =
    scenarioParams?.investmentUsd != null && scenarioParams.investmentUsd > 0
      ? scenarioParams.investmentUsd
      : scenario.investmentUsd != null && scenario.investmentUsd > 0
        ? scenario.investmentUsd
        : sharePrice != null && sharePrice > 0 && shares > 0
          ? roundSnowball(shares * sharePrice)
          : null;
  const annualContributionUsd =
    scenarioParams?.annualContributionUsd != null &&
    scenarioParams.annualContributionUsd >= 0
      ? scenarioParams.annualContributionUsd
      : 0;
  const advanced =
    advancedMetrics ??
    resolveSnowballAdvancedMetrics(history, {
      shares,
      sharePrice,
      reinvestDividends,
      projectYears,
      priceCagrPct: resolveSnowballPriceCagrPct(
        history,
        scenarioParams?.priceCagrPct,
      ),
      annualContributionUsd,
    });
  const endYearDividendGrowthPct =
    scenario.annualIncomeStart > 0
      ? ((scenario.annualIncomeLatest - scenario.annualIncomeStart) /
          scenario.annualIncomeStart) *
        100
      : null;

  function emitScenario(
    source: SnowballInputSource,
    values: {
      investmentUsd?: number | null;
      sharePrice?: number | null;
      shares?: number | null;
      projectYears?: number | null;
      dividendCagrPct?: number | null;
      reinvestDividends?: boolean;
      priceCagrPct?: number | null;
      annualContributionUsd?: number | null;
    },
  ) {
    if (!onScenarioChange) return;
    setLastEdited(source);
    onScenarioChange(buildScenarioParams(scenarioParams, source, values));
  }

  function updateScenario(next: Partial<DividendScenarioParams>) {
    if (!onScenarioChange) return;
    onScenarioChange(mergeScenarioParams(scenarioParams, next));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">Income snowball</p>
          <p className="mt-1 text-xs text-muted">
            Forward-project dividend income from {currentYear} through {endYear}{" "}
            using historic dividend growth
            {history.priceCagrPct != null
              ? ` and ${history.priceCagrPct.toFixed(1)}% price growth`
              : ""}
            . Enter investment or shares — the other is calculated from share
            price. Optional yearly contributions buy more shares at the modeled
            price each year.
          </p>
        </div>
      </div>

      {onScenarioChange ? (
        <div className="grid gap-3 rounded-xl border border-border bg-surface-elevated/30 p-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1 text-xs text-muted">
            Investment
            <SnowballNumericInput
              min={0.01}
              max={100000000}
              step={0.01}
              value={investmentUsd}
              onCommit={(next) => {
                emitScenario("investment", {
                  investmentUsd: next,
                  sharePrice,
                  projectYears,
                  reinvestDividends,
                  priceCagrPct: scenarioParams?.priceCagrPct ?? null,
                  annualContributionUsd,
                });
              }}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm tabular-nums text-foreground"
            />
          </label>
          <label className="space-y-1 text-xs text-muted">
            Share price
            <SnowballNumericInput
              min={0.01}
              max={1000000}
              step={0.01}
              value={sharePrice}
              onCommit={(next) => {
                const roundedPrice = roundSnowball(next);
                if (lastEdited === "shares" && shares > 0) {
                  emitScenario("shares", {
                    shares,
                    sharePrice: roundedPrice,
                    projectYears,
                    reinvestDividends,
                    priceCagrPct: scenarioParams?.priceCagrPct ?? null,
                    annualContributionUsd,
                  });
                  return;
                }
                emitScenario("investment", {
                  investmentUsd,
                  sharePrice: roundedPrice,
                  projectYears,
                  reinvestDividends,
                  priceCagrPct: scenarioParams?.priceCagrPct ?? null,
                  annualContributionUsd,
                });
              }}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm tabular-nums text-foreground"
            />
          </label>
          <label className="space-y-1 text-xs text-muted">
            Shares
            <SnowballNumericInput
              min={0.01}
              max={1000000}
              step={0.01}
              value={shares}
              onCommit={(next) => {
                emitScenario("shares", {
                  shares: next,
                  sharePrice,
                  projectYears,
                  reinvestDividends,
                  priceCagrPct: scenarioParams?.priceCagrPct ?? null,
                  annualContributionUsd,
                });
              }}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm tabular-nums text-foreground"
            />
          </label>
          <label className="space-y-1 text-xs text-muted">
            New cash / year
            <SnowballNumericInput
              min={0}
              max={100000000}
              step={100}
              value={annualContributionUsd > 0 ? annualContributionUsd : null}
              onCommit={(next) => {
                updateScenario({ annualContributionUsd: next });
              }}
              onClear={() => updateScenario({ annualContributionUsd: 0 })}
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm tabular-nums text-foreground"
            />
          </label>
        </div>
      ) : null}

      {onScenarioChange ? (
        <div className="space-y-3 rounded-xl border border-border bg-surface-elevated/20 p-3">
          <div>
            <p className="text-xs font-medium text-foreground">
              Projection horizon
            </p>
            <p className="mt-1 text-[11px] text-muted">
              {currentYear} → {endYear} · {scenario.dividendCagrPct.toFixed(1)}%
              avg dividend growth / yr
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {DIVIDEND_PROJECTION_YEAR_PRESETS.map((years) => (
              <button
                key={years}
                type="button"
                onClick={() => updateScenario({ projectYears: years })}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs tabular-nums transition-colors",
                  projectYears === years
                    ? "border-accent/60 bg-accent/10 text-foreground"
                    : "border-border bg-background text-muted hover:text-foreground",
                )}
              >
                {years}y
              </button>
            ))}
          </div>
          <label className="block max-w-xs space-y-1 text-xs text-muted">
            Custom years
            <SnowballNumericInput
              min={1}
              max={50}
              step={1}
              value={projectYears}
              onCommit={(next) =>
                updateScenario({
                  projectYears: Math.max(1, Math.min(50, Math.round(next))),
                })
              }
              className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm tabular-nums text-foreground"
            />
          </label>
        </div>
      ) : null}

      {onScenarioChange ? (
        <div className="space-y-3 rounded-xl border border-border bg-surface-elevated/20 p-3">
          <label className="flex items-start gap-3 text-sm text-foreground">
            <input
              type="checkbox"
              checked={reinvestDividends}
              onChange={(event) => {
                updateScenario({ reinvestDividends: event.target.checked });
              }}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">Reinvest dividends (DRIP)</span>
              <span className="mt-1 block text-xs text-muted">
                Use each year&apos;s dividend cash to buy more shares over the
                next {projectYears} years.
              </span>
            </span>
          </label>
        </div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface-elevated/40 px-3 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
            Est. annual dividend · {currentYear}
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {formatUsd(scenario.annualIncomeStart, {
              maximumFractionDigits: 0,
            })}
          </p>
          <p className="mt-1 text-xs text-muted">
            {reinvestDividends
              ? "Cash per year at your starting share count"
              : "Cash per year at today's dividend rate"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface-elevated/40 px-3 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
            Est. annual dividend · {endYear}
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {formatUsd(
              reinvestDividends
                ? (advanced?.annualIncomeLatestDrip ??
                    scenario.annualIncomeLatest)
                : scenario.annualIncomeLatest,
              { maximumFractionDigits: 0 },
            )}
          </p>
          <p className="mt-1 text-xs text-muted">
            {reinvestDividends && advanced
              ? `Cash per year with ${formatSnowballShares(advanced.finalShares)} shares after DRIP`
              : endYearDividendGrowthPct != null && endYearDividendGrowthPct > 0
                ? `Up ${endYearDividendGrowthPct.toFixed(0)}% vs ${currentYear}, same share count`
                : "Cash per year with the same share count"}
          </p>
        </div>
      </div>

      {advanced ? (
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-border/70 bg-muted-bg/40 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted">
              Portfolio value
            </p>
            <p className="mt-1 text-base font-semibold tabular-nums text-foreground">
              {formatUsd(advanced.portfolioValueLatest, {
                maximumFractionDigits: 0,
              })}
            </p>
            <p className="mt-1 text-[11px] text-muted">
              {reinvestDividends
                ? "After DRIP and price growth"
                : "Flat share count with price growth"}
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted-bg/40 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted">
              {reinvestDividends ? "Shares after DRIP" : "Shares"}
            </p>
            <p className="mt-1 text-base font-semibold tabular-nums text-foreground">
              {formatSnowballShares(advanced.finalShares)}
            </p>
            <p className="mt-1 text-[11px] text-muted">
              Started with {formatSnowballShares(advanced.initialShares)} in{" "}
              {currentYear}
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted-bg/40 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted">
              {advanced.totalAnnualContributionsUsd != null &&
              advanced.totalAnnualContributionsUsd > 0
                ? "Dividends reinvested"
                : "Reinvested"}
            </p>
            <p className="mt-1 text-base font-semibold tabular-nums text-foreground">
              {formatUsd(advanced.totalDividendsReinvested, {
                maximumFractionDigits: 0,
              })}
            </p>
            <p className="mt-1 text-[11px] text-muted">
              {advanced.totalAnnualContributionsUsd != null &&
              advanced.totalAnnualContributionsUsd > 0
                ? `${formatUsd(advanced.totalAnnualContributionsUsd, {
                    maximumFractionDigits: 0,
                  })} new cash over ${projectYears} yrs`
                : reinvestDividends
                  ? `${advanced.priceCagrPct.toFixed(1)}% avg price growth / yr`
                  : `${advanced.priceCagrPct.toFixed(1)}% avg price growth / yr · no reinvestment`}
            </p>
          </div>
        </div>
      ) : null}

      <p className="rounded-lg border border-border/70 bg-muted-bg/40 px-3 py-2 text-xs text-muted">
        {`Uses ${scenario.dividendCagrPct.toFixed(1)}% dividend growth and ${
          advanced?.priceCagrPct != null
            ? `${advanced.priceCagrPct.toFixed(1)}%`
            : history.priceCagrPct != null
              ? `${history.priceCagrPct.toFixed(1)}%`
              : "historic"
        } price growth over ${projectYears} years. `}
        {annualContributionUsd > 0
          ? `Adds ${formatUsd(annualContributionUsd, {
              maximumFractionDigits: 0,
            })} of new cash at the start of each year after ${currentYear} (buys shares at modeled price). `
          : ""}
        {reinvestDividends && advanced
          ? `DRIP reinvests ${formatUsd(advanced.totalDividendsReinvested, {
              maximumFractionDigits: 0,
            })} of dividends into additional shares. `
          : advanced
            ? `Portfolio value assumes flat share count with compounding share price. `
            : `Projected dividends collected: ${formatUsd(
                scenario.totalCollected,
                {
                  maximumFractionDigits: 0,
                },
              )} on ${formatSnowballShares(shares)} shares. `}
        Forward projections assume historic growth rates continue. Past
        performance does not guarantee future results.
      </p>
    </div>
  );
}

export function DividendRecentPaymentsTable({
  payments,
}: {
  payments: DividendPaymentItem[];
}) {
  if (payments.length === 0) {
    return (
      <p className="text-sm text-muted">No recent payments were returned.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-xs">
        <thead className="text-muted">
          <tr>
            <th className="pb-2 pr-4 font-medium">Payment date</th>
            <th className="pb-2 font-medium">Amount / share</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.date} className="border-t border-border">
              <td className="py-2 pr-4 text-foreground">
                {formatDate(payment.date)}
              </td>
              <td className="py-2 tabular-nums text-foreground">
                ${payment.amountPerShare.toFixed(4)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DividendSnowballSkeleton() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-56 rounded-xl" />
      <Skeleton className="h-56 rounded-xl" />
    </div>
  );
}
