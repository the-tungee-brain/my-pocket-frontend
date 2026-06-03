"use client";

import { Badge } from "@/components/ui/Badge";
import {
  formatRegimeLabel,
  formatRelativeTime,
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
  const riskTone = regimeRiskTone(regimeId);
  const riskLabel =
    riskTone === "risk-on"
      ? "Risk-on"
      : riskTone === "risk-off"
        ? "Risk-off"
        : "Mixed";

  return (
    <section
      className={cn(
        "app-panel flex flex-wrap items-center justify-between gap-3 px-4 py-3",
        className,
      )}
      aria-label="Market regime"
    >
      <div className="min-w-0 space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
          Market regime
        </p>
        <p className="font-mono text-sm font-semibold text-foreground">
          {formatRegimeLabel(regimeId)}
        </p>
        <p className="text-xs text-muted">
          {asOfDate ? `As of ${asOfDate}` : null}
          {asOfDate && updatedAt ? " · " : null}
          {formatRelativeTime(updatedAt)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant={riskTone === "risk-on" ? "success" : riskTone === "risk-off" ? "warning" : "muted"}
        >
          {riskLabel}
        </Badge>
        {systemStatus ? (
          <Badge
            variant={
              systemStatus === "ok"
                ? "success"
                : systemStatus === "degraded"
                  ? "warning"
                  : "danger"
            }
          >
            {systemStatus}
          </Badge>
        ) : null}
      </div>
    </section>
  );
}
