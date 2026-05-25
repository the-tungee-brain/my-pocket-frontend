"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  ChevronDown,
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
import {
  hasPortfolioChangeDetails,
  PortfolioChangesBody,
} from "@/components/PortfolioChangesSection";
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
      className="inline-flex max-w-full flex-col items-start gap-0.5 rounded-xl border border-border bg-background px-3 py-2 text-left transition hover:border-accent/40 hover:bg-muted-bg disabled:opacity-60"
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

function buildPreviewBullets(
  brief: PortfolioIntelligence,
  changes?: PortfolioChanges | null,
): string[] {
  const bullets: string[] = [];
  const digest = brief.digest;
  const signals = sortSignalsBySeverity(brief.signals ?? []);

  if (digest?.macroRegime) {
    bullets.push(digest.macroRegime);
  }

  for (const signal of signals) {
    if (bullets.length >= 3) break;
    if (!bullets.includes(signal.message)) {
      bullets.push(signal.message);
    }
  }

  if (bullets.length < 3 && changes?.summary) {
    bullets.push(changes.summary);
  }

  if (bullets.length < 3 && digest?.topNews?.[0]) {
    bullets.push(`${digest.topNews[0].symbol}: ${digest.topNews[0].headline}`);
  }

  if (bullets.length < 3 && (digest?.earningsThisWeek?.length ?? 0) > 0) {
    bullets.push(
      `Earnings this week: ${digest!.earningsThisWeek.slice(0, 3).join(", ")}`,
    );
  }

  return bullets.slice(0, 3);
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
  hideSuggestedActions = false,
  className,
}: Props) {
  const [expanded, setExpanded] = useState(false);

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
  const previewBullets = mergedBrief
    ? buildPreviewBullets(mergedBrief, changes)
    : [];
  const summaryLine =
    digest?.macroRegime ??
    changes?.summary ??
    previewBullets[0] ??
    "Your daily portfolio snapshot";

  return (
    <section
      className={cn(
        "mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-secondary shadow-sm",
        className,
      )}
      aria-label="Portfolio brief"
    >
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((open) => !open)}
        className="flex w-full items-start justify-between gap-3 border-b border-border bg-surface-elevated/50 px-4 py-3 text-left transition hover:bg-surface-elevated/70"
      >
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent-strong">
            <Sparkles className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">
              Morning brief
            </h2>
            {!expanded && (
              <>
                <p className="mt-0.5 line-clamp-2 text-sm text-foreground/90">
                  {summaryLine}
                </p>
                {previewBullets.length > 1 && (
                  <ul className="mt-2 space-y-1">
                    {previewBullets.slice(1, 3).map((bullet) => (
                      <li
                        key={bullet}
                        className="flex items-start gap-1.5 text-xs text-muted"
                      >
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent-strong" />
                        <span className="line-clamp-2">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
            {expanded && (
              <p className="text-[11px] text-muted">
                Macro context, sector mix, changes, and what to watch today
              </p>
            )}
            {lastUpdated != null && (
              <p className="mt-0.5 text-[10px] text-muted">
                Updated {formatRelativeUpdatedAt(lastUpdated)}
              </p>
            )}
          </div>
        </div>

        <ChevronDown
          className={cn(
            "mt-1 h-4 w-4 shrink-0 text-muted transition-transform",
            expanded && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {error && (
        <div className="px-4 pt-3">
          <ErrorBanner message={error} />
        </div>
      )}

      {loading && !hasContent && !expanded ? (
        <div className="space-y-2 px-4 py-3">
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted-bg" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-muted-bg/80" />
        </div>
      ) : null}

      {expanded && (
        <div className="space-y-4 px-4 py-4">
          {(changesLoading || hasChanges || changes?.summary) && (
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
                <GitCompareArrows className="h-3.5 w-3.5" aria-hidden />
                Since yesterday
              </div>
              {changesLoading ? (
                <div className="h-16 animate-pulse rounded-xl bg-muted-bg" />
              ) : (
                <PortfolioChangesBody changes={changes} />
              )}
            </div>
          )}

          {loading && !hasContent ? (
            <div className="space-y-2">
              {[1, 2, 3].map((row) => (
                <div
                  key={row}
                  className="h-12 animate-pulse rounded-lg bg-muted-bg"
                />
              ))}
            </div>
          ) : (
            <>
              {digest?.macroRegime && (
                <div className="rounded-xl border border-border bg-background/60 px-3 py-2.5">
                  <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
                    <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                    Macro
                  </div>
                  <p className="text-sm text-foreground">{digest.macroRegime}</p>
                </div>
              )}

              {!!digest?.sectorWeights?.length && (
                <div>
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
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
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
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
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
                    <Newspaper className="h-3.5 w-3.5" aria-hidden />
                    Top holdings news
                  </div>
                  <ul className="space-y-2">
                    {digest.topNews.slice(0, 4).map((item) => (
                      <li
                        key={`${item.symbol}-${item.headline}`}
                        className="rounded-xl border border-border bg-background/60 px-3 py-2"
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
                        <p className="mt-1 text-sm text-foreground">
                          {item.headline}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!!signals.length && (
                <div>
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
                    <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                    {signals.some((signal) => signal.kind === "holding")
                      ? "Top holdings"
                      : "Signals"}
                  </div>
                  <ul className="space-y-2">
                    {signals.slice(0, 5).map((signal, index) => (
                      <li
                        key={`${signal.kind}-${signal.symbol ?? "portfolio"}-${index}`}
                        className="flex items-start gap-2 rounded-xl border border-border bg-background/60 px-3 py-2"
                      >
                        <span
                          className={cn(
                            "mt-0.5 inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            signalSeverityClass(signal.severity),
                          )}
                        >
                          {signalSeverityLabel(signal.severity)}
                        </span>
                        <p className="text-sm text-foreground">{signal.message}</p>
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
                    onClick={onGoDeeper}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-strong transition hover:underline"
                  >
                    <Sparkles className="h-3.5 w-3.5" aria-hidden />
                    Go deeper with full AI portfolio analysis
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
