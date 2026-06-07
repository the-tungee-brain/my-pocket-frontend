"use client";

import { Clock } from "lucide-react";
import { useIntradayTradingBias } from "@/app/hooks/useIntradayTradingBias";
import type {
  IntradayTradingBiasLevels,
  IntradayTradingBiasResponse,
  TradingBiasLabel,
} from "@/app/types/research";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import {
  ResearchMetricList,
  type ResearchMetricListItem,
  researchMemo,
} from "@/components/research/ResearchMemoPrimitives";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

type IntradayTradingBiasCardProps = {
  symbol: string;
  accessToken?: string | null;
  enabled?: boolean;
  variant?: "card" | "plain";
  className?: string;
};

const BIAS_TONE: Record<TradingBiasLabel, string> = {
  Bullish: "text-success",
  Neutral: "text-foreground",
  Bearish: "text-danger",
};

const INACTIVE_STALENESS_SECONDS = 60 * 60;

function formatMoney(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "N/A";
  return `$${value.toFixed(2)}`;
}

function formatLabel(value: string): string {
  const explicitLabels: Record<string, string> = {
    ConfirmBreakout: "Confirm Breakout",
    FailedBreakout: "Failed Breakout",
    GapAndGo: "Gap And Go",
    GapFade: "Gap Fade",
    OpeningRangeBreakout: "Opening Range Breakout",
    RangeDay: "Range Day",
    RiskOff: "Risk Off",
    TrendDay: "Trend Day",
    VWAPReclaim: "VWAP Reclaim",
    WaitForPullback: "Wait For Pullback",
  };
  if (explicitLabels[value]) return explicitLabels[value];

  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatFreshness(data: IntradayTradingBiasResponse): string {
  const parts: string[] = [];
  if (data.lastUpdated) {
    const timestamp = new Date(data.lastUpdated);
    if (!Number.isNaN(timestamp.getTime())) {
      parts.push(
        `Last bar ${timestamp.toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
        })}`,
      );
    }
  }
  if (typeof data.stalenessSeconds === "number") {
    const minutes = Math.max(0, Math.round(data.stalenessSeconds / 60));
    parts.push(minutes <= 0 ? "fresh just now" : `${minutes} min stale`);
  }
  parts.push(data.provider);
  return parts.join(" · ");
}

function isInactiveIntradayRead(data: IntradayTradingBiasResponse): boolean {
  if (
    typeof data.stalenessSeconds === "number" &&
    data.stalenessSeconds > INACTIVE_STALENESS_SECONDS
  ) {
    return true;
  }
  const inactiveCopy = [...data.warnings, ...data.dataGaps]
    .join(" ")
    .toLowerCase();
  return (
    inactiveCopy.includes("outside market hours") ||
    inactiveCopy.includes("market is closed") ||
    inactiveCopy.includes("intraday read is stale")
  );
}

function isNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function LevelsGrid({ levels }: { levels: IntradayTradingBiasLevels }) {
  const rows = [
    ["Premarket high", levels.premarketHigh],
    ["Premarket low", levels.premarketLow],
    ["Open range high", levels.openRangeHigh],
    ["Open range low", levels.openRangeLow],
    ["VWAP", levels.vwap],
    ["Support", levels.support],
    ["Resistance", levels.resistance],
    ["Invalidation", levels.invalidation],
  ] as const;
  const availableRows = rows.filter(([, value]) => isNumber(value));
  if (!availableRows.length) return null;

  return (
    <ResearchMetricList
      columns={4}
      items={availableRows.map(([label, value]) => ({
        label,
        value: formatMoney(value),
      }))}
    />
  );
}

function MessageList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "warning" | "muted";
}) {
  if (!items.length) return null;

  return (
    <div>
      <p
        className={cn(
          researchMemo.rowLabel,
          tone === "warning" ? "text-warning" : "text-muted",
        )}
      >
        {title}
      </p>
      <ul className="mt-1 space-y-1 text-sm leading-relaxed text-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function IntradayBiasSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-7 w-64" />
      <Skeleton className="h-4 w-full max-w-xl" />
      <Skeleton className="h-4 w-full max-w-lg" />
    </div>
  );
}

function IntradayBiasContent({ data }: { data: IntradayTradingBiasResponse }) {
  const inactive = isInactiveIntradayRead(data);
  const hasVwap = isNumber(data.levels.vwap);
  const hasOpeningRange =
    isNumber(data.levels.openRangeHigh) && isNumber(data.levels.openRangeLow);
  const openingRangeStatus = hasOpeningRange
    ? "Complete"
    : "Pending or unavailable";
  const headerTone = inactive ? "text-foreground" : BIAS_TONE[data.bias];
  const priorRead =
    data.bias === "Neutral"
      ? "Previous session ended neutral."
      : `Previous session ended ${data.bias.toLowerCase()}.`;
  const rawSummaryItems: Array<ResearchMetricListItem | null> = [
    hasVwap
      ? {
          label: "VWAP",
          value: formatLabel(data.alignment.vwap),
        }
      : null,
    hasOpeningRange
      ? {
          label: "Opening range",
          value: openingRangeStatus,
        }
      : null,
    {
      label: "Market",
      value: formatLabel(data.alignment.market),
    },
    {
      label: "Freshness",
      value: formatFreshness(data),
    },
  ];
  const summaryItems = rawSummaryItems.filter(
    (item): item is ResearchMetricListItem => item !== null,
  );

  return (
    <div className="space-y-4">
      <div>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <p className={cn("text-sm font-semibold", headerTone)}>
            {inactive
              ? `Previous session ${data.bias.toLowerCase()}`
              : data.bias}
          </p>
          <span className="text-sm text-muted">·</span>
          <p className="text-sm font-medium text-muted">
            {data.confidence} confidence ·{" "}
            {inactive ? "Not live" : formatLabel(data.action)}
          </p>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {inactive
            ? priorRead
            : `${formatLabel(data.setupType)} setup from delayed 5-minute data.`}
        </p>
      </div>

      <ResearchMetricList columns={4} items={summaryItems} />

      <LevelsGrid levels={data.levels} />

      {data.reasons.length ? (
        <div>
          <p className={researchMemo.rowLabel}>Why it reads this way</p>
          <ul className="mt-2 space-y-1.5">
            {data.reasons.slice(0, 4).map((reason) => (
              <li
                key={reason}
                className="flex gap-2 text-sm leading-snug text-foreground"
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 bg-accent"
                  aria-hidden="true"
                />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <MessageList title="Warnings" items={data.warnings} tone="warning" />
      <MessageList title="Data gaps" items={data.dataGaps} tone="muted" />
    </div>
  );
}

export function IntradayTradingBiasCard({
  symbol,
  accessToken,
  enabled = true,
  variant = "card",
  className,
}: IntradayTradingBiasCardProps) {
  const { intradayTradingBias, isLoading, error } = useIntradayTradingBias(
    symbol,
    accessToken ?? undefined,
    {
      enabled,
    },
  );
  const inactive = intradayTradingBias
    ? isInactiveIntradayRead(intradayTradingBias)
    : false;
  const content =
    error && !intradayTradingBias ? (
      <ErrorBanner message={error} />
    ) : isLoading && !intradayTradingBias ? (
      <IntradayBiasSkeleton />
    ) : !intradayTradingBias ? (
      <p className="text-sm text-muted">
        Delayed intraday bias is not available.
      </p>
    ) : (
      <IntradayBiasContent data={intradayTradingBias} />
    );

  if (variant === "plain") {
    return <div className={className}>{content}</div>;
  }

  return (
    <ResearchSectionCard
      title={inactive ? "Latest Intraday Read" : "Delayed Intraday Bias"}
      description={
        inactive
          ? "Previous session read; not a live signal"
          : "Delayed 5-minute intraday setup read"
      }
      icon={Clock}
      className={className}
    >
      {content}
    </ResearchSectionCard>
  );
}
