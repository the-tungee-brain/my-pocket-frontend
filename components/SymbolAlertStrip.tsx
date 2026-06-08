"use client";

import { Sparkles } from "lucide-react";
import type { ProactiveAlert } from "@/app/types/intelligence";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { alertToQuickActionId, dedupeAlerts } from "@/lib/intelligence";
import { findQuickAction } from "@/lib/quickActions";
import { cn } from "@/lib/utils";

type Props = {
  symbol: string;
  alerts: ProactiveAlert[];
  onRunAlert?: (alert: ProactiveAlert) => void;
  className?: string;
  showHeader?: boolean;
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
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0 text-accent-strong" aria-hidden />
        {alert.label}
      </span>
      <span className="line-clamp-2 text-xs text-muted">{alert.reason}</span>
    </button>
  );
}

export function SymbolAlertStrip({
  symbol,
  alerts,
  onRunAlert,
  className,
  showHeader = true,
}: Props) {
  const symbolUpper = symbol.toUpperCase();
  const symbolAlerts = dedupeAlerts(
    alerts.filter(
      (alert) => alert.symbol?.toUpperCase() === symbolUpper,
    ),
  ).slice(0, 4);

  if (!symbolAlerts.length) return null;

  return (
    <Card
      surface="subtle"
      className={cn("mx-0 bg-secondary/40", className)}
      aria-label={`${symbolUpper} suggested actions`}
    >
      {showHeader && (
        <CardHeader className="border-border/80">
          <CardTitle
            title={`Suggested for ${symbolUpper}`}
            description="Proactive alerts based on your holdings and expiring options"
          />
        </CardHeader>
      )}
      <CardBody className="grid gap-2 py-3 sm:grid-cols-2">
        {symbolAlerts.map((alert) => (
          <AlertChip
            key={`${alert.action}-${alert.priority}-${alert.reason}`}
            alert={alert}
            onRun={onRunAlert}
          />
        ))}
      </CardBody>
    </Card>
  );
}
