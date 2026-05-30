"use client";

import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { ChevronDown, History, LineChart, TrendingUp } from "lucide-react";
import type {
  AnnualDividendIncome,
  DividendAdvancedSnowballScenario,
  DividendBacktestParams,
  DividendHistoryContext,
  DividendPaymentItem,
  DividendSnowballParams,
} from "@/app/types/research";
import { DIVIDEND_BACKTEST_YEAR_PRESETS, DIVIDEND_PROJECTION_YEAR_PRESETS } from "@/app/types/research";
import { formatUsd } from "@/lib/formatCurrency";
import { Button } from "@/components/ui/Button";
import {
  completedDividendYears,
  dividendProjectionWindow,
  historyStartYearForLookback,
  resolveCurrentYieldPct,
} from "@/lib/dividendHistory";
import { formatExpenseRatio } from "@/lib/etfHoldings";
import { cn } from "@/lib/utils";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { Skeleton, SkeletonList } from "@/components/ui/Skeleton";

/** Matched height for dividend history and recent-payments panels. */
export const DIVIDEND_HISTORY_PANEL_MIN_CLASS = "min-h-[34rem]";
export const RECENT_PAYMENTS_ROW_COUNT = 16;

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

function SnowballScenarioControlsPanel({
  summary,
  children,
  title = "Adjust projection",
  applyLabel = "Update projection",
  onApply,
  canApply = true,
  hasPendingChanges = false,
  isApplying = false,
}: {
  summary: string;
  children: ReactNode;
  title?: string;
  applyLabel?: string;
  onApply?: () => void;
  canApply?: boolean;
  hasPendingChanges?: boolean;
  isApplying?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const applyButton =
    onApply != null ? (
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button
          type="button"
          size="sm"
          onClick={onApply}
          disabled={!canApply || isApplying}
          isLoading={isApplying}
        >
          {applyLabel}
        </Button>
        {hasPendingChanges ? (
          <p className="text-[11px] text-muted">Changes not applied yet.</p>
        ) : null}
      </div>
    ) : null;

  return (
    <>
      <div className="hidden space-y-3 md:block">
        {children}
        {applyButton}
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-surface-elevated/30 md:hidden">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
        >
          <span className="min-w-0">
            <span className="text-xs font-medium text-foreground">{title}</span>
            <span className="mt-0.5 block truncate text-[11px] text-muted">
              {summary}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted transition-transform",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>
        {open ? (
          <div className="space-y-3 border-t border-border/70 p-3">
            {children}
            {applyButton}
          </div>
        ) : null}
      </div>
    </>
  );
}

function buildScenarioControlsSummary(options: {
  projectYears: number;
  investmentUsd: number | null;
  reinvestDividends: boolean;
  annualContributionUsd: number;
}): string {
  const parts: string[] = [`${options.projectYears}y`];
  if (options.investmentUsd != null && options.investmentUsd > 0) {
    parts.push(formatUsd(options.investmentUsd, { maximumFractionDigits: 0 }));
  }
  parts.push(options.reinvestDividends ? "DRIP on" : "DRIP off");
  if (options.annualContributionUsd > 0) {
    parts.push(
      `+${formatUsd(options.annualContributionUsd, { maximumFractionDigits: 0 })}/yr`,
    );
  }
  return parts.join(" · ");
}

const SNOWBALL_CURRENCY_STEP = 100;

function parseSnowballInputNumber(text: string): number | null {
  const trimmed = text.trim();
  if (trimmed === "") return null;
  const next = Number(trimmed);
  return Number.isFinite(next) ? next : null;
}

function shouldApplyFixedCurrencyStep(diff: number, _step: number): boolean {
  if (!Number.isFinite(diff) || diff === 0) return false;
  return Math.abs(diff) < 1;
}

function resolveFixedStepValue(
  current: number,
  proposed: number,
  step: number,
  min?: number,
  max?: number,
  allowZero = false,
): number {
  const diff = proposed - current;
  let next = proposed;
  if (shouldApplyFixedCurrencyStep(diff, step)) {
    const direction = diff > 0 ? 1 : -1;
    next = current + direction * step;
  }
  if (min != null) next = Math.max(min, next);
  if (max != null) next = Math.min(max, next);
  if (!allowZero && next <= 0) next = 0.01;
  return roundSnowball(next);
}

function formatSnowballInputValue(
  value: number | null | undefined,
  allowZero: boolean,
): string {
  if (value == null || !Number.isFinite(value)) return "";
  if (allowZero && value >= 0) {
    return value > 0 ? String(roundSnowball(value)) : "0";
  }
  return value > 0 ? String(roundSnowball(value)) : "";
}

type SnowballNumericInputProps = {
  value: number | null | undefined;
  onCommit: (value: number) => void;
  onClear?: () => void;
  min?: number;
  max?: number;
  step?: number;
  fixedStep?: number;
  disabled?: boolean;
  allowZero?: boolean;
  className?: string;
};

function SnowballNumericInput({
  value,
  onCommit,
  onClear,
  min,
  max,
  step,
  fixedStep,
  disabled = false,
  allowZero = false,
  className,
}: SnowballNumericInputProps) {
  const [text, setText] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const stepSize = fixedStep ?? step;

  useEffect(() => {
    if (isFocused) return;
    setText(formatSnowballInputValue(value, allowZero));
  }, [value, isFocused, allowZero]);

  const isCommitValue = (next: number) =>
    Number.isFinite(next) && (allowZero ? next >= 0 : next > 0);

  const commitValue = (next: number) => {
    if (!isCommitValue(next)) return;
    onCommit(next);
    setText(formatSnowballInputValue(next, allowZero));
  };

  const adjustByStep = (direction: 1 | -1) => {
    const parsed = parseSnowballInputNumber(text);
    const current =
      parsed != null
        ? parsed
        : value != null && Number.isFinite(value)
          ? value
          : 0;
    if (!stepSize || stepSize <= 0) return;
    const next = resolveFixedStepValue(
      current,
      current + direction * stepSize,
      stepSize,
      min,
      max,
      allowZero,
    );
    commitValue(next);
  };

  return (
    <input
      type="number"
      min={min}
      max={max}
      step={stepSize}
      disabled={disabled}
      value={text}
      onFocus={() => {
        if (disabled) return;
        setIsFocused(true);
      }}
      onBlur={() => {
        if (disabled) return;
        setIsFocused(false);
        const trimmed = text.trim();
        if (trimmed === "") {
          onClear?.();
          setText(allowZero ? "0" : "");
          return;
        }
        const next = Number(trimmed);
        if (isCommitValue(next)) {
          commitValue(next);
          return;
        }
        setText(formatSnowballInputValue(value, allowZero));
      }}
      onKeyDown={(event) => {
        if (disabled || !stepSize || stepSize <= 0) return;
        if (event.key === "ArrowUp") {
          event.preventDefault();
          adjustByStep(1);
        } else if (event.key === "ArrowDown") {
          event.preventDefault();
          adjustByStep(-1);
        }
      }}
      onChange={(event) => {
        if (disabled) return;
        const nextText = event.target.value;
        setText(nextText);
        const trimmed = nextText.trim();
        if (trimmed === "") return;
        const proposed = Number(trimmed);
        if (!Number.isFinite(proposed)) return;

        const parsed = parseSnowballInputNumber(text);
        const current =
          parsed != null
            ? parsed
            : value != null && Number.isFinite(value)
              ? value
              : 0;

        const next =
          fixedStep != null && fixedStep > 0
            ? resolveFixedStepValue(
                current,
                proposed,
                fixedStep,
                min,
                max,
                allowZero,
              )
            : proposed;

        if (isCommitValue(next)) {
          onCommit(next);
        }
      }}
      className={cn(disabled && "cursor-not-allowed opacity-70", className)}
    />
  );
}

function SnowballCurrencyInput({
  value,
  onCommit,
  onClear,
  min,
  max,
  step = SNOWBALL_CURRENCY_STEP,
  disabled,
  allowZero,
  className,
}: SnowballNumericInputProps) {
  return (
    <div className="relative flex min-w-0 items-center">
      <span
        className="pointer-events-none absolute left-2.5 text-sm tabular-nums text-muted"
        aria-hidden
      >
        $
      </span>
      <SnowballNumericInput
        value={value}
        onCommit={onCommit}
        onClear={onClear}
        min={min}
        max={max}
        step={step}
        fixedStep={step}
        disabled={disabled}
        allowZero={allowZero}
        className={cn("pl-6", className)}
      />
    </div>
  );
}

type SnowballInputSource = "investment" | "shares";

function buildBacktestControlsSummary(options: {
  startYear: number;
  endYear: number;
  investmentUsd: number | null;
  reinvestDividends: boolean;
  annualContributionUsd: number;
}): string {
  const parts: string[] = [
    `${options.startYear}–${options.endYear}`,
  ];
  if (options.investmentUsd != null && options.investmentUsd > 0) {
    parts.push(formatUsd(options.investmentUsd, { maximumFractionDigits: 0 }));
  }
  parts.push(options.reinvestDividends ? "DRIP on" : "DRIP off");
  if (options.annualContributionUsd > 0) {
    parts.push(
      `+${formatUsd(options.annualContributionUsd, { maximumFractionDigits: 0 })}/yr`,
    );
  }
  return parts.join(" · ");
}

function DividendScenarioPositionInputs({
  variant,
  scenarioParams,
  onScenarioChange,
  sharePrice,
  sharePriceLabel = "Share price",
  investmentUsd,
  shares,
  annualContributionUsd,
  reinvestDividends,
  projectYears,
  dripHint,
}: {
  variant: "snowball" | "backtest";
  scenarioParams?: DividendSnowballParams | DividendBacktestParams;
  onScenarioChange?: (
    params: DividendSnowballParams | DividendBacktestParams,
  ) => void;
  sharePrice: number | null;
  sharePriceLabel?: string;
  investmentUsd: number | null;
  shares: number;
  annualContributionUsd: number;
  reinvestDividends: boolean;
  projectYears: number;
  dripHint: string;
}) {
  if (!onScenarioChange) return null;

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
    if (variant === "backtest") {
      onScenarioChange(
        buildBacktestParams(
          scenarioParams as DividendBacktestParams | undefined,
          source,
          values,
        ),
      );
      return;
    }
    onScenarioChange(
      buildSnowballParams(
        scenarioParams as DividendSnowballParams | undefined,
        source,
        values,
      ),
    );
  }

  function updateScenario(
    next: Partial<DividendSnowballParams | DividendBacktestParams>,
  ) {
    if (!onScenarioChange) return;
    if (variant === "backtest") {
      onScenarioChange(
        mergeBacktestParams(scenarioParams as DividendBacktestParams | undefined, next),
      );
      return;
    }
    onScenarioChange(
      mergeSnowballParams(scenarioParams as DividendSnowballParams | undefined, next),
    );
  }

  return (
    <>
      <div className="grid gap-3 rounded-xl border border-border bg-surface-elevated/30 p-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-1 text-xs text-muted">
          Investment
          <SnowballCurrencyInput
            min={0}
            max={100000000}
            step={SNOWBALL_CURRENCY_STEP}
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
            className="w-full rounded-md border border-border bg-background py-1.5 pr-2 text-sm tabular-nums text-foreground"
          />
        </label>
        <label className="space-y-1 text-xs text-muted">
          {sharePriceLabel}
          <SnowballCurrencyInput
            min={0.01}
            max={1000000}
            value={sharePrice}
            disabled
            onCommit={() => {}}
            className="w-full rounded-md border border-border bg-muted-bg/40 py-1.5 pr-2 text-sm tabular-nums text-foreground"
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
          Annual contribution
          <SnowballCurrencyInput
            min={0}
            max={100000000}
            step={SNOWBALL_CURRENCY_STEP}
            allowZero
            value={annualContributionUsd}
            onCommit={(next) => {
              updateScenario({ annualContributionUsd: next });
            }}
            onClear={() => updateScenario({ annualContributionUsd: 0 })}
            className="w-full rounded-md border border-border bg-background py-1.5 pr-2 text-sm tabular-nums text-foreground"
          />
        </label>
      </div>

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
            <span className="mt-1 block text-xs text-muted">{dripHint}</span>
          </span>
        </label>
      </div>
    </>
  );
}

function buildSnowballParams(
  base: DividendSnowballParams | undefined,
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
): DividendSnowballParams {
  const sharePrice = values.sharePrice ?? base?.sharePrice ?? null;
  const reinvestDividends =
    values.reinvestDividends ?? base?.reinvestDividends ?? true;
  const priceCagrPct = values.priceCagrPct ?? base?.priceCagrPct ?? null;
  const projectYears = values.projectYears ?? base?.projectYears ?? 10;
  const dividendCagrPct =
    values.dividendCagrPct ?? base?.dividendCagrPct ?? null;
  const annualContributionUsd =
    values.annualContributionUsd ?? base?.annualContributionUsd ?? 0;

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

function buildBacktestParams(
  base: DividendBacktestParams | undefined,
  source: SnowballInputSource,
  values: {
    investmentUsd?: number | null;
    sharePrice?: number | null;
    shares?: number | null;
    reinvestDividends?: boolean;
    priceCagrPct?: number | null;
    annualContributionUsd?: number | null;
  },
): DividendBacktestParams {
  const pricingSharePrice = values.sharePrice ?? base?.sharePrice ?? null;
  const marketSharePrice = base?.sharePrice ?? null;
  const reinvestDividends =
    values.reinvestDividends ?? base?.reinvestDividends ?? true;
  const priceCagrPct = values.priceCagrPct ?? base?.priceCagrPct ?? null;
  const annualContributionUsd =
    values.annualContributionUsd ?? base?.annualContributionUsd ?? 0;

  if (pricingSharePrice != null && pricingSharePrice > 0) {
    if (source === "shares" && values.shares != null && values.shares > 0) {
      const shares = roundSnowball(values.shares);
      return {
        investmentUsd: roundSnowball(shares * pricingSharePrice),
        sharePrice: marketSharePrice,
        shares,
        reinvestDividends,
        priceCagrPct,
        annualContributionUsd,
        historyStartYear: base?.historyStartYear ?? null,
      };
    }

    if (values.investmentUsd != null && values.investmentUsd > 0) {
      const investmentUsd = roundSnowball(values.investmentUsd);
      return {
        investmentUsd,
        sharePrice: marketSharePrice,
        shares: roundSnowball(investmentUsd / pricingSharePrice),
        reinvestDividends,
        priceCagrPct,
        annualContributionUsd,
        historyStartYear: base?.historyStartYear ?? null,
      };
    }
  }

  return {
    investmentUsd: values.investmentUsd ?? base?.investmentUsd ?? null,
    sharePrice: marketSharePrice,
    shares: values.shares ?? base?.shares ?? null,
    reinvestDividends,
    priceCagrPct,
    annualContributionUsd,
    historyStartYear: base?.historyStartYear ?? null,
  };
}

function mergeSnowballParams(
  base: DividendSnowballParams | undefined,
  next: Partial<DividendSnowballParams>,
): DividendSnowballParams {
  return {
    investmentUsd: next.investmentUsd ?? base?.investmentUsd ?? null,
    sharePrice: next.sharePrice ?? base?.sharePrice ?? null,
    shares: next.shares ?? base?.shares ?? null,
    projectYears: next.projectYears ?? base?.projectYears ?? 10,
    dividendCagrPct: next.dividendCagrPct ?? base?.dividendCagrPct ?? null,
    reinvestDividends:
      next.reinvestDividends ?? base?.reinvestDividends ?? true,
    priceCagrPct: next.priceCagrPct ?? base?.priceCagrPct ?? null,
    annualContributionUsd:
      next.annualContributionUsd ?? base?.annualContributionUsd ?? 0,
  };
}

function mergeBacktestParams(
  base: DividendBacktestParams | undefined,
  next: Partial<DividendBacktestParams>,
): DividendBacktestParams {
  return {
    investmentUsd: next.investmentUsd ?? base?.investmentUsd ?? null,
    sharePrice: next.sharePrice ?? base?.sharePrice ?? null,
    shares: next.shares ?? base?.shares ?? null,
    reinvestDividends:
      next.reinvestDividends ?? base?.reinvestDividends ?? true,
    priceCagrPct: next.priceCagrPct ?? base?.priceCagrPct ?? null,
    annualContributionUsd:
      next.annualContributionUsd ?? base?.annualContributionUsd ?? 0,
    historyStartYear: next.historyStartYear ?? base?.historyStartYear ?? null,
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

export const DIVIDEND_KPI_GRID_CLASS =
  "grid grid-cols-1 items-stretch gap-2 sm:grid-cols-2 lg:grid-cols-3";

/** Dividend KPI cards — historic facts plus optional snowball projection stats. */
export function DividendSummaryStats({
  history,
  sharePrice,
  isEtf = false,
  expenseRatio,
  includeSnowball = false,
  advancedMetrics = null,
}: {
  history: DividendHistoryContext;
  sharePrice?: number | null;
  isEtf?: boolean;
  expenseRatio?: string | null;
  includeSnowball?: boolean;
  advancedMetrics?: DividendAdvancedSnowballScenario | null;
}) {
  const currentYieldPct = resolveCurrentYieldPct(history, sharePrice);
  const scenario = includeSnowball ? history.scenario : null;
  const priceGrowthPct =
    scenario != null
      ? (history.priceCagrPct ?? scenario.advanced?.priceCagrPct ?? null)
      : null;
  const projectionWindow =
    scenario != null ? dividendProjectionWindow(scenario.projectYears) : null;
  const projectedTotal =
    advancedMetrics?.totalProjectedDividends ?? scenario?.totalCollected ?? null;

  return (
    <div className="space-y-3">
      <div className={DIVIDEND_KPI_GRID_CLASS}>
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
        {scenario && projectionWindow ? (
          <>
            <StatCard
              label="5Y price growth"
              value={formatPct(priceGrowthPct)}
              hint="Average annual share price growth, applied in projections"
            />
            <StatCard
              label={`${projectionWindow.projectYears}-year total`}
              value={formatUsd(
                projectedTotal ?? scenario.totalCollected,
                {
                  maximumFractionDigits: 0,
                },
              )}
              hint={`Estimated dividend cash collected ${projectionWindow.currentYear}–${projectionWindow.endYear}`}
            />
          </>
        ) : null}
      </div>
      {scenario && projectionWindow ? (
        <p className="text-xs leading-relaxed text-muted">
          Projections combine historic dividend growth (5Y CAGR when available),{" "}
          {priceGrowthPct != null
            ? `${priceGrowthPct.toFixed(1)}%`
            : "estimated"}{" "}
          annual price growth, and your share count. Portfolio value also
          reflects price growth; enable DRIP below to reinvest dividends into
          more shares. Past growth rates are not guaranteed to continue.
        </p>
      ) : null}
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

export function DividendHistoricalBacktestCard({
  history,
  backtestParams,
  displayParams,
  onBacktestChange,
  onApply,
  canApply = true,
  hasPendingChanges = false,
  isApplying = false,
}: {
  history: DividendHistoryContext;
  backtestParams?: DividendBacktestParams;
  displayParams?: DividendBacktestParams;
  onBacktestChange?: (params: DividendBacktestParams) => void;
  onApply?: () => void;
  canApply?: boolean;
  hasPendingChanges?: boolean;
  isApplying?: boolean;
}) {
  const backtest = history.historicalBacktest;
  const completedYears = completedDividendYears(history);
  const endYear = completedYears.at(-1) ?? backtest?.endYear ?? null;
  const display = displayParams ?? backtestParams;
  const reinvestDividends = backtestParams?.reinvestDividends ?? true;
  const startSharePrice = display?.sharePrice ?? null;
  const shares =
    display?.shares != null && display.shares > 0
      ? roundSnowball(display.shares)
      : 100;
  const investmentUsd =
    display?.investmentUsd != null && display.investmentUsd > 0
      ? display.investmentUsd
      : startSharePrice != null && startSharePrice > 0 && shares > 0
        ? roundSnowball(shares * startSharePrice)
        : null;
  const annualContributionUsd = backtestParams?.annualContributionUsd ?? 0;
  const canRunBacktest =
    canApply &&
    startSharePrice != null &&
    startSharePrice > 0 &&
    ((investmentUsd != null && investmentUsd > 0) || shares > 0);

  if (!backtest || completedYears.length === 0 || endYear == null) {
    return (
      <p className="text-sm text-muted">
        Not enough completed dividend history to run a backtest yet.
      </p>
    );
  }

  const drip = backtest.drip;
  const backtestShares =
    backtest.initialShares > 0
      ? backtest.initialShares
      : drip?.initialShares != null && drip.initialShares > 0
        ? drip.initialShares
        : shares;
  const draftStartYear =
    backtestParams?.historyStartYear ?? backtest.startYear;
  const draftWindowYears = Math.max(1, endYear - draftStartYear + 1);
  const annualRows = history.annualIncome.filter(
    (row) =>
      !row.isPartialYear &&
      row.year >= backtest.startYear &&
      row.year <= backtest.endYear,
  );

  function updateLookbackYears(lookbackYears: number) {
    if (!onBacktestChange) return;
    const startYear = historyStartYearForLookback(completedYears, lookbackYears);
    if (startYear == null) return;
    onBacktestChange(
      mergeBacktestParams(backtestParams, { historyStartYear: startYear }),
    );
  }

  const maxLookbackYears = Math.min(15, completedYears.length);

  return (
    <div className="app-stack">
      <div>
        <p className="text-sm font-medium text-foreground">Historical backtest</p>
        <p className="mt-1 text-xs text-muted">
          Replay actual dividend payments from {backtest.startYear} through{" "}
          {backtest.endYear} using your investment, share count, contributions, and
          optional DRIP. Enter investment or shares — the other is calculated from
          modeled share price at the start of the window.
        </p>
      </div>

      {onBacktestChange ? (
        <SnowballScenarioControlsPanel
          summary={buildBacktestControlsSummary({
            startYear: draftStartYear,
            endYear,
            investmentUsd,
            reinvestDividends,
            annualContributionUsd,
          })}
          title="Adjust backtest"
          applyLabel="Run backtest"
          onApply={onApply}
          canApply={canRunBacktest}
          hasPendingChanges={hasPendingChanges}
          isApplying={isApplying}
        >
          <DividendScenarioPositionInputs
            variant="backtest"
            scenarioParams={backtestParams}
            onScenarioChange={onBacktestChange}
            sharePrice={startSharePrice}
            sharePriceLabel={`Share price · ${draftStartYear}`}
            investmentUsd={investmentUsd}
            shares={shares}
            annualContributionUsd={annualContributionUsd}
            reinvestDividends={reinvestDividends}
            projectYears={10}
            dripHint="Reinvest each year's dividend cash into more shares at modeled prices over the backtest window."
          />

          <div className="space-y-3 rounded-xl border border-border bg-surface-elevated/20 p-3">
            <div>
              <p className="text-xs font-medium text-foreground">Backtest window</p>
              <p className="mt-1 text-[11px] text-muted">
                {draftStartYear} → {endYear} · {draftWindowYears} completed{" "}
                {draftWindowYears === 1 ? "year" : "years"}
                {hasPendingChanges ? " · pending" : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {DIVIDEND_BACKTEST_YEAR_PRESETS.map((years) => {
                const startYear = historyStartYearForLookback(
                  completedYears,
                  years,
                );
                if (startYear == null) return null;
                return (
                  <button
                    key={years}
                    type="button"
                    onClick={() => updateLookbackYears(years)}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs tabular-nums transition-colors",
                      draftWindowYears === years
                        ? "border-accent/60 bg-accent/10 text-foreground"
                        : "border-border bg-background text-muted hover:text-foreground",
                    )}
                  >
                    {years}y
                  </button>
                );
              })}
            </div>
            <label className="block max-w-xs space-y-1 text-xs text-muted">
              Custom years
              <SnowballNumericInput
                min={1}
                max={maxLookbackYears}
                step={1}
                value={draftWindowYears}
                onCommit={(next) =>
                  updateLookbackYears(
                    Math.max(1, Math.min(maxLookbackYears, Math.round(next))),
                  )
                }
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm tabular-nums text-foreground"
              />
            </label>
          </div>
        </SnowballScenarioControlsPanel>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface-elevated/40 px-3 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
            Cash collected
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {formatUsd(backtest.cashCollected, { maximumFractionDigits: 0 })}
          </p>
          <p className="mt-1 text-xs text-muted">
            {drip
              ? "Total dividend cash over the window (simulated share count with DRIP)"
              : "Sum of actual dividend payments in the window"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface-elevated/40 px-3 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
            Annual totals
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {formatUsd(backtest.cashCollectedAnnual, {
              maximumFractionDigits: 0,
            })}
          </p>
          <p className="mt-1 text-xs text-muted">
            {drip
              ? "Same total as cash collected when DRIP is on"
              : "Calendar-year DPS × shares for each year in the window"}
          </p>
        </div>
      </div>

      {drip ? (
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-border/70 bg-muted-bg/40 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted">
              Portfolio value
            </p>
            <p className="mt-1 text-base font-semibold tabular-nums text-foreground">
              {formatUsd(drip.portfolioValueLatest, { maximumFractionDigits: 0 })}
            </p>
            <p className="mt-1 text-[11px] text-muted">
              If DRIP ran from {backtest.startYear} at modeled prices
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted-bg/40 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted">
              Shares after DRIP
            </p>
            <p className="mt-1 text-base font-semibold tabular-nums text-foreground">
              {formatSnowballShares(drip.finalShares)}
            </p>
            <p className="mt-1 text-[11px] text-muted">
              Started with {formatSnowballShares(drip.initialShares)} in{" "}
              {backtest.startYear}
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-muted-bg/40 px-3 py-2">
            <p className="text-[11px] uppercase tracking-wide text-muted">
              Reinvested
            </p>
            <p className="mt-1 text-base font-semibold tabular-nums text-foreground">
              {formatUsd(drip.totalDividendsReinvested, {
                maximumFractionDigits: 0,
              })}
            </p>
            <p className="mt-1 text-[11px] text-muted">
              {drip.totalAnnualContributionsUsd != null &&
              drip.totalAnnualContributionsUsd > 0
                ? `${formatUsd(drip.totalAnnualContributionsUsd, {
                    maximumFractionDigits: 0,
                  })} new cash · ${drip.priceCagrPct.toFixed(1)}% avg price growth / yr`
                : `${drip.priceCagrPct.toFixed(1)}% avg modeled price growth / yr`}
            </p>
          </div>
        </div>
      ) : null}

      {annualRows.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="min-w-full text-left text-xs text-foreground">
            <thead className="bg-surface-elevated/40">
              <tr className="border-b border-border">
                <th className="px-3 py-2 font-normal">Year</th>
                <th className="px-3 py-2 font-normal tabular-nums">DPS</th>
                <th className="px-3 py-2 font-normal tabular-nums">
                  Income on {formatSnowballShares(backtestShares)} sh
                </th>
              </tr>
            </thead>
            <tbody>
              {annualRows.map((row) => (
                <tr key={row.year} className="border-t border-border/70">
                  <td className="px-3 py-2">{row.year}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {formatPerShare(row.totalPerShare)}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {formatUsd(row.totalPerShare * backtestShares, {
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <p className="rounded-lg border border-border/70 bg-muted-bg/40 px-3 py-2 text-xs text-muted">
        Backtest uses recorded dividend amounts with{" "}
        {formatSnowballShares(backtestShares)} shares at modeled{" "}
        {backtest.startYear} prices
        {investmentUsd != null && investmentUsd > 0
          ? ` (${formatUsd(investmentUsd, { maximumFractionDigits: 0 })} invested)`
          : ""}
        .
        {annualContributionUsd > 0
          ? ` Includes ${formatUsd(annualContributionUsd, {
              maximumFractionDigits: 0,
            })} of new cash at the start of each year after ${backtest.startYear}. `
          : " "}
        {drip
          ? ` DRIP assumes ${drip.priceCagrPct.toFixed(1)}% annual price growth and reinvestment at year-end modeled prices.`
          : reinvestDividends
            ? " Enable share price to model DRIP reinvestment."
            : " DRIP is off — cash totals exclude reinvestment."}{" "}
        Past dividends do not guarantee future payouts.
      </p>
    </div>
  );
}

export function DividendSnowballScenarioCard({
  history,
  snowballParams,
  advancedMetrics,
  onSnowballChange,
  onApply,
  canApply = true,
  hasPendingChanges = false,
  isApplying = false,
}: {
  history: DividendHistoryContext;
  snowballParams?: DividendSnowballParams;
  advancedMetrics?: DividendAdvancedSnowballScenario | null;
  onSnowballChange?: (params: DividendSnowballParams) => void;
  onApply?: () => void;
  canApply?: boolean;
  hasPendingChanges?: boolean;
  isApplying?: boolean;
}) {
  const scenario = history.scenario;
  if (!scenario) return null;

  const appliedProjectYears = scenario.projectYears;
  const { currentYear, endYear } = dividendProjectionWindow(appliedProjectYears);
  const draftProjectYears =
    snowballParams?.projectYears ?? appliedProjectYears ?? 10;
  const sharePrice = snowballParams?.sharePrice ?? scenario.sharePrice ?? null;
  const reinvestDividends = snowballParams?.reinvestDividends ?? true;
  const shares =
    snowballParams?.shares != null && snowballParams.shares > 0
      ? roundSnowball(snowballParams.shares)
      : roundSnowball(scenario.shares);
  const investmentUsd =
    snowballParams?.investmentUsd != null && snowballParams.investmentUsd > 0
      ? snowballParams.investmentUsd
      : scenario.investmentUsd != null && scenario.investmentUsd > 0
        ? scenario.investmentUsd
        : sharePrice != null && sharePrice > 0 && shares > 0
          ? roundSnowball(shares * sharePrice)
          : null;
  const annualContributionUsd = snowballParams?.annualContributionUsd ?? 0;
  const canUpdateProjection =
    canApply &&
    sharePrice != null &&
    sharePrice > 0 &&
    ((investmentUsd != null && investmentUsd > 0) || shares > 0);
  const advanced = advancedMetrics;
  const endYearDividendGrowthPct =
    scenario.annualIncomeStart > 0
      ? ((scenario.annualIncomeLatest - scenario.annualIncomeStart) /
          scenario.annualIncomeStart) *
        100
      : null;

  function updateScenario(next: Partial<DividendSnowballParams>) {
    if (!onSnowballChange) return;
    onSnowballChange(mergeSnowballParams(snowballParams, next));
  }

  return (
    <div className="app-stack">
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

      {onSnowballChange ? (
        <SnowballScenarioControlsPanel
          summary={buildScenarioControlsSummary({
            projectYears: draftProjectYears,
            investmentUsd,
            reinvestDividends,
            annualContributionUsd,
          })}
          onApply={onApply}
          canApply={canUpdateProjection}
          hasPendingChanges={hasPendingChanges}
          isApplying={isApplying}
        >
          <DividendScenarioPositionInputs
            variant="snowball"
            scenarioParams={snowballParams}
            onScenarioChange={onSnowballChange}
            sharePrice={sharePrice}
            investmentUsd={investmentUsd}
            shares={shares}
            annualContributionUsd={annualContributionUsd}
            reinvestDividends={reinvestDividends}
            projectYears={draftProjectYears}
            dripHint={`Use each year's dividend cash to buy more shares over the next ${draftProjectYears} years.`}
          />

          <div className="space-y-3 rounded-xl border border-border bg-surface-elevated/20 p-3">
            <div>
              <p className="text-xs font-medium text-foreground">
                Projection horizon
              </p>
              <p className="mt-1 text-[11px] text-muted">
                {dividendProjectionWindow(draftProjectYears).currentYear} →{" "}
                {dividendProjectionWindow(draftProjectYears).endYear} ·{" "}
                {scenario.dividendCagrPct.toFixed(1)}% avg dividend growth / yr
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
                    draftProjectYears === years
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
                value={draftProjectYears}
                onCommit={(next) =>
                  updateScenario({
                    projectYears: Math.max(1, Math.min(50, Math.round(next))),
                  })
                }
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm tabular-nums text-foreground"
              />
            </label>
          </div>
        </SnowballScenarioControlsPanel>
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
                  })} new cash over ${appliedProjectYears} yrs`
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
        } price growth over ${appliedProjectYears} years. `}
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
  limit = RECENT_PAYMENTS_ROW_COUNT,
}: {
  payments: DividendPaymentItem[];
  limit?: number;
}) {
  const rows = payments.slice(0, limit);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted">No recent payments were returned.</p>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto pr-1 scrollbar-dark">
        <table className="min-w-full text-left text-xs text-foreground">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 pr-4 font-normal">Payment date</th>
              <th className="py-2 font-normal tabular-nums">Amount / share</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((payment) => (
              <tr key={payment.date} className="border-t border-border">
                <td className="py-2 pr-4">{formatDate(payment.date)}</td>
                <td className="py-2 tabular-nums">
                  ${payment.amountPerShare.toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function DividendSnowballSkeleton() {
  return (
    <div className="space-y-4">
      <div className={DIVIDEND_KPI_GRID_CLASS}>
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-56 rounded-xl" />
      <Skeleton className="h-56 rounded-xl" />
    </div>
  );
}

export function DividendsPageSkeleton() {
  const panelClass = cn("flex flex-col", DIVIDEND_HISTORY_PANEL_MIN_CLASS);
  const panelBodyClass = "flex min-h-0 flex-1 flex-col";

  return (
    <div className="app-stack w-full max-w-none">
      <div className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
        <ResearchSectionCard
          title="Dividend history"
          description="How annual totals and each payout per share have changed over time"
          icon={LineChart}
          className={panelClass}
          bodyClassName={panelBodyClass}
        >
          <Skeleton className="h-full min-h-112 rounded-xl" />
        </ResearchSectionCard>

        <ResearchSectionCard
          title="Recent payments"
          description="Latest dividend payments per share"
          icon={History}
          className={panelClass}
          bodyClassName={panelBodyClass}
        >
          <SkeletonList
            rows={RECENT_PAYMENTS_ROW_COUNT}
            rowClassName="h-9 shrink-0 rounded-lg"
          />
        </ResearchSectionCard>
      </div>

      <ResearchSectionCard
        title="Dividend snowball"
        description="Historic payout growth and cash income on your share count"
        icon={TrendingUp}
        className="w-full max-w-none"
      >
        <DividendSnowballSkeleton />
      </ResearchSectionCard>
    </div>
  );
}
