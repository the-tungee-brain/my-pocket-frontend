"use client";

import { Badge } from "@/components/ui/Badge";
import {
  formatRelativeTime,
  regimeNarrative,
  regimeRiskTone,
} from "@/lib/topMovers";
import {
  moversMetaBodyClass,
  moversMetaCardClass,
  moversMetaEyebrowClass,
  moversMetaInsetClass,
  moversMetaTitleClass,
} from "@/lib/moversUi";
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
      className={cn(moversMetaCardClass, className)}
      aria-label="Market environment"
    >
      <p className={moversMetaEyebrowClass}>Market environment</p>
      <h2 className={moversMetaTitleClass}>{narrative.title}</h2>
      <p className={moversMetaBodyClass}>{narrative.guidance}</p>
      <div className={moversMetaInsetClass}>
        <p className={moversMetaEyebrowClass}>Regime impact</p>
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
