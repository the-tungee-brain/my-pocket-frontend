"use client";

import Link from "next/link";
import type { EtfHoldingsContext } from "@/app/types/research";
import { symbolHubPath } from "@/lib/symbolRoutes";

const BAR_CLASS = "bg-accent-strong/80";
const LABEL_CLASS = "min-w-0 truncate text-xs font-normal text-foreground";
const WEIGHT_CLASS = "shrink-0 text-xs font-normal tabular-nums text-muted";

type WeightBarItem = {
  key: string;
  label: string;
  href?: string;
  weight: number;
};

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
                width: `${Math.max((item.weight / maxWeight) * 100, 4)}%`,
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
};

export function EtfSectorBreakdown({ breakdown, limit = 8 }: SectorProps) {
  const sectors = Object.entries(breakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  if (sectors.length === 0) {
    return (
      <p className="text-sm text-muted">Sector breakdown is not available.</p>
    );
  }

  const items: WeightBarItem[] = sectors.map(([sector, weight]) => ({
    key: sector,
    label: sector,
    weight,
  }));

  return <EtfWeightBarList items={items} />;
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
}: CompositionColumnsProps) {
  return (
    <div className="grid items-start gap-4 lg:grid-cols-2 lg:gap-6">
      <div className="min-w-0">
        <EtfCompositionSectionLabel>Sector breakdown</EtfCompositionSectionLabel>
        <EtfSectorBreakdown breakdown={sectorBreakdown} limit={sectorLimit} />
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
    {
      label: "Holdings count",
      value: holdings.total_holdings.toLocaleString(),
    },
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-border bg-background/60 px-3 py-2.5"
        >
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
            {stat.label}
          </p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
}
