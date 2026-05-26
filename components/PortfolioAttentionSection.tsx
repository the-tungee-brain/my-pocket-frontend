"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Scale, Sparkles, X } from "lucide-react";
import type { AttentionItem, ProactiveAlert } from "@/app/types/intelligence";
import type { SuggestedAnalysisAction } from "@/app/types/schwab";
import {
  alertToQuickActionId,
  dedupeAlerts,
  filterNonTaxAlerts,
  filterNonTaxSuggestedActions,
  type TaxAlertItem,
} from "@/lib/intelligence";
import { findQuickAction } from "@/lib/quickActions";
import { pickSuggestedActions, suggestedActionToQuickActionId } from "@/lib/recentOrders";
import { capitalizeFirstLetter, cn } from "@/lib/utils";
import { AskAIChip } from "@/components/AskAIChip";
import { IconButton } from "@/components/ui/IconButton";
import { EmptyState } from "@/components/ui/EmptyState";

const MAX_VISIBLE = 5;

type Props = {
  taxItems: TaxAlertItem[];
  alerts: ProactiveAlert[];
  attentionItems?: AttentionItem[];
  suggestedActions?: SuggestedAnalysisAction[];
  onRunAlert?: (alert: ProactiveAlert) => void;
  onRunAttentionItem?: (item: AttentionItem) => void;
  onDismissAttention?: (alertId: string) => void;
  onRunTax?: (item: TaxAlertItem) => void;
  onRunActionId?: (actionId: string) => void;
  className?: string;
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
      className="inline-flex max-w-full flex-col items-start gap-0.5 rounded-xl border border-border bg-background px-3 py-2 text-left transition hover:border-accent/40 hover:bg-muted-bg disabled:opacity-60"
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
}: Pick<Props, "taxItems" | "alerts" | "attentionItems" | "suggestedActions">) {
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
  onRunAlert,
  onRunAttentionItem,
  onDismissAttention,
  onRunTax,
  onRunActionId,
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
    queueItems.length +
    generalAlerts.length +
    extraSuggestions.length;
  const hiddenCount = Math.max(0, totalCount - MAX_VISIBLE);

  const visibleTax = showAll ? taxItems : taxItems.slice(0, MAX_VISIBLE);
  let remaining = showAll ? Infinity : MAX_VISIBLE - visibleTax.length;

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
        className={cn("mx-auto w-full", className)}
        aria-label="Needs attention"
      >
        <EmptyState
          icon={CheckCircle2}
          title="All clear"
          description="No tax flags, risk alerts, or suggested follow-ups right now."
          variant="solid"
        />
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

  return (
    <section
      className={cn(
        "mx-auto w-full overflow-hidden rounded-2xl border border-border bg-secondary shadow-sm",
        className,
      )}
      aria-label="Needs attention"
    >
      <div
        className={cn(
          "flex items-start gap-3 border-b bg-surface-elevated/50 px-4 py-3",
          hasTaxSection ? "border-amber-500/20" : "border-border",
        )}
      >
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-800 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4" aria-hidden />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Needs attention</h2>
          <p className="text-[11px] text-muted">
            {totalCount} item{totalCount === 1 ? "" : "s"} need your review
          </p>
        </div>
      </div>

      {visibleTax.length > 0 && (
        <div className="border-b border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-2 px-4 pt-3">
            <Scale className="h-3.5 w-3.5 text-amber-800 dark:text-amber-200" aria-hidden />
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
              Tax & wash-sale
            </p>
          </div>
          <ul className="divide-y divide-border/60">
            {visibleTax.map((item) => {
              const quickAction = findQuickAction(item.actionId);
              const Icon = quickAction?.icon ?? Scale;

              return (
                <li key={item.id} className="px-4 py-3">
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
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] font-medium text-accent-strong transition hover:border-accent/40 hover:bg-muted-bg"
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
        <div className="space-y-3 px-4 py-3">
          {visibleQueue.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">
                Priority queue
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {visibleQueue.map((item) => {
                  const actionId = item.action;
                  const quickAction = findQuickAction(actionId);
                  const Icon = quickAction?.icon ?? Sparkles;

                  return (
                    <div
                      key={`${item.action}-${item.symbol ?? "portfolio"}-${item.priority}-${item.alertId ?? "current"}`}
                      className="relative rounded-xl border border-border bg-background px-3 py-2"
                    >
                      {item.alertId && onDismissAttention && (
                        <IconButton
                          size="sm"
                          aria-label="Dismiss alert"
                          onClick={() => onDismissAttention(item.alertId!)}
                          className="absolute right-2 top-2"
                        >
                          <X className="h-3.5 w-3.5" />
                        </IconButton>
                      )}
                      <div className="inline-flex max-w-full flex-col items-start gap-1 pr-6 text-left">
                        <span className="inline-flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-foreground">
                          <Icon className="h-3.5 w-3.5 shrink-0 text-accent-strong" aria-hidden />
                          {capitalizeFirstLetter(item.label)}
                          {item.symbol && (
                            <span className="font-mono text-accent-strong">
                              {item.symbol}
                            </span>
                          )}
                          {item.source === "historical" && item.daysActive != null && (
                            <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:text-amber-200">
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
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">
                Suggested actions
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
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
                      className="inline-flex max-w-full flex-col items-start gap-0.5 rounded-xl border border-border bg-background px-3 py-2 text-left transition hover:border-accent/40 hover:bg-muted-bg disabled:opacity-60"
                    >
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                        <Icon className="h-3.5 w-3.5 shrink-0 text-accent-strong" aria-hidden />
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
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted">
                  From recent trades
                </p>
              )}
              <div className="grid gap-2 sm:grid-cols-2">
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
        </div>
      )}

      {!showAll && hiddenCount > 0 && (
        <div className="border-t border-border px-4 py-2.5">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="text-xs font-medium text-accent-strong transition hover:underline"
          >
            Show {hiddenCount} more
          </button>
        </div>
      )}
    </section>
  );
}
