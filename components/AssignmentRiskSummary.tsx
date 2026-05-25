"use client";

import { Timer } from "lucide-react";
import type { AssignmentRiskSummary as AssignmentRiskSummaryData } from "@/app/types/schwab";
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
  high: "border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  moderate: "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200",
  watch: "border-border bg-secondary/70 text-muted",
  low: "border-border bg-secondary/50 text-muted",
};

function riskBadgeClass(level: string) {
  return cn(
    "inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
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
    <section
      className={cn(
        "mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-secondary/40 shadow-sm",
        className,
      )}
      aria-label="Expiring options assignment risk"
    >
      <div className="border-b border-border/80 px-4 py-3 sm:px-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-strong">
            <Timer className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Expiring short options
            </h3>
            <p className="mt-0.5 text-xs leading-relaxed text-muted">
              {compact
                ? `${summary.positions.length} leg(s) expiring within ${summary.withinDays} days.`
                : `Short options expiring within ${summary.withinDays} days. Run Assignment risk in chat for ITM analysis and recommended actions.`}
            </p>
          </div>
          {urgentCount > 0 && (
            <span className={riskBadgeClass("high")}>
              {urgentCount} urgent
            </span>
          )}
        </div>
      </div>

      <ul className="divide-y divide-border/70">
        {summary.positions.map((entry) => {
          const label = entry.underlyingSymbol ?? entry.symbol;
          const optionType = entry.putCall === "PUT" ? "put" : "call";

          return (
            <li
              key={`${entry.symbol}-${entry.expiration}-${entry.strike}`}
              className="flex items-start justify-between gap-3 px-4 py-3 sm:px-5"
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
                  {entry.moneyness !== "unknown" && (
                    <> · {entry.moneyness}</>
                  )}
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
    </section>
  );
}
