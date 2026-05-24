"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRightLeft, RefreshCw } from "lucide-react";
import type {
  RecentActivitySummary,
  RecentOrderEntry,
  SuggestedAnalysisAction,
} from "@/app/types/schwab";
import { fetchRecentOrders } from "@/lib/apiClient";
import {
  formatOrderFillTime,
  formatOrderFillPrice,
  formatOrderPremiumPerContract,
  formatOrderQuantity,
  formatOrderTotalCash,
  formatOrderSide,
  pickSuggestedActions,
  suggestedActionToQuickActionId,
} from "@/lib/recentOrders";
import { findQuickAction } from "@/lib/quickActions";
import { formatRelativeUpdatedAt } from "@/lib/timeUtils";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { cn } from "@/lib/utils";

type Props = {
  accessToken: string;
  symbol?: string | null;
  summary?: RecentActivitySummary | null;
  onRunSuggestedAction?: (actionId: string) => void;
  onRefresh?: () => void | Promise<void>;
  compact?: boolean;
  className?: string;
};

function OrderRows({
  orders,
  compact,
}: {
  orders: RecentOrderEntry[];
  compact?: boolean;
}) {
  if (!orders.length) {
    return (
      <p className="px-4 py-3 text-sm text-muted">
        No filled orders in the last 30 days.
      </p>
    );
  }

  return (
    <>
      <div className="hidden sm:block">
        <table className="w-full table-fixed text-sm">
          <thead className="border-b border-border bg-surface-elevated/60 text-[11px] font-medium uppercase tracking-wide text-muted">
            <tr>
              <th className="w-[12%] px-4 py-2.5 text-left">Filled</th>
              <th className="w-[10%] px-4 py-2.5 text-left">Symbol</th>
              <th className="w-[14%] px-4 py-2.5 text-left">Side</th>
              <th className="w-[8%] px-4 py-2.5 text-right">Qty</th>
              <th className="w-[12%] px-4 py-2.5 text-right">Fill</th>
              <th className="w-[14%] px-4 py-2.5 text-right">Premium</th>
              <th className="w-[14%] px-4 py-2.5 text-right">Total cash</th>
              {!compact && (
                <th className="w-[10%] px-4 py-2.5 text-left">Type</th>
              )}
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr
                key={`${order.orderId ?? order.fillTime ?? index}-${order.side}`}
                className="border-t border-border"
              >
                <td className="px-4 py-2.5 text-left text-xs text-muted">
                  {formatOrderFillTime(order.fillTime)}
                </td>
                <td className="px-4 py-2.5 font-mono text-left text-xs font-medium">
                  {order.symbol}
                </td>
                <td className="px-4 py-2.5 text-left text-xs">
                  {formatOrderSide(order.side)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-xs">
                  {formatOrderQuantity(order)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-xs">
                  {formatOrderFillPrice(order)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-xs">
                  {formatOrderPremiumPerContract(order)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-xs">
                  {formatOrderTotalCash(order)}
                </td>
                {!compact && (
                  <td className="px-4 py-2.5 text-left text-xs text-muted">
                    {order.orderType ?? "—"}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-border sm:hidden">
        {orders.map((order, index) => (
          <div
            key={`${order.orderId ?? order.fillTime ?? index}-mobile`}
            className="px-4 py-3"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-sm font-medium">
                {order.symbol}
              </span>
              <span className="text-xs text-muted">
                {formatOrderFillTime(order.fillTime)}
              </span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted">
              <span>{formatOrderSide(order.side)}</span>
              <span className="tabular-nums text-right">
                {formatOrderQuantity(order)} @ {formatOrderFillPrice(order)}
                {order.totalCash != null
                  ? ` (${formatOrderTotalCash(order)} total)`
                  : ""}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function SuggestedActionChips({
  actions,
  onRun,
  disabled,
}: {
  actions: SuggestedAnalysisAction[];
  onRun?: (actionId: string) => void;
  disabled?: boolean;
}) {
  const picked = pickSuggestedActions(actions);
  if (!picked.length || !onRun) return null;

  return (
    <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3">
      <p className="w-full text-[11px] font-medium uppercase tracking-wide text-muted">
        Suggested analysis
      </p>
      {picked.map((item) => {
        const actionId = suggestedActionToQuickActionId(item.action);
        const quickAction = findQuickAction(actionId);
        const Icon = quickAction?.icon ?? ArrowRightLeft;

        return (
          <button
            key={`${item.action}-${item.priority}`}
            type="button"
            disabled={disabled}
            title={item.reason}
            onClick={() => onRun(actionId)}
            className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-left text-[11px] font-medium text-foreground transition hover:border-accent/40 hover:bg-muted-bg disabled:opacity-60"
          >
            <Icon className="h-3 w-3 shrink-0 text-accent-strong" aria-hidden />
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function RecentActivitySection({
  accessToken,
  symbol = null,
  summary = null,
  onRunSuggestedAction,
  onRefresh,
  compact = false,
  className,
}: Props) {
  const [orders, setOrders] = useState<RecentOrderEntry[]>(
    summary?.latestOrders ?? [],
  );
  const [suggestedActions, setSuggestedActions] = useState(
    summary?.suggestedActions ?? [],
  );
  const [daysBack, setDaysBack] = useState(summary?.daysBack ?? 30);
  const [recentOrderCount, setRecentOrderCount] = useState(
    summary?.recentOrderCount ?? 0,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const load = useCallback(
    async (refresh = false) => {
      if (!accessToken) return;

      setLoading(true);
      setError(null);

      try {
        const data = await fetchRecentOrders(accessToken, {
          symbol,
          refresh,
        });
        setOrders(data.orders);
        setSuggestedActions(data.suggestedActions);
        setDaysBack(data.daysBack);
        setRecentOrderCount(
          data.orders.filter((order) => {
            if (!order.fillTime) return false;
            const fill = new Date(order.fillTime).getTime();
            const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
            return fill >= cutoff;
          }).length,
        );
        setLastUpdated(Date.now());
      } catch {
        setError("Could not load recent trade activity.");
      } finally {
        setLoading(false);
      }
    },
    [accessToken, symbol],
  );

  useEffect(() => {
    if (symbol) {
      void load(false);
      return;
    }

    if (summary) {
      setOrders(summary.latestOrders);
      setSuggestedActions(summary.suggestedActions);
      setDaysBack(summary.daysBack);
      setRecentOrderCount(summary.recentOrderCount);
    }
  }, [symbol, summary, load]);

  const displayOrders = symbol
    ? orders
    : orders.slice(0, compact ? 5 : orders.length);

  const title = symbol ? `${symbol} recent trades` : "Recent trade activity";

  const subtitle = symbol
    ? `${displayOrders.length} filled order${displayOrders.length === 1 ? "" : "s"} in the last ${daysBack} days`
    : recentOrderCount > 0
      ? `${recentOrderCount} fill${recentOrderCount === 1 ? "" : "s"} in the last 7 days · ${summary?.totalOrders ?? displayOrders.length} in ${daysBack} days`
      : `${summary?.totalOrders ?? 0} filled orders in the last ${daysBack} days`;

  if (!symbol && !summary && !loading && !displayOrders.length) {
    return null;
  }

  return (
    <section
      className={cn(
        "mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-secondary shadow-sm",
        className,
      )}
      aria-label={title}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border bg-surface-elevated/50 px-4 py-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent-strong">
            <ArrowRightLeft className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            <p className="text-[11px] text-muted">{subtitle}</p>
            {lastUpdated != null && symbol && (
              <p className="mt-0.5 text-[10px] text-muted">
                {formatRelativeUpdatedAt(lastUpdated)}
              </p>
            )}
          </div>
        </div>

        {(symbol || onRefresh) && (
          <Button
            size="xs"
            variant="outline"
            disabled={loading}
            onClick={() => {
              if (symbol) {
                void load(true);
                return;
              }
              void onRefresh?.();
            }}
            aria-label="Refresh trade activity"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", loading && "animate-spin")}
              aria-hidden
            />
            Refresh
          </Button>
        )}
      </div>

      {error && (
        <div className="px-4 pt-3">
          <ErrorBanner message={error} onRetry={() => void load(true)} />
        </div>
      )}

      {loading && !displayOrders.length ? (
        <div className="space-y-2 px-4 py-4">
          {[1, 2, 3].map((row) => (
            <div
              key={row}
              className="h-10 animate-pulse rounded-lg bg-muted-bg"
            />
          ))}
        </div>
      ) : (
        <OrderRows orders={displayOrders} compact={compact || !!symbol} />
      )}

      <SuggestedActionChips
        actions={suggestedActions}
        onRun={onRunSuggestedAction}
        disabled={loading}
      />
    </section>
  );
}
