"use client";

import { Badge } from "@/components/ui/Badge";
import {
  formatRelativeTime,
  regimeNarrative,
  regimeRiskTone,
} from "@/lib/topMovers";
import { cn } from "@/lib/utils";

type Props = {
  regimeId: string | null | undefined;
  asOfDate?: string | null;
  updatedAt?: string | null;
  systemStatus?: string;
  className?: string;
};

export function MarketRegimeCard({
  regimeId,
  asOfDate,
  updatedAt,
  systemStatus,
  className,
}: Props) {
  const narrative = regimeNarrative(regimeId);
  const riskTone = regimeRiskTone(regimeId);
  const riskLabel =
    riskTone === "risk-on"
      ? "Risk-on"
      : riskTone === "risk-off"
        ? "Risk-off"
        : "Mixed";

  const statusLabel =
    systemStatus === "ok"
      ? "Pipeline OK"
      : systemStatus
        ? systemStatus.charAt(0).toUpperCase() + systemStatus.slice(1)
        : null;

  return (
    <section
      className={cn("app-panel space-y-3 px-4 py-4", className)}
      aria-label="Market environment"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        Market environment
      </p>
      <h2 className="text-lg font-semibold leading-snug text-foreground">
        {narrative.title}
      </h2>
      <p className="text-sm leading-relaxed text-muted">{narrative.guidance}</p>
      <div className="space-y-1.5 rounded-lg border border-border bg-muted-bg/30 px-3 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          Regime impact
        </p>
        <p className="text-sm font-medium text-foreground">
          {narrative.signalImpact}
        </p>
        <p className="text-xs leading-relaxed text-muted">
          {narrative.confidenceNote}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant={
            riskTone === "risk-on"
              ? "success"
              : riskTone === "risk-off"
                ? "warning"
                : "muted"
          }
        >
          {riskLabel}
        </Badge>
        {statusLabel ? (
          <Badge
            variant={
              systemStatus === "ok"
                ? "success"
                : systemStatus === "degraded"
                  ? "warning"
                  : "danger"
            }
          >
            {statusLabel}
          </Badge>
        ) : null}
      </div>
      <p className="text-xs text-muted">
        {asOfDate ? `As of ${asOfDate}` : null}
        {asOfDate && updatedAt ? " · " : null}
        {formatRelativeTime(updatedAt)}
      </p>
    </section>
  );
}
