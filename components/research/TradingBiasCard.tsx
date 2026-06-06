"use client";

import { Activity, AlertTriangle, ShieldCheck } from "lucide-react";
import { useTraderPlaybook } from "@/app/hooks/useTraderPlaybook";
import { useTradingBias } from "@/app/hooks/useTradingBias";
import type {
  TraderPlaybookStatus,
  TradingBiasAlignment,
  TradingBiasLabel,
  TradingBiasLevels,
  TradingBiasResponse,
} from "@/app/types/research";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { Badge } from "@/components/ui/Badge";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

type TradingBiasCardProps = {
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

function ConfidenceBadge({
  value,
}: {
  value: TradingBiasResponse["confidence"];
}) {
  const variant =
    value === "High" ? "success" : value === "Medium" ? "accent" : "muted";
  return <Badge variant={variant}>{value} confidence</Badge>;
}

function EvidenceList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "bullish" | "bearish";
}) {
  const markerClass = tone === "bullish" ? "bg-success" : "bg-danger";

  return (
    <div className="rounded-lg border border-border bg-background/55 px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        {title}
      </p>
      {items.length ? (
        <ul className="mt-2 space-y-1.5">
          {items.slice(0, 3).map((item) => (
            <li
              key={item}
              className="flex gap-2 text-sm leading-snug text-foreground"
            >
              <span
                className={cn(
                  "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                  markerClass,
                )}
                aria-hidden="true"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted">No strong factors surfaced.</p>
      )}
    </div>
  );
}

function LevelsGrid({ levels }: { levels: TradingBiasLevels }) {
  const rows = [
    ["Support", levels.support],
    ["Resistance", levels.resistance],
    ["Breakout", levels.breakoutLevel],
    ["Stop invalid", levels.stopInvalidLevel],
  ] as const;

  return (
    <div className="grid gap-2 sm:grid-cols-4">
      {rows.map(([label, value]) => (
        <div
          key={label}
          className="rounded-lg border border-border bg-background/55 px-3 py-2"
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

function AlignmentGrid({ alignment }: { alignment: TradingBiasAlignment }) {
  const items = [
    ["Market", alignment.marketRegime],
    ["Relative strength", alignment.relativeStrength],
    ["Price structure", alignment.patternTrend],
    ["Volume", alignment.volume],
    ["Catalyst", alignment.catalyst],
  ] as const;

  return (
    <div className="flex flex-wrap gap-2">
      {items.map(([label, value]) => (
        <span
          key={label}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/20 px-2 py-1 text-[11px] text-muted"
        >
          <span className="font-semibold text-foreground">{label}</span>
          {value}
        </span>
      ))}
    </div>
  );
}

function TradingBiasSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-24 rounded-xl" />
      <div className="grid gap-3 md:grid-cols-2">
        <Skeleton className="h-28 rounded-lg" />
        <Skeleton className="h-28 rounded-lg" />
      </div>
      <Skeleton className="h-16 rounded-lg" />
    </div>
  );
}

function TradingBiasContent({
  data,
  playbookStatus,
}: {
  data: TradingBiasResponse;
  playbookStatus?: TraderPlaybookStatus | null;
}) {
  const action =
    playbookStatus === "NoSetup" || playbookStatus === "Waiting"
      ? "Watch"
      : data.action;

  return (
    <div className="space-y-4">
      <div className={cn("rounded-xl border px-4 py-4", BIAS_TONE[data.bias])}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
              Short-term daily bias
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span
                className={cn("h-2.5 w-2.5 rounded-full", BIAS_DOT[data.bias])}
                aria-hidden="true"
              />
              <p className="text-2xl font-bold leading-tight">{data.bias}</p>
              <ConfidenceBadge value={data.confidence} />
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed opacity-85">
              Educational signal based on daily price, market context, relative
              strength, volume, and levels.
            </p>
          </div>

          <div className="grid min-w-[220px] gap-2 sm:grid-cols-2 lg:text-right">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide opacity-75">
                Horizon
              </p>
              <p className="text-sm font-semibold">{data.horizon}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide opacity-75">
                Action
              </p>
              <p className="text-sm font-semibold">{action}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <EvidenceList
          title="Bullish evidence"
          items={data.bullishFactors}
          tone="bullish"
        />
        <EvidenceList
          title="Bearish evidence"
          items={data.bearishFactors}
          tone="bearish"
        />
      </div>

      <LevelsGrid levels={data.levels} />

      {data.invalidation ? (
        <div className="flex gap-2 rounded-lg border border-border bg-muted/20 px-3 py-3">
          <ShieldCheck
            className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong"
            aria-hidden="true"
          />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              Invalidation
            </p>
            <p className="mt-0.5 text-sm leading-relaxed text-foreground">
              {data.invalidation}
            </p>
          </div>
        </div>
      ) : null}

      <AlignmentGrid alignment={data.alignment} />

      {data.dataGaps.length ? (
        <div className="flex gap-2 rounded-lg border border-warning/25 bg-warning-muted px-3 py-3">
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0 text-warning"
            aria-hidden="true"
          />
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-warning">
              Data gaps
            </p>
            <p className="mt-0.5 text-sm text-foreground">
              {data.dataGaps.join("; ")}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function TradingBiasCard({
  symbol,
  accessToken,
  enabled = true,
  className,
}: TradingBiasCardProps) {
  const { tradingBias, isLoading, error } = useTradingBias(
    symbol,
    accessToken ?? undefined,
    {
      enabled,
    },
  );
  const { traderPlaybook } = useTraderPlaybook(symbol, accessToken ?? undefined, {
    enabled,
  });

  return (
    <ResearchSectionCard
      title="Trading bias"
      description="1-5 session trading bias and evidence"
      icon={Activity}
      className={className}
    >
      {error && !tradingBias ? (
        <ErrorBanner message={error} />
      ) : isLoading && !tradingBias ? (
        <TradingBiasSkeleton />
      ) : !tradingBias ? (
        <p className="text-sm text-muted">Trading bias is not available.</p>
      ) : (
        <TradingBiasContent
          data={tradingBias}
          playbookStatus={traderPlaybook?.status}
        />
      )}
    </ResearchSectionCard>
  );
}
