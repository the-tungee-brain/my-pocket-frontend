import type { ProactiveAlert, SignalSeverity } from "@/app/types/intelligence";
import { suggestedActionToQuickActionId } from "@/lib/recentOrders";

const SEVERITY_ORDER: Record<SignalSeverity, number> = {
  critical: 0,
  warning: 1,
  watch: 2,
  info: 3,
};

export function sortSignalsBySeverity<T extends { severity: SignalSeverity }>(
  signals: T[],
): T[] {
  return [...signals].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );
}

export function sortAlertsByPriority(alerts: ProactiveAlert[]): ProactiveAlert[] {
  return [...alerts].sort((a, b) => a.priority - b.priority);
}

export function alertToQuickActionId(alert: ProactiveAlert): string {
  return suggestedActionToQuickActionId(alert.action);
}

export function signalSeverityLabel(severity: SignalSeverity): string {
  return severity.charAt(0).toUpperCase() + severity.slice(1);
}

export function signalSeverityClass(severity: SignalSeverity): string {
  switch (severity) {
    case "critical":
      return "border-danger/40 bg-danger/10 text-danger";
    case "warning":
      return "border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300";
    case "watch":
      return "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200";
    default:
      return "border-border bg-secondary/70 text-muted";
  }
}

export function dedupeAlerts(alerts: ProactiveAlert[]): ProactiveAlert[] {
  const seen = new Set<string>();
  const result: ProactiveAlert[] = [];

  for (const alert of sortAlertsByPriority(alerts)) {
    const key = `${alert.action}:${alert.symbol ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(alert);
  }

  return result;
}

export function hasPortfolioBriefContent(
  brief: import("@/app/types/intelligence").PortfolioIntelligence | null,
): boolean {
  if (!brief) return false;
  return (
    brief.signals.length > 0 ||
    brief.alerts.length > 0 ||
    !!brief.digest?.macro_regime ||
    (brief.digest?.sector_weights.length ?? 0) > 0 ||
    (brief.digest?.top_news.length ?? 0) > 0 ||
    (brief.digest?.earnings_this_week.length ?? 0) > 0
  );
}
