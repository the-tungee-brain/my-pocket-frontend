"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { useEquityExitGuidance } from "@/app/hooks/useEquityExitGuidance";
import type { ExitConfidence, ExitVerdict } from "@/app/types/equityExitGuidance";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Skeleton } from "@/components/ui/Skeleton";
import type { PortfolioExitAttentionItem } from "@/app/types/equityExitGuidance";
import { appSectionLabelClass } from "@/lib/appUi";
import { symbolPositionPath } from "@/lib/symbolRoutes";
import { cn } from "@/lib/utils";

type Props = {
  symbol: string | null;
  accessToken?: string | null;
  enabled?: boolean;
  className?: string;
};

const VERDICT_LABEL: Record<ExitVerdict, string> = {
  HOLD: "Hold",
  TRIM: "Trim",
  REVIEW_SELL: "Review sell",
  EXIT: "Exit",
};

function verdictTone(verdict: ExitVerdict): string {
  switch (verdict) {
    case "HOLD":
      return "border-success/40 bg-success/10 text-success";
    case "TRIM":
      return "border-accent-highlight/40 bg-accent-highlight/10 text-accent-highlight";
    case "REVIEW_SELL":
      return "border-warning/40 bg-warning/10 text-warning";
    case "EXIT":
      return "border-danger/40 bg-danger/10 text-danger";
  }
}

function confidenceLabel(c: ExitConfidence): string {
  return c.charAt(0).toUpperCase() + c.slice(1);
}

function FactorList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        {title}
      </p>
      <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm text-foreground">
        {items.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

export function EquityExitGuidancePanel({
  symbol,
  accessToken,
  enabled = true,
  className,
}: Props) {
  const { guidance, isLoading, error } = useEquityExitGuidance(symbol, {
    accessToken,
    enabled,
  });

  if (!enabled || !symbol) return null;

  if (isLoading && !guidance) {
    return (
      <ResearchSectionCard
        title="Exit guidance"
        description="Hold quality and risk for this position"
        className={className}
      >
        <Skeleton className="h-24 w-full" />
      </ResearchSectionCard>
    );
  }

  if (error && !guidance) {
    return (
      <ResearchSectionCard
        title="Exit guidance"
        className={className}
      >
        <ErrorBanner message={error} />
      </ResearchSectionCard>
    );
  }

  if (!guidance?.eligible || !guidance.verdict) {
    return null;
  }

  const ctx = guidance.context;

  return (
    <ResearchSectionCard
      title="Exit guidance"
      description="Decision support — not a trade recommendation"
      icon={ShieldAlert}
      className={className}
    >
      <div className="space-y-4">
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-3",
            verdictTone(guidance.verdict),
          )}
        >
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
              Verdict
            </p>
            <p className="text-lg font-bold">{VERDICT_LABEL[guidance.verdict]}</p>
            {guidance.confidence && (
              <p className="text-xs opacity-80">
                {confidenceLabel(guidance.confidence)} confidence
                {guidance.exitUrgency != null
                  ? ` · urgency ${guidance.exitUrgency}/100`
                  : null}
              </p>
            )}
          </div>
          {ctx && (
            <div className="flex flex-wrap gap-2 text-xs">
              {ctx.tradeQualityScore != null && (
                <span className="rounded-md bg-background/60 px-2 py-1">
                  Quality {ctx.tradeQualityScore}
                </span>
              )}
              {ctx.positionWeightPct != null && (
                <span className="rounded-md bg-background/60 px-2 py-1">
                  Weight {ctx.positionWeightPct.toFixed(1)}%
                </span>
              )}
              {ctx.openProfitLossPct != null && (
                <span className="rounded-md bg-background/60 px-2 py-1">
                  P/L {ctx.openProfitLossPct >= 0 ? "+" : ""}
                  {ctx.openProfitLossPct.toFixed(1)}%
                </span>
              )}
            </div>
          )}
        </div>

        {guidance.primaryReason && (
          <p className="text-sm text-foreground">{guidance.primaryReason}</p>
        )}

        <FactorList title="Supporting factors" items={guidance.supportingFactors} />
        <FactorList title="Risk factors" items={guidance.riskFactors} />
        <FactorList title="Would improve verdict" items={guidance.wouldImprove} />
        <FactorList title="Would worsen verdict" items={guidance.wouldWorsen} />

        <p className="text-xs text-muted">{guidance.disclaimer}</p>
      </div>
    </ResearchSectionCard>
  );
}

type ExitAttentionRowProps = {
  items: PortfolioExitAttentionItem[];
  className?: string;
};

export function PortfolioExitAttentionRows({ items, className }: ExitAttentionRowProps) {
  if (items.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <p className={appSectionLabelClass}>Positions to review</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((row) => (
          <Link
            key={row.symbol}
            href={symbolPositionPath(row.symbol)}
            className="rounded-lg border border-border bg-background/60 px-3 py-2 transition-colors hover:border-accent-highlight/50"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-sm font-semibold text-accent-strong">
                {row.symbol}
              </span>
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                  verdictTone(row.verdict),
                )}
              >
                {VERDICT_LABEL[row.verdict]}
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-xs text-muted">{row.primaryReason}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
