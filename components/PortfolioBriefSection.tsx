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
import { AskAIChip } from "@/components/AskAIChip";
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

function truncateText(text: string, maxLength: number) {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1).trimEnd()}…`;
}

type BriefHighlight = {
  id: string;
  label: string;
  text: string;
};

type BriefPreview = {
  lead: string;
  highlights: BriefHighlight[];
  urgentLead: boolean;
};

function buildBriefPreview(
  brief: PortfolioIntelligence,
  changes?: PortfolioChanges | null,
): BriefPreview {
  const digest = brief.digest;
  const signals = sortSignalsBySeverity(brief.signals ?? []);
  const highlights: BriefHighlight[] = [];

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

  const addHighlight = (id: string, label: string, text: string) => {
    if (highlights.length >= 2) return;
    const normalized = text.trim();
    if (!normalized || normalized === lead.trim()) return;
    if (highlights.some((item) => item.text === normalized)) return;
    highlights.push({
      id,
      label,
      text: truncateText(normalized, 120),
    });
  };

  if (changes?.summary && changes.summary !== lead) {
    addHighlight("changes", "Since yesterday", changes.summary);
  }

  if (digest?.macroRegime && digest.macroRegime !== lead) {
    addHighlight("macro", "Macro", digest.macroRegime);
  }

  for (const signal of signals) {
    if (signal.message === lead) continue;
    addHighlight(
      `signal-${signal.symbol ?? signal.kind}`,
      signal.symbol ?? "Signal",
      signal.message,
    );
    if (highlights.length >= 2) break;
  }

  if (highlights.length < 2 && digest?.topNews?.[0]) {
    const item = digest.topNews[0];
    addHighlight(
      `news-${item.symbol}`,
      item.symbol,
      item.headline,
    );
  }

  if (highlights.length < 2 && (digest?.earningsThisWeek?.length ?? 0) > 0) {
    addHighlight(
      "earnings",
      "Earnings",
      digest!.earningsThisWeek.slice(0, 4).join(", "),
    );
  }

  return {
    lead: lead || "Your daily portfolio snapshot",
    highlights,
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
  const preview = mergedBrief
    ? buildBriefPreview(mergedBrief, changes)
    : {
        lead: "Your daily portfolio snapshot",
        highlights: [],
        urgentLead: false,
      };

  const hasBodyBelowHeader = expanded || !!error;

  return (
    <section
      className={cn(
        "mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-secondary shadow-sm",
        className,
      )}
      aria-label="Portfolio brief"
    >
      <div
        className={cn(
          "flex items-start justify-between gap-2 bg-surface-elevated/50 px-4 py-3",
          hasBodyBelowHeader && "border-b border-border",
        )}
      >
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded((open) => !open)}
          className="flex min-w-0 flex-1 items-start gap-2.5 text-left transition hover:opacity-90"
        >
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent-strong">
            <Sparkles className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <h2 className="text-sm font-semibold text-foreground">
                Morning brief
              </h2>
              {lastUpdated != null && (
                <span className="text-[10px] text-muted">
                  {formatRelativeUpdatedAt(lastUpdated)}
                </span>
              )}
            </div>

            {!expanded && (
              <>
                {loading && !hasContent ? (
                  <p className="mt-1 text-sm text-muted">Loading your brief…</p>
                ) : (
                  <>
                    <p
                      className={cn(
                        "mt-1 text-sm leading-snug text-foreground line-clamp-3",
                        preview.urgentLead && "font-medium",
                      )}
                    >
                      {preview.lead}
                    </p>
                    {preview.highlights.length > 0 && (
                      <ul className="mt-2 space-y-1.5">
                        {preview.highlights.map((item) => (
                          <li
                            key={item.id}
                            className="flex min-w-0 items-baseline gap-2 text-xs leading-relaxed"
                          >
                            <span className="shrink-0 font-medium uppercase tracking-wide text-[10px] text-muted">
                              {item.label}
                            </span>
                            <span className="min-w-0 line-clamp-2 text-muted">
                              {item.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </>
            )}

            {expanded && (
              <p className="mt-1 text-xs leading-relaxed text-muted line-clamp-2">
                {preview.lead}
              </p>
            )}
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-2 pt-0.5">
          {onGoDeeper && !expanded && (
            <AskAIChip onClick={onGoDeeper} disabled={analyzeLoading} />
          )}
          <button
            type="button"
            aria-label={expanded ? "Collapse brief" : "Expand brief"}
            onClick={() => setExpanded((open) => !open)}
            className="rounded-lg p-1 text-muted transition hover:bg-muted-bg hover:text-foreground"
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                expanded && "rotate-180",
              )}
              aria-hidden
            />
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 pt-3">
          <ErrorBanner message={error} />
        </div>
      )}

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
                  <p className="text-sm leading-relaxed text-foreground">
                    {digest.macroRegime}
                  </p>
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
                        <p className="mt-1 text-sm leading-relaxed text-foreground">
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
        </div>
      )}
    </section>
  );
}
