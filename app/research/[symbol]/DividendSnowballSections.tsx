"use client";

import type {
  AnnualDividendIncome,
  DividendHistoryContext,
  DividendPaymentItem,
} from "@/app/types/research";
import { formatUsd } from "@/lib/formatCurrency";

const BAR_FILL = "#34d399";
const BAR_FILL_PARTIAL = "#6ee7b7";
const LINE_STROKE = "#34d399";
const GRID_STROKE = "currentColor";

function formatPct(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(1)}%`;
}

function formatPerShare(value: number): string {
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.1) return `$${value.toFixed(3)}`;
  return `$${value.toFixed(4)}`;
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

type StatProps = {
  label: string;
  value: string;
  hint?: string;
};

function StatCard({ label, value, hint }: StatProps) {
  return (
    <div className="rounded-xl border border-border bg-surface-elevated/40 px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
        {value}
      </p>
      {hint ? <p className="mt-1 text-[11px] text-muted">{hint}</p> : null}
    </div>
  );
}

export function DividendSnowballStats({ history }: { history: DividendHistoryContext }) {
  const { scenario } = history;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <StatCard
        label="Annual increases"
        value={
          history.consecutiveAnnualIncreases > 0
            ? `${history.consecutiveAnnualIncreases} yrs`
            : "—"
        }
        hint="Consecutive years dividend per share rose"
      />
      <StatCard
        label="5Y dividend CAGR"
        value={formatPct(history.cagr5yPct)}
        hint="Completed calendar years only"
      />
      <StatCard
        label={`${scenario.latestYear} income`}
        value={formatUsd(scenario.annualIncomeLatest, { maximumFractionDigits: 0 })}
        hint={`On ${scenario.shares.toLocaleString()} shares`}
      />
      <StatCard
        label={`Since ${scenario.startYear}`}
        value={formatUsd(scenario.totalCollected, { maximumFractionDigits: 0 })}
        hint="Cash dividends collected (no DRIP)"
      />
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
  const chartRows = rows.slice(-limit);
  if (chartRows.length === 0) {
    return (
      <p className="text-sm text-muted">Annual dividend totals are not available.</p>
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

  return (
    <div className="space-y-3">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-56 w-full text-border"
        role="img"
        aria-label="Annual dividend totals per share"
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
          return (
            <g key={row.year}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 2)}
                rx={3}
                fill={row.isPartialYear ? BAR_FILL_PARTIAL : BAR_FILL}
                fillOpacity={row.isPartialYear ? 0.65 : 0.95}
              >
                <title>
                  {row.year}: {formatPerShare(row.totalPerShare)}
                  {row.isPartialYear ? " (YTD)" : ""}
                </title>
              </rect>
              <text
                x={x + barWidth / 2}
                y={height - 10}
                textAnchor="middle"
                className="fill-muted text-[10px]"
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
  const chartPayments = payments.slice(-limit);
  if (chartPayments.length === 0) {
    return (
      <p className="text-sm text-muted">Dividend payout history is not available.</p>
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
  const step = chartPayments.length > 1 ? plotWidth / (chartPayments.length - 1) : 0;

  const points = chartPayments.map((payment, index) => {
    const x = padding.left + index * step;
    const y =
      padding.top + plotHeight - (payment.amountPerShare / maxValue) * plotHeight;
    return { payment, x, y };
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

  return (
    <div className="space-y-3">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-56 w-full text-border"
        role="img"
        aria-label="Dividend payout per share over time"
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

        <path d={areaPath} fill={LINE_STROKE} fillOpacity={0.12} />
        <path
          d={linePath}
          fill="none"
          stroke={LINE_STROKE}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map(({ payment, x, y }) => (
          <circle key={payment.date} cx={x} cy={y} r={3.5} fill={LINE_STROKE}>
            <title>
              {formatDate(payment.date)}: {formatPerShare(payment.amountPerShare)}
            </title>
          </circle>
        ))}

        {points.map(({ payment, x }, index) =>
          xLabelIndexes.has(index) ? (
            <text
              key={`${payment.date}-label`}
              x={x}
              y={height - 10}
              textAnchor="middle"
              className="fill-muted text-[10px]"
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
  onSharesChange,
}: {
  history: DividendHistoryContext;
  onSharesChange?: (shares: number) => void;
}) {
  const { scenario } = history;
  const growthPct =
    scenario.annualIncomeStart > 0
      ? ((scenario.annualIncomeLatest - scenario.annualIncomeStart) /
          scenario.annualIncomeStart) *
        100
      : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">Income snowball</p>
          <p className="mt-1 text-xs text-muted">
            Compare annual dividend cash from {scenario.startYear} to{" "}
            {scenario.latestYear} on the same share count.
          </p>
        </div>
        {onSharesChange ? (
          <label className="flex items-center gap-2 text-xs text-muted">
            Shares
            <input
              type="number"
              min={1}
              max={1000000}
              step={1}
              defaultValue={scenario.shares}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (Number.isFinite(next) && next > 0) {
                  onSharesChange(Math.round(next));
                }
              }}
              className="w-24 rounded-md border border-border bg-background px-2 py-1 text-sm tabular-nums text-foreground"
            />
          </label>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface-elevated/40 px-3 py-3">
          <p className="text-[11px] uppercase tracking-wide text-muted">
            {scenario.startYear}
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {formatUsd(scenario.annualIncomeStart, { maximumFractionDigits: 0 })}
          </p>
          <p className="mt-1 text-xs text-muted">Annual dividend cash</p>
        </div>
        <div className="rounded-xl border border-border bg-surface-elevated/40 px-3 py-3">
          <p className="text-[11px] uppercase tracking-wide text-muted">
            {scenario.latestYear}
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {formatUsd(scenario.annualIncomeLatest, { maximumFractionDigits: 0 })}
          </p>
          <p className="mt-1 text-xs text-muted">
            {growthPct != null && growthPct > 0
              ? `Up ${growthPct.toFixed(0)}% vs ${scenario.startYear}`
              : "Annual dividend cash"}
          </p>
        </div>
      </div>

      <p className="rounded-lg border border-border/70 bg-muted-bg/40 px-3 py-2 text-xs text-muted">
        Total cash collected since {scenario.startYear}:{" "}
        <span className="font-medium text-foreground">
          {formatUsd(scenario.totalCollected, { maximumFractionDigits: 0 })}
        </span>
        . Assumes dividends were taken as cash, not reinvested (DRIP coming later).
        Past dividend growth does not guarantee future payouts.
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
    return <p className="text-sm text-muted">No recent payments were returned.</p>;
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
              <td className="py-2 pr-4 text-foreground">{formatDate(payment.date)}</td>
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
          <div key={index} className="h-20 animate-pulse rounded-xl bg-muted-bg" />
        ))}
      </div>
      <div className="h-56 animate-pulse rounded-xl bg-muted-bg" />
      <div className="h-56 animate-pulse rounded-xl bg-muted-bg" />
    </div>
  );
}
