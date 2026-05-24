"use client";

import { Sparkles } from "lucide-react";
import type { ProactiveAlert } from "@/app/types/intelligence";
import { alertToQuickActionId, dedupeAlerts } from "@/lib/intelligence";
import { findQuickAction } from "@/lib/quickActions";
import { cn } from "@/lib/utils";

type Props = {
  symbol: string;
  alerts: ProactiveAlert[];
  onRunAlert?: (alert: ProactiveAlert) => void;
  className?: string;
};

function AlertChip({
  alert,
  onRun,
}: {
  alert: ProactiveAlert;
  onRun?: (alert: ProactiveAlert) => void;
}) {
  const actionId = alertToQuickActionId(alert);
  const quickAction = findQuickAction(actionId);
  const Icon = quickAction?.icon ?? Sparkles;

  return (
    <button
      type="button"
      disabled={!onRun}
      title={alert.reason}
      onClick={() => onRun?.(alert)}
      className="inline-flex max-w-full flex-col items-start gap-0.5 rounded-xl border border-border bg-background px-3 py-2 text-left transition hover:border-accent/40 hover:bg-muted-bg disabled:opacity-60"
    >
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0 text-accent-strong" aria-hidden />
        {alert.label}
      </span>
      <span className="line-clamp-2 text-[11px] text-muted">{alert.reason}</span>
    </button>
  );
}

export function SymbolAlertStrip({
  symbol,
  alerts,
  onRunAlert,
  className,
}: Props) {
  const symbolUpper = symbol.toUpperCase();
  const symbolAlerts = dedupeAlerts(
    alerts.filter(
      (alert) => alert.symbol?.toUpperCase() === symbolUpper,
    ),
  ).slice(0, 4);

  if (!symbolAlerts.length) return null;

  return (
    <section
      className={cn(
        "mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-secondary/40 shadow-sm",
        className,
      )}
      aria-label={`${symbolUpper} suggested actions`}
    >
      <div className="border-b border-border/80 px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">
          Suggested for {symbolUpper}
        </h3>
        <p className="mt-0.5 text-xs text-muted">
          Proactive alerts based on your holdings and expiring options
        </p>
      </div>
      <div className="grid gap-2 px-4 py-3 sm:grid-cols-2">
        {symbolAlerts.map((alert) => (
          <AlertChip
            key={`${alert.action}-${alert.priority}-${alert.reason}`}
            alert={alert}
            onRun={onRunAlert}
          />
        ))}
      </div>
    </section>
  );
}
