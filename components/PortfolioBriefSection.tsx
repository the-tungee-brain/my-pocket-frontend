"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  ExternalLink,
  GitCompareArrows,
  Newspaper,
  PieChart,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type {
  PortfolioChanges,
  ProactiveAlert,
  PortfolioIntelligence,
} from "@/app/types/intelligence";
import {
  alertToQuickActionId,
  dedupeAlerts,
  filterNonTaxAlerts,
  formatSectorLabel,
  hasPortfolioBriefContent,
  signalSeverityClass,
  signalSeverityLabel,
  sortSignalsBySeverity,
} from "@/lib/intelligence";
import { findQuickAction } from "@/lib/quickActions";
import { formatRelativeUpdatedAt } from "@/lib/timeUtils";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton, SkeletonList } from "@/components/ui/Skeleton";
import {
  hasPortfolioChangeDetails,
  PortfolioChangesBody,
} from "@/components/PortfolioChangesSection";
import { appChipClass, appIconBoxClass, appKpiClass, appSectionLabelClass } from "@/lib/appUi";
import { cn } from "@/lib/utils";
import { symbolHubPath } from "@/lib/symbolRoutes";

type Props = {
  brief: PortfolioIntelligence | null;
  changes?: PortfolioChanges | null;
  changesLoading?: boolean;
  fallbackAlerts?: ProactiveAlert[];
  loading?: boolean;
  error?: string | null;
  lastUpdated?: number | null;
  onRunAlert?: (alert: ProactiveAlert) => void;
  onGoDeeper?: () => void;
  analyzeLoading?: boolean;
  hideSuggestedActions?: boolean;
  className?: string;
};

function AlertChip({
  alert,
  onRun,
  disabled,
}: {
  alert: ProactiveAlert;
  onRun?: (alert: ProactiveAlert) => void;
  disabled?: boolean;
}) {
  const actionId = alertToQuickActionId(alert);
  const quickAction = findQuickAction(actionId);
  const Icon = quickAction?.icon ?? Sparkles;

  return (
    <button
      type="button"
      disabled={disabled || !onRun}
      title={alert.reason}
      onClick={() => onRun?.(alert)}
      className={appChipClass}
    >
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0 text-accent-strong" aria-hidden />
        {alert.label}
        {alert.symbol && (
          <span className="font-mono text-accent-strong">{alert.symbol}</span>
        )}
      </span>
      <span className="line-clamp-2 text-[11px] text-muted">{alert.reason}</span>
    </button>
  );
}

function truncateText(text: string, maxLength: number) {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

type BriefPreview = {
  lead: string;
  urgentLead: boolean;
};

function buildBriefPreview(
  brief: PortfolioIntelligence,
  changes?: PortfolioChanges | null,
): BriefPreview {
  const digest = brief.digest;
  const signals = sortSignalsBySeverity(brief.signals ?? []);

  const urgentSignal = signals.find(
    (signal) => signal.severity === "critical" || signal.severity === "warning",
  );
  const topSignal = urgentSignal ?? signals[0];

  let lead = "";
  let urgentLead = false;

  if (urgentSignal) {
    lead = urgentSignal.message;
    urgentLead = true;
  } else if (changes?.summary) {
    lead = changes.summary;
  } else if (digest?.macroRegime) {
    lead = truncateText(digest.macroRegime, 180);
  } else if (topSignal) {
    lead = topSignal.message;
  } else if (digest?.topNews?.[0]) {
    const item = digest.topNews[0];
    lead = truncateText(`${item.symbol}: ${item.headline}`, 180);
  } else if ((digest?.earningsThisWeek?.length ?? 0) > 0) {
    lead = `Earnings this week: ${digest!.earningsThisWeek.slice(0, 3).join(", ")}`;
  }

  return {
    lead: lead || "Your daily portfolio snapshot",
    urgentLead,
  };
}

export function PortfolioBriefSection({
  brief,
  changes = null,
  changesLoading = false,
  fallbackAlerts = [],
  loading = false,
  error = null,
  lastUpdated = null,
  onRunAlert,
  onGoDeeper,
  analyzeLoading = false,
  hideSuggestedActions = false,
  className,
}: Props) {
  const mergedBrief: PortfolioIntelligence | null = brief ?? {
    signals: [],
    digest: null,
    alerts: dedupeAlerts(fallbackAlerts),
  };

  const hasContent = hasPortfolioBriefContent(mergedBrief);
  const hasChanges = hasPortfolioChangeDetails(changes);
  const signals = sortSignalsBySeverity(mergedBrief?.signals ?? []);
  const alerts = filterNonTaxAlerts(
    dedupeAlerts([...(mergedBrief?.alerts ?? []), ...fallbackAlerts]),
  ).slice(0, 6);
  const digest = mergedBrief?.digest;
  const preview = mergedBrief
    ? buildBriefPreview(mergedBrief, changes)
    : {
        lead: "Your daily portfolio snapshot",
        urgentLead: false,
      };

  return (
    <Card className={className} aria-label="Portfolio brief">
      <CardHeader>
        <CardTitle
          title="Morning brief"
          description={
            <>
              {lastUpdated != null && (
                <span className="mr-2 text-[10px] text-muted">
                  {formatRelativeUpdatedAt(lastUpdated)}
                </span>
              )}
              <span
                className={cn(
                  "text-xs leading-relaxed line-clamp-2",
                  preview.urgentLead && "font-medium text-foreground",
                )}
              >
                {loading && !hasContent ? "Loading your brief…" : preview.lead}
              </span>
            </>
          }
          icon={
            <div className={appIconBoxClass}>
              <Sparkles className="h-4 w-4" aria-hidden />
            </div>
          }
        />
      </CardHeader>

      {error && (
        <div className="px-5 pt-4">
          <ErrorBanner message={error} />
        </div>
      )}

      <CardBody spacious className="space-y-5">
          {(changesLoading || hasChanges || changes?.summary) && (
            <div>
              <div className={cn(appSectionLabelClass, "flex items-center gap-1.5")}>
                <GitCompareArrows className="h-3.5 w-3.5" aria-hidden />
                Since yesterday
              </div>
              {changesLoading ? (
                <Skeleton className="h-16 rounded-xl" />
              ) : (
                <PortfolioChangesBody changes={changes} />
              )}
            </div>
          )}

          {loading && !hasContent ? (
            <SkeletonList rows={3} rowClassName="h-12 rounded-lg" />
          ) : (
            <>
              {digest?.macroRegime && (
                <div className={appKpiClass}>
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
                    <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                    Macro
                  </div>
                  <p className="text-sm leading-relaxed text-foreground">
                    {digest.macroRegime}
                  </p>
                </div>
              )}

              {!!digest?.macroNews?.length && (
                <div>
                  <div className={cn(appSectionLabelClass, "flex items-center gap-1.5")}>
                    <Newspaper className="h-3.5 w-3.5" aria-hidden />
                    Market headlines
                  </div>
                  <ul className="space-y-2">
                    {digest.macroNews.slice(0, 5).map((item, index) => (
                      <li
                        key={`${item.headline}-${index}`}
                        className={appKpiClass}
                      >
                        {item.source && (
                          <div className="flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="font-mono font-semibold text-accent-strong">
                              {item.source}
                            </span>
                          </div>
                        )}
                        {item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              "block text-sm font-medium leading-relaxed text-foreground underline-offset-2 hover:text-accent-strong hover:underline",
                              item.source && "mt-1",
                            )}
                          >
                            {item.headline}
                          </a>
                        ) : (
                          <p
                            className={cn(
                              "text-sm leading-relaxed text-foreground",
                              item.source && "mt-1",
                            )}
                          >
                            {item.headline}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!!digest?.sectorWeights?.length && (
                <div>
                  <div className={cn(appSectionLabelClass, "flex items-center gap-1.5")}>
                    <PieChart className="h-3.5 w-3.5" aria-hidden />
                    Sector allocation
                  </div>
                  <div className="space-y-2">
                    {digest.sectorWeights.slice(0, 5).map((sector) => (
                      <div key={sector.sector}>
                        <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                          <span className="font-medium text-foreground">
                            {formatSectorLabel(sector.sector)}
                          </span>
                          <span className="tabular-nums text-muted">
                            {sector.weightPct.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted-bg">
                          <div
                            className="h-full rounded-full bg-accent-strong/80"
                            style={{
                              width: `${Math.min(sector.weightPct, 100)}%`,
                            }}
                          />
                        </div>
                        <p className="mt-1 text-[10px] text-muted">
                          {sector.symbols.slice(0, 4).join(", ")}
                          {sector.symbols.length > 4 ? "…" : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!!digest?.earningsThisWeek?.length && (
                <div>
                  <div className={cn(appSectionLabelClass, "flex items-center gap-1.5")}>
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                    Earnings this week
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {digest.earningsThisWeek.map((symbol) => (
                      <Link
                        key={symbol}
                        href={symbolHubPath(symbol, "position")}
                        className="rounded-full border border-border bg-background px-3 py-1 font-mono text-[11px] font-medium text-foreground transition hover:border-accent/40 hover:text-accent-strong"
                      >
                        {symbol}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {!!digest?.topNews?.length && (
                <div>
                  <div className={cn(appSectionLabelClass, "flex items-center gap-1.5")}>
                    <Newspaper className="h-3.5 w-3.5" aria-hidden />
                    Top holdings news
                  </div>
                  <ul className="space-y-2">
                    {digest.topNews.slice(0, 4).map((item) => (
                      <li
                        key={`${item.symbol}-${item.headline}`}
                        className={appKpiClass}
                      >
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          <Link
                            href={symbolHubPath(item.symbol, "position")}
                            className="font-mono font-semibold text-accent-strong hover:underline"
                          >
                            {item.symbol}
                          </Link>
                          {item.weightPct != null && (
                            <span className="text-muted">
                              {item.weightPct.toFixed(1)}% of portfolio
                            </span>
                          )}
                          {item.sentiment && (
                            <span className="rounded-full bg-muted-bg px-2 py-0.5 text-[10px] capitalize text-muted">
                              {item.sentiment.replace(/_/g, " ")}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-start justify-between gap-3">
                          <p className="min-w-0 flex-1 text-sm leading-relaxed text-foreground">
                            {item.headline}
                          </p>
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-accent-strong hover:underline"
                            >
                              Read article
                              <ExternalLink className="h-3 w-3" aria-hidden />
                              <span className="sr-only"> (opens in new tab)</span>
                            </a>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!!signals.length && (
                <div>
                  <div className={cn(appSectionLabelClass, "flex items-center gap-1.5")}>
                    <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                    {signals.some((signal) => signal.kind === "holding")
                      ? "Top holdings"
                      : "Signals"}
                  </div>
                  <ul className="space-y-2">
                    {signals.slice(0, 5).map((signal, index) => (
                      <li
                        key={`${signal.kind}-${signal.symbol ?? "portfolio"}-${index}`}
                        className={cn(appKpiClass, "flex items-start gap-2")}
                      >
                        <span
                          className={cn(
                            "mt-0.5 inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            signalSeverityClass(signal.severity),
                          )}
                        >
                          {signalSeverityLabel(signal.severity)}
                        </span>
                        <p className="min-w-0 text-sm leading-relaxed text-foreground">
                          {signal.message}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!loading && !error && !hasContent && !hasChanges && (
                <p className="text-sm text-muted">
                  No urgent signals right now. Ask the assistant for a deeper
                  analysis.
                </p>
              )}

              {!!alerts.length && onRunAlert && !hideSuggestedActions && (
                <div>
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">
                    Suggested actions
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {alerts.map((alert) => (
                      <AlertChip
                        key={`${alert.action}-${alert.symbol ?? "portfolio"}-${alert.priority}`}
                        alert={alert}
                        onRun={onRunAlert}
                        disabled={loading}
                      />
                    ))}
                  </div>
                </div>
              )}

              {onGoDeeper && (
                <div className="border-t border-border/70 pt-3">
                  <button
                    type="button"
                    disabled={analyzeLoading}
                    onClick={onGoDeeper}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-strong transition hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Sparkles className="h-3.5 w-3.5" aria-hidden />
                    Go deeper with diversification analysis
                  </button>
                </div>
              )}
            </>
          )}
      </CardBody>
    </Card>
  );
}
