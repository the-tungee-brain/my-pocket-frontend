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
  Bullish: "text-success",
  Neutral: "text-foreground",
  Bearish: "text-danger",
};

function formatMoney(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value))
    return "Unavailable";
  return `$${value.toFixed(2)}`;
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
  const markerClass = tone === "bullish" ? "text-success" : "text-danger";

  return (
    <div>
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
              <span className={cn("mt-0.5 shrink-0", markerClass)} aria-hidden>
                —
              </span>
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
    <div className="grid gap-x-8 gap-y-3 sm:grid-cols-4">
      {rows.map(([label, value]) => (
        <div key={label}>
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
    <p className="text-xs leading-relaxed text-muted">
      {items.map(([label, value]) => (
        <span key={label} className="mr-3 inline-block">
          <span className="font-medium text-foreground">{label}</span> {value}
        </span>
      ))}
    </p>
  );
}

function TradingBiasSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-7 w-64" />
      <div className="grid gap-3 md:grid-cols-2">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
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
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <p
          className={cn(
            "text-xl font-semibold leading-tight",
            BIAS_TONE[data.bias],
          )}
        >
          {data.bias}
        </p>
        <span className="text-sm text-muted">·</span>
        <p className="text-sm font-medium text-muted">
          {data.confidence} confidence · {data.horizon} · {action}
        </p>
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
        <div className="flex gap-2">
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
        <div className="flex gap-2">
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
  const { traderPlaybook } = useTraderPlaybook(
    symbol,
    accessToken ?? undefined,
    {
      enabled,
    },
  );

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
