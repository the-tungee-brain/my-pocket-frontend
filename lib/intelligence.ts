import type {
  ProactiveAlert,
  PortfolioIntelligence,
  SignalSeverity,
} from "@/app/types/intelligence";
import type { Position, SchwabAccounts } from "@/app/types/schwab";
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
  brief: PortfolioIntelligence | null,
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

function positionSymbol(position: Position): string {
  if (position.instrument.assetType === "OPTION") {
    return (
      position.instrument.underlyingSymbol ?? position.instrument.symbol
    ).toUpperCase();
  }
  return position.instrument.symbol.toUpperCase();
}

/** Lightweight brief when the API intelligence layer is unavailable. */
export function buildLocalPortfolioBrief(
  positions: Position[],
  account: SchwabAccounts | null,
  alerts: ProactiveAlert[] = [],
): PortfolioIntelligence | null {
  if (!account || !positions.length) return null;

  const bySymbol = new Map<string, number>();
  for (const position of positions) {
    const symbol = positionSymbol(position);
    bySymbol.set(
      symbol,
      (bySymbol.get(symbol) ?? 0) + Math.abs(position.marketValue),
    );
  }

  const liquidation =
    account.securitiesAccount.currentBalances.liquidationValue ?? 0;
  const totalMarketValue = [...bySymbol.values()].reduce(
    (sum, value) => sum + value,
    0,
  );
  const weightBase = liquidation > 0 ? liquidation : totalMarketValue;
  if (weightBase <= 0) {
    return alerts.length ? { signals: [], digest: null, alerts } : null;
  }

  const signals: PortfolioIntelligence["signals"] = [];
  const ranked = [...bySymbol.entries()].sort((a, b) => b[1] - a[1]);

  for (const [symbol, marketValue] of ranked) {
    const weight = (marketValue / weightBase) * 100;
    if (weight >= 30) {
      signals.push({
        kind: "concentration",
        severity: "critical",
        message: `${symbol} is ${weight.toFixed(1)}% of portfolio — above the 30% concentration limit.`,
        symbol,
      });
    } else if (weight >= 20) {
      signals.push({
        kind: "concentration",
        severity: "warning",
        message: `${symbol} is ${weight.toFixed(1)}% of portfolio — elevated concentration.`,
        symbol,
      });
    }
  }

  if (!signals.length) {
    for (const [symbol, marketValue] of ranked.slice(0, 5)) {
      const weight = (marketValue / weightBase) * 100;
      signals.push({
        kind: "holding",
        severity: "info",
        message: `${symbol} is ${weight.toFixed(1)}% of portfolio.`,
        symbol,
      });
    }
  }

  return {
    signals: sortSignalsBySeverity(signals),
    digest: null,
    alerts: dedupeAlerts(alerts),
  };
}
