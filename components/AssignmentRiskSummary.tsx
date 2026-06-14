"use client";

import { Timer } from "lucide-react";
import type { AssignmentRiskSummary as AssignmentRiskSummaryData } from "@/app/types/schwab";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatUsd } from "@/lib/formatCurrency";
import { formatOptionExpiration } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

type Props = {
  summary: AssignmentRiskSummaryData;
  compact?: boolean;
  className?: string;
};

const RISK_STYLES: Record<string, string> = {
  critical: "border-danger/40 bg-danger/10 text-danger",
  high: "border-warning/40 bg-warning-muted text-warning",
  moderate: "border-warning/30 bg-warning-muted/60 text-warning",
  watch: "border-border bg-secondary/70 text-muted",
  low: "border-border bg-secondary/50 text-muted",
};

function riskBadgeClass(level: string) {
  return cn(
    "inline-flex shrink-0 border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
    RISK_STYLES[level] ?? RISK_STYLES.watch,
  );
}

function formatStrategy(strategy: string) {
  const labels: Record<string, string> = {
    cash_secured_put: "Cash-secured put",
    covered_call: "Covered call",
    naked_call: "Uncovered call",
  };
  return labels[strategy] ?? strategy.replaceAll("_", " ");
}

export function AssignmentRiskSummary({
  summary,
  compact = false,
  className,
}: Props) {
  if (summary.positions.length === 0) return null;

  const urgentCount = summary.positions.filter((entry) =>
    ["critical", "high"].includes(entry.riskLevel),
  ).length;

  return (
    <Card
      surface="subtle"
      className={cn("flex h-full min-h-0 flex-col", className)}
      aria-label="Expiring options assignment risk"
    >
      <CardHeader>
        <CardTitle
          title="Expiring short options"
          description={
            compact
              ? `${summary.positions.length} leg(s) expiring within ${summary.withinDays} days.`
              : `Short options expiring within ${summary.withinDays} days. Run Assignment risk in chat for ITM analysis and recommended actions.`
          }
          icon={
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center bg-accent/15 text-accent-strong">
              <Timer className="h-4 w-4" aria-hidden />
            </div>
          }
          badge={
            urgentCount > 0 ? (
              <span className={riskBadgeClass("high")}>
                {urgentCount} urgent
              </span>
            ) : undefined
          }
        />
      </CardHeader>

      <ul className="min-h-0 flex-1 divide-y divide-border/70 overflow-y-auto">
        {summary.positions.map((entry) => {
          const label = entry.underlyingSymbol ?? entry.symbol;
          const optionType = entry.putCall === "PUT" ? "put" : "call";

          return (
            <li
              key={`${entry.symbol}-${entry.expiration}-${entry.strike}`}
              className="flex items-start justify-between gap-3 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  <span className="font-mono">{label}</span>
                  <span className="text-muted"> · </span>
                  <span className="text-muted">
                    {entry.strike != null
                      ? formatUsd(entry.strike, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })
                      : "—"}{" "}
                    {optionType}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  {formatStrategy(entry.strategy)} ·{" "}
                  {formatOptionExpiration(entry.expiration)}
                  {entry.moneyness !== "unknown" && <> · {entry.moneyness}</>}
                </p>
                {entry.assignmentCashRequired != null && (
                  <p className="mt-1 text-xs text-muted">
                    Assignment cash:{" "}
                    <span className="font-medium tabular-nums text-foreground">
                      {formatUsd(entry.assignmentCashRequired)}
                    </span>
                  </p>
                )}
              </div>
              <span className={riskBadgeClass(entry.riskLevel)}>
                {entry.riskLevel}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
