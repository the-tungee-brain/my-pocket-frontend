"use client";

import { useSecFinancials } from "@/app/hooks/useSecResearch";
import { useSession } from "next-auth/react";
import type { FinancialLineItem } from "@/app/hooks/useSecResearch";
import type { SecPeriod } from "@/lib/secUtils";
import {
  formatLargeUsd,
  formatSecPeriodLabel,
} from "@/lib/secUtils";

const REVENUE_TAGS = new Set([
  "RevenueFromContractWithCustomerExcludingAssessedTax",
  "Revenues",
  "SalesRevenueNet",
]);

type SecFinancialsTrendSectionProps = {
  symbol: string;
  period: SecPeriod;
};

export function SecFinancialsTrendSection({
  symbol,
  period,
}: SecFinancialsTrendSectionProps) {
  const { data: session } = useSession();
  const { financials, isLoading, error } = useSecFinancials(symbol, period, 8, {
    accessToken: session?.accessToken,
  });

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-40 animate-pulse rounded-xl bg-muted-bg" />
        <div className="h-40 animate-pulse rounded-xl bg-muted-bg" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-muted">{error}</p>;
  }

  if (!financials) {
    return null;
  }

  const revenue = findLineItem(financials.income_statement, REVENUE_TAGS);
  const netIncome = findLineItem(financials.income_statement, ["NetIncomeLoss"]);
  const operatingCf = findLineItem(financials.cash_flow, [
    "NetCashProvidedByUsedInOperatingActivities",
  ]);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <MetricTrendCard title="Revenue (SEC filed)" lineItem={revenue} />
      <MetricTrendCard title="Net income (SEC filed)" lineItem={netIncome} />
      <MetricTrendCard
        title="Operating cash flow"
        lineItem={operatingCf}
        className="md:col-span-2"
      />
    </div>
  );
}

function findLineItem(
  items: FinancialLineItem[],
  tags: Set<string> | string[],
): FinancialLineItem | null {
  const tagSet = tags instanceof Set ? tags : new Set(tags);
  return items.find((item) => tagSet.has(item.tag)) ?? null;
}

function MetricTrendCard({
  title,
  lineItem,
  className,
}: {
  title: string;
  lineItem: FinancialLineItem | null;
  className?: string;
}) {
  if (!lineItem?.observations.length) {
    return (
      <div className={className}>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          {title}
        </h3>
        <p className="text-sm text-muted">No data available.</p>
      </div>
    );
  }

  const points = [...lineItem.observations].reverse();
  const maxValue = Math.max(...points.map((p) => Math.abs(p.value)), 1);

  return (
    <div className={className}>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
        {title}
      </h3>
      <div className="space-y-2">
        {points.map((point) => {
          const width = Math.max(4, (Math.abs(point.value) / maxValue) * 100);
          return (
            <div key={`${point.end}-${point.fiscal_period}`}>
              <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                <span className="text-muted">
                  {formatSecPeriodLabel(point.end, point.fiscal_period)}
                </span>
                <span className="font-medium tabular-nums text-foreground">
                  {formatLargeUsd(point.value)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted-bg">
                <div
                  className="h-full rounded-full bg-accent-strong/80"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
