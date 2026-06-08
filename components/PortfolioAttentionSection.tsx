"use client";

import { AlertTriangle, CheckCircle2, Scale, Sparkles, X } from "lucide-react";
import { useState } from "react";
import type { AttentionItem, ProactiveAlert } from "@/app/types/intelligence";
import type { PortfolioExitAttentionItem } from "@/app/types/positionGuidance";
import type { SuggestedAnalysisAction } from "@/app/types/schwab";
import { AskAIChip } from "@/components/AskAIChip";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import {
  appChipClass,
  appIconBoxClass,
  appKpiClass,
  appPanelFooterClass,
  appSectionLabelClass,
} from "@/lib/appUi";
import {
  alertToQuickActionId,
  dedupeAlerts,
  filterNonTaxAlerts,
  filterNonTaxSuggestedActions,
  type TaxAlertItem,
} from "@/lib/intelligence";
import { findQuickAction } from "@/lib/quickActions";
import {
  pickSuggestedActions,
  suggestedActionToQuickActionId,
} from "@/lib/recentOrders";
import { capitalizeFirstLetter, cn } from "@/lib/utils";

const MAX_VISIBLE = 5;

function formatExitVerdict(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => capitalizeFirstLetter(part))
    .join(" ");
}

type Props = {
  taxItems: TaxAlertItem[];
  alerts: ProactiveAlert[];
  attentionItems?: AttentionItem[];
  suggestedActions?: SuggestedAnalysisAction[];
  exitItems?: PortfolioExitAttentionItem[];
  onRunAlert?: (alert: ProactiveAlert) => void;
  onRunAttentionItem?: (item: AttentionItem) => void;
  onDismissAttention?: (alertId: string) => void;
  onRunTax?: (item: TaxAlertItem) => void;
  onRunActionId?: (actionId: string) => void;
  compact?: boolean;
  compactTitle?: string;
  compactActionLabel?: string;
  onCompactAction?: () => void;
  maxVisible?: number;
  className?: string;
};

type CompactSuggestionRow = {
  id: string;
  label: string;
  reason: string;
  symbol?: string | null;
  rank: number;
};

function AlertChip({
  label,
  reason,
  symbol,
  actionId,
  onRun,
}: {
  label: string;
  reason: string;
  symbol?: string | null;
  actionId: string;
  onRun?: (actionId: string) => void;
}) {
  const quickAction = findQuickAction(actionId);
  const Icon = quickAction?.icon ?? Sparkles;

  return (
    <button
      type="button"
      disabled={!onRun}
      title={reason}
      onClick={() => onRun?.(actionId)}
      className={appChipClass}
    >
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0 text-accent-strong" aria-hidden />
        {label}
        {symbol && (
          <span className="font-mono text-accent-strong">{symbol}</span>
        )}
      </span>
      <span className="line-clamp-2 text-[11px] text-muted">{reason}</span>
    </button>
  );
}

export function countAttentionItems({
  taxItems,
  alerts,
  attentionItems = [],
  suggestedActions = [],
  exitItems = [],
}: Pick<
  Props,
  "taxItems" | "alerts" | "attentionItems" | "suggestedActions" | "exitItems"
>) {
  const useAttentionQueue = attentionItems.length > 0;
  const generalAlerts = useAttentionQueue
    ? []
    : dedupeAlerts(filterNonTaxAlerts(alerts));
  const queueItems = useAttentionQueue ? attentionItems : [];

  const alertActionKeys = new Set(
    [
      ...taxItems.map((item) => item.actionId),
      ...generalAlerts.map(alertToQuickActionId),
      ...queueItems.map((item) => item.action),
    ].map((id) => id.toLowerCase()),
  );

  const extraSuggestions = pickSuggestedActions(
    filterNonTaxSuggestedActions(suggestedActions),
    4,
  ).filter((item) => {
    const actionId = suggestedActionToQuickActionId(item.action);
    return !alertActionKeys.has(actionId.toLowerCase());
  });

  return (
    taxItems.length +
    exitItems.length +
    queueItems.length +
    generalAlerts.length +
    extraSuggestions.length
  );
}

export function PortfolioAttentionSection({
  taxItems,
  alerts,
  attentionItems = [],
  suggestedActions = [],
  exitItems = [],
  onRunAlert,
  onRunAttentionItem,
  onDismissAttention,
  onRunTax,
  onRunActionId,
  compact = false,
  compactTitle = "Attention",
  compactActionLabel,
  onCompactAction,
  maxVisible = MAX_VISIBLE,
  className,
}: Props) {
  const [showAll, setShowAll] = useState(false);

  const useAttentionQueue = attentionItems.length > 0;
  const generalAlerts = useAttentionQueue
    ? []
    : dedupeAlerts(filterNonTaxAlerts(alerts));
  const queueItems = useAttentionQueue ? attentionItems : [];

  const alertActionKeys = new Set(
    [
      ...taxItems.map((item) => item.actionId),
      ...generalAlerts.map(alertToQuickActionId),
      ...queueItems.map((item) => item.action),
    ].map((id) => id.toLowerCase()),
  );

  const extraSuggestions = pickSuggestedActions(
    filterNonTaxSuggestedActions(suggestedActions),
    4,
  ).filter((item) => {
    const actionId = suggestedActionToQuickActionId(item.action);
    return !alertActionKeys.has(actionId.toLowerCase());
  });

  const totalCount =
    taxItems.length +
    exitItems.length +
    queueItems.length +
    generalAlerts.length +
    extraSuggestions.length;
  const hiddenCount = Math.max(0, totalCount - maxVisible);

  const visibleTax = showAll ? taxItems : taxItems.slice(0, maxVisible);
  let remaining = showAll ? Infinity : maxVisible - visibleTax.length;

  const visibleExit = showAll
    ? exitItems
    : exitItems.slice(0, Math.max(0, remaining));
  remaining -= visibleExit.length;

  const visibleQueue = showAll
    ? queueItems
    : queueItems.slice(0, Math.max(0, remaining));
  remaining -= visibleQueue.length;

  const visibleAlerts = showAll
    ? generalAlerts
    : generalAlerts.slice(0, Math.max(0, remaining));
  remaining -= visibleAlerts.length;

  const visibleSuggestions = showAll
    ? extraSuggestions
    : extraSuggestions.slice(0, Math.max(0, remaining));

  const hasContent = totalCount > 0;

  if (!hasContent) {
    return (
      <section
        className={cn(
          "mx-auto w-full border-t border-border/60 pt-5",
          className,
        )}
        aria-label="Needs attention"
      >
        {compact ? (
          <p className="text-sm text-muted">
            No tax flags, risk alerts, or suggested follow-ups right now.
          </p>
        ) : (
          <EmptyState
            icon={CheckCircle2}
            title="All clear"
            description="No tax flags, risk alerts, or suggested follow-ups right now."
            variant="solid"
          />
        )}
      </section>
    );
  }

  const handleAlertChip = (alert: ProactiveAlert) => {
    onRunAlert?.(alert);
  };

  const handleAttentionItem = (item: AttentionItem) => {
    if (onRunAttentionItem) {
      onRunAttentionItem(item);
      return;
    }
    onRunAlert?.({
      action: item.action,
      label: item.label,
      reason: item.reason,
      priority: item.priority,
      symbol: item.symbol,
    });
  };

  const hasTaxSection = visibleTax.length > 0;

  if (compact) {
    const compactRows: CompactSuggestionRow[] = [
      ...visibleTax.map((item) => ({
        id: item.id,
        label: item.label,
        reason: item.reason,
        symbol: item.symbol,
        rank: 10,
      })),
      ...visibleExit.map((item) => ({
        id: item.positionKey,
        label: `${item.symbol} position review`,
        reason: `${item.displayLabel} · ${formatExitVerdict(item.verdict)}`,
        symbol: item.symbol,
        rank: 20,
      })),
      ...visibleQueue.map((item) => ({
        id: `${item.action}-${item.symbol ?? "portfolio"}-${item.priority}-${item.alertId ?? "current"}`,
        label: capitalizeFirstLetter(item.label),
        reason: item.reason,
        symbol: item.symbol,
        rank: 30 + item.priority,
      })),
      ...visibleAlerts.map((alert) => ({
        id: `${alert.action}-${alert.symbol ?? "portfolio"}-${alert.priority}`,
        label: alert.label,
        reason: alert.reason,
        symbol: alert.symbol,
        rank: 40 + alert.priority,
      })),
      ...visibleSuggestions.map((item) => {
        return {
          id: `${item.action}-${item.priority}`,
          label: item.label,
          reason: item.reason,
          symbol: null,
          rank: 60 + item.priority,
        };
      }),
    ];

    const seen = new Set<string>();
    const rows = compactRows
      .sort((a, b) => a.rank - b.rank)
      .filter((row) => {
        const key = `${row.symbol ?? "portfolio"}-${row.label}-${row.reason}`
          .toLowerCase()
          .replace(/\s+/g, " ")
          .trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, maxVisible);

    return (
      <section
        className={cn(
          "mx-auto w-full border-t border-border/60 pt-5",
          className,
        )}
        aria-label={compactTitle}
      >
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              {compactTitle}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {rows.length} prioritized suggestion{rows.length === 1 ? "" : "s"}
              .
            </p>
          </div>
          {onCompactAction && compactActionLabel ? (
            <button
              type="button"
              onClick={onCompactAction}
              className="shrink-0 text-left text-xs font-medium text-foreground hover:underline sm:text-right"
            >
              {compactActionLabel}
            </button>
          ) : null}
        </div>
        <ol className="divide-y divide-border/60">
          {rows.map((row, index) => (
            <li
              key={row.id}
              className="grid gap-3 py-3 sm:grid-cols-[2rem_minmax(0,1fr)]"
            >
              <p className="text-sm font-medium tabular-nums text-muted">
                {index + 1}
              </p>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {row.label}
                  {row.symbol ? (
                    <span className="ml-1.5 font-mono text-muted">
                      {row.symbol}
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-muted">
                  {row.reason}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  return (
    <Card className={className} aria-label="Needs attention">
      <CardHeader tone={hasTaxSection ? "warning" : "default"}>
        <CardTitle
          title="Needs attention"
          description={`${totalCount} item${totalCount === 1 ? "" : "s"} need your review`}
          icon={
            <div
              className={cn(
                appIconBoxClass,
                "border-amber-500/30 bg-amber-500/15 text-amber-200",
              )}
            >
              <AlertTriangle className="h-4 w-4" aria-hidden />
            </div>
          }
        />
      </CardHeader>

      {visibleTax.length > 0 && (
        <div className="border-y border-amber-500/20 bg-amber-500/5">
          <div className="px-5 pt-4">
            <span
              className={cn(
                appSectionLabelClass,
                "mb-0 inline-flex items-center gap-2 leading-none",
              )}
            >
              <Scale
                className="h-3.5 w-3.5 shrink-0 text-amber-800 dark:text-amber-200"
                aria-hidden
              />
              Tax & wash-sale
            </span>
          </div>
          <ul className="divide-y divide-border/60">
            {visibleTax.map((item) => {
              const quickAction = findQuickAction(item.actionId);
              const Icon = quickAction?.icon ?? Scale;

              return (
                <li key={item.id} className="px-5 py-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {item.label}
                        {item.symbol && (
                          <span className="ml-1.5 font-mono text-accent-strong">
                            {item.symbol}
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted">
                        {item.reason}
                      </p>
                    </div>
                    {onRunTax && (
                      <div className="flex shrink-0 items-center gap-2">
                        <AskAIChip onClick={() => onRunTax(item)} />
                        <button
                          type="button"
                          onClick={() => onRunTax(item)}
                          className="inline-flex shrink-0 items-center gap-1.5 border border-border bg-background px-2.5 py-1.5 text-[11px] font-medium text-accent-strong transition hover:border-accent/40 hover:bg-muted-bg"
                        >
                          <Icon className="h-3.5 w-3.5" aria-hidden />
                          Review
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {(visibleQueue.length > 0 ||
        visibleAlerts.length > 0 ||
        visibleSuggestions.length > 0) && (
        <CardBody spacious className="space-y-5">
          {visibleQueue.length > 0 && (
            <div className="pt-4">
              <p className={appSectionLabelClass}>Priority queue</p>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {visibleQueue.map((item) => {
                  const actionId = item.action;
                  const quickAction = findQuickAction(actionId);
                  const Icon = quickAction?.icon ?? Sparkles;

                  return (
                    <div
                      key={`${item.action}-${item.symbol ?? "portfolio"}-${item.priority}-${item.alertId ?? "current"}`}
                      className={cn(appKpiClass, "relative")}
                    >
                      {item.alertId && onDismissAttention && (
                        <IconButton
                          size="sm"
                          aria-label="Dismiss alert"
                          onClick={() => {
                            if (item.alertId) onDismissAttention(item.alertId);
                          }}
                          className="absolute right-2 top-2"
                        >
                          <X className="h-3.5 w-3.5" />
                        </IconButton>
                      )}
                      <div className="inline-flex max-w-full flex-col items-start gap-1 pr-6 text-left">
                        <span className="inline-flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-foreground">
                          <Icon
                            className="h-3.5 w-3.5 shrink-0 text-accent-strong"
                            aria-hidden
                          />
                          {capitalizeFirstLetter(item.label)}
                          {item.symbol && (
                            <span className="font-mono text-accent-strong">
                              {item.symbol}
                            </span>
                          )}
                          {item.source === "historical" &&
                            item.daysActive != null && (
                              <span className="bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:text-amber-200">
                                {item.daysActive}d
                              </span>
                            )}
                        </span>
                        <span className="line-clamp-2 text-[11px] text-muted">
                          {item.reason}
                        </span>
                        {(onRunAttentionItem || onRunAlert) && (
                          <AskAIChip
                            className="mt-1"
                            onClick={() => handleAttentionItem(item)}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {visibleAlerts.length > 0 && (
            <div>
              <p className={appSectionLabelClass}>Suggested actions</p>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {visibleAlerts.map((alert) => {
                  const actionId = alertToQuickActionId(alert);
                  const quickAction = findQuickAction(actionId);
                  const Icon = quickAction?.icon ?? Sparkles;

                  return (
                    <button
                      key={`${alert.action}-${alert.symbol ?? "portfolio"}-${alert.priority}`}
                      type="button"
                      disabled={!onRunAlert}
                      title={alert.reason}
                      onClick={() => handleAlertChip(alert)}
                      className={appChipClass}
                    >
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                        <Icon
                          className="h-3.5 w-3.5 shrink-0 text-accent-strong"
                          aria-hidden
                        />
                        {alert.label}
                        {alert.symbol && (
                          <span className="font-mono text-accent-strong">
                            {alert.symbol}
                          </span>
                        )}
                      </span>
                      <span className="line-clamp-2 text-[11px] text-muted">
                        {alert.reason}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {visibleSuggestions.length > 0 && onRunActionId && (
            <div>
              {visibleAlerts.length === 0 && (
                <p className={appSectionLabelClass}>From recent trades</p>
              )}
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {visibleSuggestions.map((item) => (
                  <AlertChip
                    key={`${item.action}-${item.priority}`}
                    label={item.label}
                    reason={item.reason}
                    actionId={suggestedActionToQuickActionId(item.action)}
                    onRun={onRunActionId}
                  />
                ))}
              </div>
            </div>
          )}
        </CardBody>
      )}

      {!showAll && hiddenCount > 0 && (
        <div className={appPanelFooterClass}>
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="text-xs font-medium text-accent-strong transition hover:underline"
          >
            Show {hiddenCount} more
          </button>
        </div>
      )}
    </Card>
  );
}
