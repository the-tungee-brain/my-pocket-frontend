"use client";

import {
  AlertTriangle,
  Clock,
  Gauge,
  LineChart,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useIntradayTradingBias } from "@/app/hooks/useIntradayTradingBias";
import type {
  IntradayTradingBiasLevels,
  IntradayTradingBiasResponse,
  TradingBiasLabel,
} from "@/app/types/research";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { Badge } from "@/components/ui/Badge";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

type IntradayTradingBiasCardProps = {
  symbol: string;
  accessToken?: string | null;
  enabled?: boolean;
  className?: string;
};

const BIAS_TONE: Record<TradingBiasLabel, string> = {
  Bullish: "border-success/35 bg-success/10 text-success",
  Neutral: "border-border bg-muted/30 text-foreground",
  Bearish: "border-danger/35 bg-danger/10 text-danger",
};

const BIAS_DOT: Record<TradingBiasLabel, string> = {
  Bullish: "bg-success",
  Neutral: "bg-muted",
  Bearish: "bg-danger",
};

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

function ConfidenceBadge({
  value,
}: {
  value: IntradayTradingBiasResponse["confidence"];
}) {
  const variant =
    value === "High" ? "success" : value === "Medium" ? "accent" : "muted";
  return <Badge variant={variant}>{value} confidence</Badge>;
}

function MetricTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="rounded-lg border border-border bg-background/55 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
        {Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
        {label}
      </div>
      <p className="mt-1 text-sm font-semibold leading-snug text-foreground">
        {value}
      </p>
    </div>
  );
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

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="rounded-lg border border-border bg-muted/15 px-3 py-2"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            {label}
          </p>
          <p className="mt-0.5 font-mono text-sm font-semibold text-foreground">
            {formatMoney(value)}
          </p>
        </div>
      ))}
    </div>
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
    <div
      className={cn(
        "flex gap-2 rounded-lg border px-3 py-3",
        tone === "warning"
          ? "border-warning/25 bg-warning-muted"
          : "border-border bg-muted/20",
      )}
    >
      <AlertTriangle
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          tone === "warning" ? "text-warning" : "text-muted",
        )}
        aria-hidden="true"
      />
      <div>
        <p
          className={cn(
            "text-[10px] font-semibold uppercase tracking-wide",
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
    </div>
  );
}

function IntradayBiasSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-24 rounded-xl" />
      <div className="grid gap-3 md:grid-cols-4">
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
        <Skeleton className="h-20 rounded-lg" />
      </div>
      <Skeleton className="h-24 rounded-lg" />
    </div>
  );
}

function IntradayBiasContent({ data }: { data: IntradayTradingBiasResponse }) {
  const openingRangeStatus =
    data.levels.openRangeHigh != null && data.levels.openRangeLow != null
      ? "Complete"
      : "Pending or unavailable";

  return (
    <div className="space-y-4">
      <div className={cn("rounded-xl border px-4 py-4", BIAS_TONE[data.bias])}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
              Intraday signal. Separate from 1-5 session Trading Bias.
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span
                className={cn("h-2.5 w-2.5 rounded-full", BIAS_DOT[data.bias])}
                aria-hidden="true"
              />
              <p className="text-2xl font-bold leading-tight">{data.bias}</p>
              <ConfidenceBadge value={data.confidence} />
              <Badge variant="warning">Delayed</Badge>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed opacity-85">
              Uses delayed 5-minute market data. This does not replace the
              1-5 session Trading Bias.
            </p>
          </div>

          <div className="grid min-w-[220px] gap-2 sm:grid-cols-2 lg:text-right">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide opacity-75">
                Setup
              </p>
              <p className="text-sm font-semibold">
                {formatLabel(data.setupType)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide opacity-75">
                Action
              </p>
              <p className="text-sm font-semibold">
                {formatLabel(data.action)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="VWAP state"
          value={formatLabel(data.alignment.vwap)}
          icon={Gauge}
        />
        <MetricTile
          label="Opening range"
          value={openingRangeStatus}
          icon={LineChart}
        />
        <MetricTile
          label="Market"
          value={formatLabel(data.alignment.market)}
        />
        <MetricTile
          label="Freshness"
          value={formatFreshness(data)}
          icon={Clock}
        />
      </div>

      <LevelsGrid levels={data.levels} />

      {data.reasons.length ? (
        <div className="rounded-lg border border-border bg-background/55 px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Why it reads this way
          </p>
          <ul className="mt-2 space-y-1.5">
            {data.reasons.slice(0, 4).map((reason) => (
              <li
                key={reason}
                className="flex gap-2 text-sm leading-snug text-foreground"
              >
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
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
  className,
}: IntradayTradingBiasCardProps) {
  const { intradayTradingBias, isLoading, error } = useIntradayTradingBias(
    symbol,
    accessToken ?? undefined,
    {
      enabled,
    },
  );

  return (
    <ResearchSectionCard
      title="Delayed Intraday Bias"
      description="Delayed 5-minute intraday setup read"
      icon={Clock}
      className={className}
    >
      {error && !intradayTradingBias ? (
        <ErrorBanner message={error} />
      ) : isLoading && !intradayTradingBias ? (
        <IntradayBiasSkeleton />
      ) : !intradayTradingBias ? (
        <p className="text-sm text-muted">
          Delayed intraday bias is not available.
        </p>
      ) : (
        <IntradayBiasContent data={intradayTradingBias} />
      )}
    </ResearchSectionCard>
  );
}
