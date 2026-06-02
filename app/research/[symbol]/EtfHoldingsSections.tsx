"use client";

import Link from "next/link";
import { useState } from "react";
import type { EtfHoldingItem, EtfHoldingsContext } from "@/app/types/research";
import { symbolHubPath } from "@/lib/symbolRoutes";
import { cn } from "@/lib/utils";

const BAR_CLASS = "bg-accent-strong/80";
const LABEL_CLASS = "min-w-0 truncate text-xs font-normal text-foreground";
const WEIGHT_CLASS = "shrink-0 text-xs font-normal tabular-nums text-muted";

const SECTOR_SLICE_COLORS = [
  "#6ee7b7",
  "#34d399",
  "#2dd4bf",
  "#22d3ee",
  "#38bdf8",
  "#818cf8",
  "#a78bfa",
  "#c084fc",
  "#f472b6",
  "#fb7185",
  "#fbbf24",
  "#fb923c",
];

type SectorSlice = {
  label: string;
  weight: number;
  color: string;
};

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

function describeDonutSlice(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
) {
  const span = endAngle - startAngle;
  if (span >= 359.999) {
    return [
      `M ${cx} ${cy - outerR}`,
      `A ${outerR} ${outerR} 0 1 1 ${cx - 0.001} ${cy - outerR}`,
      `L ${cx - 0.001} ${cy - innerR}`,
      `A ${innerR} ${innerR} 0 1 0 ${cx} ${cy - innerR}`,
      "Z",
    ].join(" ");
  }

  const outerStart = polarToCartesian(cx, cy, outerR, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerR, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerR, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerR, startAngle);
  const largeArc = span > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
    "Z",
  ].join(" ");
}

function buildSectorSlices(
  breakdown: Record<string, number>,
  limit: number,
): SectorSlice[] {
  const sorted = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, limit);
  const otherWeight = sorted.slice(limit).reduce((sum, [, weight]) => sum + weight, 0);
  const entries =
    otherWeight >= 0.01 ? [...top, ["Other", otherWeight] as const] : top;

  return entries.map(([label, weight], index) => ({
    label,
    weight,
    color: SECTOR_SLICE_COLORS[index % SECTOR_SLICE_COLORS.length] ?? "#6ee7b7",
  }));
}

type SectorDonutVariant = "preview" | "interactive";

function EtfSectorDonut({
  slices,
  variant = "preview",
}: {
  slices: SectorSlice[];
  variant?: SectorDonutVariant;
}) {
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const isLarge = variant === "interactive";
  const total = slices.reduce((sum, slice) => sum + slice.weight, 0);
  const cx = 50;
  const cy = 50;
  const outerR = 42;
  const innerR = 28;
  let cursor = 0;

  const paths = slices.flatMap((slice) => {
    const sweep = total > 0 ? (slice.weight / total) * 360 : 0;
    if (sweep <= 0) return [];

    const start = cursor;
    const end = cursor + sweep;
    cursor = end;

    return [
      {
        ...slice,
        d: describeDonutSlice(cx, cy, outerR, innerR, start, end),
      },
    ];
  });

  const defaultSlice = slices[0];
  const activeSlice =
    slices.find((slice) => slice.label === hoveredLabel) ?? defaultSlice;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div
        className="relative shrink-0"
        onMouseLeave={() => setHoveredLabel(null)}
      >
        <svg
          viewBox="0 0 100 100"
          className={isLarge ? "h-56 w-56 sm:h-64 sm:w-64" : "h-40 w-40"}
          role="group"
          aria-label="Sector allocation chart. Hover slices for details."
        >
          {paths.map((slice) => {
            const isActive = hoveredLabel === slice.label;
            const isDimmed = hoveredLabel != null && !isActive;

            return (
              <path
                key={slice.label}
                d={slice.d}
                fill={slice.color}
                stroke="var(--background)"
                strokeWidth={isActive ? 1 : 0.75}
                opacity={isDimmed ? 0.35 : 1}
                className="cursor-pointer transition-[opacity,stroke-width] duration-150 ease-out"
                onMouseEnter={() => setHoveredLabel(slice.label)}
                onFocus={() => setHoveredLabel(slice.label)}
                onBlur={() => setHoveredLabel(null)}
                tabIndex={0}
                role="button"
                aria-label={`${slice.label}, ${slice.weight.toFixed(2)} percent`}
              />
            );
          })}
        </svg>
        {activeSlice ? (
          <div
            className={cn(
              "pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center",
              isLarge ? "px-8" : "px-5",
            )}
          >
            <span
              className={cn(
                "truncate font-medium text-muted",
                isLarge
                  ? "max-w-[7.5rem] text-xs"
                  : "max-w-[5.5rem] text-[10px]",
              )}
            >
              {activeSlice.label}
            </span>
            <span
              className={cn(
                "font-semibold tabular-nums text-foreground",
                isLarge ? "text-xl" : "text-base",
              )}
            >
              {activeSlice.weight.toFixed(hoveredLabel ? 2 : 1)}%
            </span>
          </div>
        ) : null}
        <p className="sr-only" aria-live="polite">
          {activeSlice
            ? `${activeSlice.label}, ${activeSlice.weight.toFixed(2)} percent`
            : ""}
        </p>
      </div>
      <ul className="min-w-0 flex-1 space-y-1.5">
        {slices.map((slice) => {
          const isActive = hoveredLabel === slice.label;

          return (
            <li
              key={slice.label}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-xs transition-colors duration-150",
                isActive && "bg-muted-bg/70",
              )}
              onMouseEnter={() => setHoveredLabel(slice.label)}
              onMouseLeave={() => setHoveredLabel(null)}
            >
              <span
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full transition-transform duration-150",
                  isActive && "scale-125",
                )}
                style={{ backgroundColor: slice.color }}
              />
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-foreground",
                  !isActive && "text-foreground/90",
                )}
              >
                {slice.label}
              </span>
              <span className="shrink-0 tabular-nums text-muted">
                {slice.weight.toFixed(2)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

type WeightBarItem = {
  key: string;
  label: string;
  href?: string;
  weight: number;
};

function barWidth(weight: number, maxWeight: number): number {
  return Math.max((weight / maxWeight) * 100, 4);
}

function EtfWeightBarLabel({ label, href }: { label: string; href?: string }) {
  if (href) {
    return (
      <Link href={href} className={`${LABEL_CLASS} hover:underline`}>
        {label}
      </Link>
    );
  }

  return <span className={LABEL_CLASS}>{label}</span>;
}

function EtfWeightBarList({ items }: { items: WeightBarItem[] }) {
  if (items.length === 0) {
    return null;
  }

  const maxWeight = items[0]?.weight ?? 1;

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.key} className="space-y-1">
          <div className="flex items-center justify-between gap-3">
            <EtfWeightBarLabel label={item.label} href={item.href} />
            <span className={WEIGHT_CLASS}>{item.weight.toFixed(2)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted-bg">
            <div
              className={`h-full rounded-full ${BAR_CLASS}`}
              style={{
                width: `${barWidth(item.weight, maxWeight)}%`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

type SectorProps = {
  breakdown: Record<string, number>;
  limit?: number;
  variant?: SectorDonutVariant;
};

export function EtfSectorBreakdown({
  breakdown,
  limit = 8,
  variant = "preview",
}: SectorProps) {
  const slices = buildSectorSlices(breakdown, limit);

  if (slices.length === 0) {
    return (
      <p className="text-sm text-muted">Sector breakdown is not available.</p>
    );
  }

  return <EtfSectorDonut slices={slices} variant={variant} />;
}

type HoldingsProps = {
  holdings: EtfHoldingsContext["holdings"];
  totalHoldings?: number;
  limit?: number;
  showFooter?: boolean;
};

export function EtfTopHoldings({
  holdings,
  totalHoldings,
  limit = 8,
  showFooter = true,
}: HoldingsProps) {
  const rows = holdings.slice(0, limit);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted">No holdings were returned for this ETF.</p>
    );
  }

  const items: WeightBarItem[] = rows.map((holding) => ({
    key: `${holding.ticker ?? holding.name}-${holding.weight_pct}`,
    label: holding.ticker ?? holding.name,
    href: holding.ticker
      ? symbolHubPath(holding.ticker, "overview")
      : undefined,
    weight: holding.weight_pct,
  }));

  return (
    <div className="space-y-3">
      <EtfWeightBarList items={items} />
      <p className="text-[10px] text-muted">
        Bar length is relative to the largest position shown.
      </p>
      {showFooter && totalHoldings != null && rows.length < totalHoldings ? (
        <p className="text-xs text-muted">
          Showing {rows.length} of {totalHoldings.toLocaleString()} holdings.
        </p>
      ) : null}
    </div>
  );
}

type CompositionColumnsProps = {
  sectorBreakdown: Record<string, number>;
  holdings: EtfHoldingsContext["holdings"];
  totalHoldings?: number;
  sectorLimit?: number;
  holdingsLimit?: number;
  showHoldingsFooter?: boolean;
  stacked?: boolean;
  sectorDonutVariant?: SectorDonutVariant;
};

export function EtfCompositionSectionLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">
      {children}
    </p>
  );
}

export function EtfCompositionColumns({
  sectorBreakdown,
  holdings,
  totalHoldings,
  sectorLimit = 8,
  holdingsLimit = 8,
  showHoldingsFooter = true,
  stacked = false,
  sectorDonutVariant = "preview",
}: CompositionColumnsProps) {
  return (
    <div
      className={cn(
        "grid items-start gap-4",
        stacked ? "grid-cols-1" : "lg:grid-cols-2 lg:gap-6",
      )}
    >
      <div className="min-w-0">
        <EtfCompositionSectionLabel>Sector breakdown</EtfCompositionSectionLabel>
        <EtfSectorBreakdown
          breakdown={sectorBreakdown}
          limit={sectorLimit}
          variant={sectorDonutVariant}
        />
      </div>
      <div className="min-w-0">
        <EtfCompositionSectionLabel>Top holdings</EtfCompositionSectionLabel>
        <EtfTopHoldings
          holdings={holdings}
          totalHoldings={totalHoldings}
          limit={holdingsLimit}
          showFooter={showHoldingsFooter}
        />
      </div>
    </div>
  );
}

const FUND_STATS_GRID_CLASS = "grid grid-cols-2 gap-2 sm:gap-3";

export function EtfFundStats({
  holdings,
}: {
  holdings: EtfHoldingsContext;
}) {
  const stats = [
    holdings.aum ? { label: "AUM", value: holdings.aum } : null,
    holdings.expense_ratio
      ? { label: "Expense ratio", value: holdings.expense_ratio }
      : null,
    holdings.dividend_yield
      ? { label: "Dividend yield", value: holdings.dividend_yield }
      : null,
    holdings.total_holdings != null
      ? {
          label: "Holdings count",
          value: holdings.total_holdings.toLocaleString(),
        }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <div className={`${FUND_STATS_GRID_CLASS} min-w-0`}>
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="min-w-0 rounded-xl border border-border bg-background/60 px-2.5 py-2 sm:px-3 sm:py-2.5"
        >
          <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted">
            {stat.label}
          </p>
          <p className="mt-0.5 truncate text-xs font-semibold tabular-nums text-foreground sm:text-sm">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function formatPiotroski(value: number | null | undefined) {
  if (value == null) return "—";
  return `${value}/9`;
}

function formatAltmanZ(value: number | null | undefined) {
  if (value == null) return "—";
  return value.toFixed(1);
}

function EtfQualityTable({
  rows,
  tone,
}: {
  rows: EtfHoldingItem[];
  tone: "strong" | "weak";
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted">No scored holdings available.</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full min-w-[240px] text-left text-xs">
        <thead className="bg-background/60 text-muted">
          <tr>
            <th className="px-3 py-2 font-medium">Ticker</th>
            <th className="px-3 py-2 font-medium">Weight</th>
            <th className="px-3 py-2 font-medium">Piotroski</th>
            <th className="px-3 py-2 font-medium">Altman Z</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${tone}-${row.ticker ?? row.name}`} className="border-t border-border">
              <td className="px-3 py-2">
                {row.ticker ? (
                  <Link
                    href={symbolHubPath(row.ticker, "overview")}
                    className="font-normal text-foreground hover:underline"
                  >
                    {row.ticker}
                  </Link>
                ) : (
                  row.name
                )}
              </td>
              <td className="px-3 py-2 tabular-nums text-muted">
                {row.weight_pct.toFixed(2)}%
              </td>
              <td
                className={cn(
                  "px-3 py-2 tabular-nums",
                  tone === "strong" && (row.piotroskiF ?? 0) >= 7
                    ? "text-success"
                    : tone === "weak" && (row.piotroskiF ?? 9) <= 3
                      ? "text-danger"
                      : "text-foreground",
                )}
              >
                {formatPiotroski(row.piotroskiF)}
              </td>
              <td
                className={cn(
                  "px-3 py-2 tabular-nums",
                  tone === "strong" && (row.altmanZ ?? 0) >= 2.99
                    ? "text-success"
                    : tone === "weak" && (row.altmanZ ?? 99) < 1.81
                      ? "text-danger"
                      : "text-foreground",
                )}
              >
                {formatAltmanZ(row.altmanZ)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type QualityProps = {
  strongest?: EtfHoldingItem[];
  weakest?: EtfHoldingItem[];
  limit?: number;
  stacked?: boolean;
};

export function EtfQualityHoldings({
  strongest = [],
  weakest = [],
  limit = 5,
  stacked = false,
}: QualityProps) {
  const strongRows = strongest.slice(0, limit);
  const weakRows = weakest.slice(0, limit);

  if (strongRows.length === 0 && weakRows.length === 0) {
    return (
      <p className="text-sm text-muted">
        Quality scores are not available for this ETF&apos;s holdings yet. Refresh
        the page after the latest backend update, or check back once fundamentals
        data is available from our provider.
      </p>
    );
  }

  return (
    <div
      className={cn(
        "grid items-start gap-4",
        stacked ? "grid-cols-1" : "lg:grid-cols-2 lg:gap-6",
      )}
    >
      <div className="min-w-0">
        <EtfCompositionSectionLabel>Strongest holdings</EtfCompositionSectionLabel>
        <EtfQualityTable rows={strongRows} tone="strong" />
      </div>
      <div className="min-w-0">
        <EtfCompositionSectionLabel>Weakest holdings</EtfCompositionSectionLabel>
        <EtfQualityTable rows={weakRows} tone="weak" />
      </div>
    </div>
  );
}
