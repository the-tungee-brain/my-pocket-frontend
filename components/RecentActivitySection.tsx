"use client";

import { ArrowRightLeft, RefreshCw } from "lucide-react";
import { Fragment, useCallback, useEffect, useState } from "react";
import type {
  RecentActivitySummary,
  RecentOrderEntry,
  RecentOrderLegEntry,
  SuggestedAnalysisAction,
} from "@/app/types/schwab";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { FreshnessLabel } from "@/components/ui/FreshnessLabel";
import { fetchRecentOrders } from "@/lib/apiClient";
import { findQuickAction } from "@/lib/quickActions";
import {
  formatLegContractLabel,
  formatLegFillPrice,
  formatLegPremium,
  formatLegQuantity,
  formatLegTotalCash,
  formatOrderContractLabel,
  formatOrderFillPrice,
  formatOrderFillTime,
  formatOrderPremiumPerContract,
  formatOrderQuantity,
  formatOrderSide,
  formatOrderStrategyBadge,
  formatOrderTotalCash,
  groupOrdersForDisplay,
  isMultiLegOrder,
  pickSuggestedActions,
  suggestedActionToQuickActionId,
} from "@/lib/recentOrders";
import { cn } from "@/lib/utils";

type Props = {
  accessToken: string;
  symbol?: string | null;
  summary?: RecentActivitySummary | null;
  /** Load every fill from /recent-orders instead of the portfolio summary preview (5 rows). */
  showFullHistory?: boolean;
  onRunSuggestedAction?: (actionId: string) => void;
  onRefresh?: () => void | Promise<void>;
  compact?: boolean;
  hideSuggestedActions?: boolean;
  variant?: "default" | "position";
  className?: string;
};

const ACTIVITY_DAY_OPTIONS = [7, 30, 60] as const;
const ACTIVITY_PAGE_SIZE = 25;

const activityFilterLabelClass =
  "w-14 shrink-0 text-[10px] font-semibold uppercase tracking-wide text-muted";

function StrategyBadge({ label }: { label: string }) {
  return (
    <span className="mt-0.5 inline-flex max-w-full rounded-full bg-accent-muted px-2 py-0.5 text-[10px] font-medium text-accent-strong">
      {label}
    </span>
  );
}

function OrderLegSubRow({
  leg,
  compact,
}: {
  leg: RecentOrderLegEntry;
  compact?: boolean;
}) {
  return (
    <tr className="border-t border-border/60">
      <td className="py-3 text-left text-sm text-muted" />
      <td className="py-3 text-left text-sm text-muted">
        <span className="pl-3">↳ {formatLegContractLabel(leg) ?? "Leg"}</span>
      </td>
      <td className="py-3 text-left text-sm text-muted">
        {formatOrderSide(leg.instruction)}
      </td>
      <td className="py-3 text-right tabular-nums text-sm text-muted">
        {formatLegQuantity(leg)}
      </td>
      <td className="py-3 text-right tabular-nums text-sm text-muted">
        {formatLegFillPrice(leg)}
      </td>
      <td className="py-3 text-right tabular-nums text-sm text-muted">
        {formatLegPremium(leg)}
      </td>
      <td className="py-3 text-right tabular-nums text-sm text-muted">
        {formatLegTotalCash(leg)}
      </td>
      {!compact && <td className="py-3 text-left text-sm text-muted" />}
    </tr>
  );
}

function OrderRow({
  order,
  compact,
  showRollBadge = true,
}: {
  order: RecentOrderEntry;
  compact?: boolean;
  showRollBadge?: boolean;
}) {
  const contractLabel = formatOrderContractLabel(order);
  const strategyBadge = showRollBadge ? formatOrderStrategyBadge(order) : null;
  const extraLegs = (order.legs ?? []).slice(1);
  const showLegRows = isMultiLegOrder(order) && extraLegs.length > 0;

  return (
    <>
      <tr className="border-t border-border/60">
        <td className="py-3 text-left text-sm text-muted">
          {formatOrderFillTime(order.fillTime)}
        </td>
        <td className="py-3 text-left text-sm">
          <div className="font-mono font-medium text-foreground">
            {order.symbol}
          </div>
          {contractLabel && (
            <div className="mt-0.5 text-[11px] text-muted">{contractLabel}</div>
          )}
          {strategyBadge && <StrategyBadge label={strategyBadge} />}
        </td>
        <td className="py-3 text-left text-sm">
          {formatOrderSide(order.side)}
        </td>
        <td className="py-3 text-right tabular-nums text-sm">
          {formatOrderQuantity(order)}
        </td>
        <td className="py-3 text-right tabular-nums text-sm">
          {formatOrderFillPrice(order)}
        </td>
        <td className="py-3 text-right tabular-nums text-sm">
          {formatOrderPremiumPerContract(order)}
        </td>
        <td className="py-3 text-right tabular-nums text-sm">
          {formatOrderTotalCash(order)}
        </td>
        {!compact && (
          <td className="py-3 text-left text-sm text-muted">
            {order.orderType ?? "—"}
          </td>
        )}
      </tr>
      {showLegRows &&
        extraLegs.map((leg, index) => (
          <OrderLegSubRow
            key={`${order.orderId ?? order.fillTime}-leg-${leg.legId ?? index}`}
            leg={leg}
            compact={compact}
          />
        ))}
    </>
  );
}

function OrderRows({
  orders,
  compact,
  variant = "default",
}: {
  orders: RecentOrderEntry[];
  compact?: boolean;
  variant?: "default" | "position";
}) {
  if (!orders.length) {
    return (
      <p className="py-3 text-sm text-muted">
        No filled orders in the last 30 days.
      </p>
    );
  }

  const displayGroups = groupOrdersForDisplay(orders);

  return (
    <>
      <div className="hidden overflow-x-auto scrollbar-dark md:block">
        <table className="w-full table-fixed text-sm">
          {compact ? (
            <colgroup>
              <col className="w-[13%]" />
              <col className="w-[25%]" />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
              <col className="w-[12%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
            </colgroup>
          ) : (
            <colgroup>
              <col className="w-[12%]" />
              <col className="w-[23%]" />
              <col className="w-[11%]" />
              <col className="w-[9%]" />
              <col className="w-[11%]" />
              <col className="w-[13%]" />
              <col className="w-[13%]" />
              <col className="w-[8%]" />
            </colgroup>
          )}
          <thead className="border-b border-border/60 text-[11px] font-medium uppercase tracking-wide text-muted">
            <tr>
              <th className="py-2.5 text-left">Filled</th>
              <th className="py-2.5 text-left">Symbol / contract</th>
              <th className="py-2.5 text-left">Side</th>
              <th className="py-2.5 text-right">Qty</th>
              <th className="py-2.5 text-right">Fill</th>
              <th className="py-2.5 text-right">Premium</th>
              <th className="py-2.5 text-right">Total cash</th>
              {!compact && <th className="py-2.5 text-left">Type</th>}
            </tr>
          </thead>
          <tbody>
            {displayGroups.map((group) => {
              if (group.kind === "roll") {
                return (
                  <Fragment key={group.groupId}>
                    <tr className="border-t border-border/60">
                      <td
                        colSpan={compact ? 7 : 8}
                        className="py-3 text-left text-[11px] font-medium text-muted"
                      >
                        {group.label}
                      </td>
                    </tr>
                    {group.orders.map((order, index) => (
                      <OrderRow
                        key={`${group.groupId}-${order.orderId ?? index}`}
                        order={order}
                        compact={compact}
                        showRollBadge={false}
                      />
                    ))}
                  </Fragment>
                );
              }

              return (
                <OrderRow
                  key={`${group.order.orderId ?? group.order.fillTime}-${group.order.side}`}
                  order={group.order}
                  compact={compact}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      <div
        className={cn(
          "divide-y divide-border/60 md:hidden",
          variant === "position" && "space-y-3 divide-y-0",
        )}
      >
        {displayGroups.map((group) => {
          if (group.kind === "roll") {
            return (
              <div key={group.groupId}>
                <div className="border-b border-border/60 py-3 text-[11px] font-medium text-muted">
                  {group.label}
                </div>
                {group.orders.map((order, index) => (
                  <OrderMobileCard
                    key={`${group.groupId}-${order.orderId ?? index}`}
                    order={order}
                    showRollBadge={false}
                    variant={variant}
                  />
                ))}
              </div>
            );
          }

          return (
            <OrderMobileCard
              key={`${group.order.orderId ?? group.order.fillTime}-mobile`}
              order={group.order}
              variant={variant}
            />
          );
        })}
      </div>
    </>
  );
}

function OrderMobileCard({
  order,
  showRollBadge = true,
  variant = "default",
}: {
  order: RecentOrderEntry;
  showRollBadge?: boolean;
  variant?: "default" | "position";
}) {
  const contractLabel = formatOrderContractLabel(order);
  const strategyBadge = showRollBadge ? formatOrderStrategyBadge(order) : null;
  const extraLegs = (order.legs ?? []).slice(1);

  return (
    <div
      className={cn(
        "py-3",
        variant === "position" && "rounded-[var(--app-radius)]",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-sm font-medium">{order.symbol}</span>
        <span className="text-xs text-muted">
          {formatOrderFillTime(order.fillTime)}
        </span>
      </div>
      {contractLabel && (
        <p className="mt-0.5 text-[11px] text-muted">{contractLabel}</p>
      )}
      {strategyBadge && (
        <div className="mt-1">
          <StrategyBadge label={strategyBadge} />
        </div>
      )}
      <div className="mt-1 flex items-center justify-between gap-2 text-xs text-muted">
        <span>{formatOrderSide(order.side)}</span>
        <span className="tabular-nums text-right">
          {formatOrderQuantity(order)} @ {formatOrderFillPrice(order)}
          {order.totalCash != null
            ? ` (${formatOrderTotalCash(order)} total)`
            : ""}
        </span>
      </div>
      {extraLegs.map((leg, index) => (
        <div
          key={`${order.orderId ?? order.fillTime}-mobile-leg-${leg.legId ?? index}`}
          className="mt-1 border-l border-border pl-3 text-[11px] text-muted"
        >
          <span>{formatOrderSide(leg.instruction)}</span>
          {" · "}
          <span>{formatLegContractLabel(leg) ?? "Leg"}</span>
          {" · "}
          <span className="tabular-nums">
            {formatLegQuantity(leg)} @ {formatLegFillPrice(leg)}
          </span>
        </div>
      ))}
    </div>
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

function ActivityFilters({
  daysBack,
  onDaysBackChange,
  symbolFilter,
  onSymbolFilterChange,
  activityBySymbol,
  disabled,
}: {
  daysBack: number;
  onDaysBackChange: (days: number) => void;
  symbolFilter: string | null;
  onSymbolFilterChange: (symbol: string | null) => void;
  activityBySymbol: Record<string, number>;
  disabled?: boolean;
}) {
  const symbolOptions = Object.entries(activityBySymbol).sort(
    ([, a], [, b]) => b - a,
  );

  const symbolPillClass = (active: boolean) =>
    cn(
      "inline-flex items-center justify-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
      active
        ? "border-accent/40 bg-accent-muted text-accent-strong"
        : "border-border bg-background text-muted hover:border-accent/30 hover:text-foreground",
    );

  return (
    <div className="space-y-3 border-b border-border px-4 py-3">
      <div className="flex items-center gap-3">
        <span className={activityFilterLabelClass}>Period</span>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {ACTIVITY_DAY_OPTIONS.map((days) => {
            const active = daysBack === days;
            return (
              <button
                key={days}
                type="button"
                disabled={disabled}
                onClick={() => onDaysBackChange(days)}
                className={cn(
                  symbolPillClass(active),
                  disabled && "opacity-60",
                )}
              >
                {days}d
              </button>
            );
          })}
        </div>
      </div>

      {symbolOptions.length > 1 && (
        <div className="flex items-start gap-3">
          <span className={cn(activityFilterLabelClass, "pt-1")}>Symbol</span>
          <div className="grid min-w-0 flex-1 grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-1.5 sm:grid-cols-[repeat(auto-fill,minmax(6rem,1fr))]">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onSymbolFilterChange(null)}
              className={cn(symbolPillClass(symbolFilter == null), "w-full")}
            >
              All
            </button>
            {symbolOptions.map(([sym, count]) => {
              const active = symbolFilter === sym;
              return (
                <button
                  key={sym}
                  type="button"
                  disabled={disabled}
                  onClick={() => onSymbolFilterChange(sym)}
                  className={cn(symbolPillClass(active), "w-full")}
                >
                  <span className="font-mono">{sym}</span>
                  <span className="tabular-nums text-[10px] opacity-80">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityPagination({
  page,
  totalPages,
  totalOrders,
  offset,
  pageCount,
  onPageChange,
  disabled,
}: {
  page: number;
  totalPages: number;
  totalOrders: number;
  offset: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  if (totalOrders <= 0) return null;

  const rangeStart = totalOrders === 0 ? 0 : offset + 1;
  const rangeEnd = offset + pageCount;

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[11px] text-muted">
        Showing {rangeStart}–{rangeEnd} of {totalOrders}
      </p>
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            size="xs"
            variant="outline"
            disabled={disabled || page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <span className="min-w-24 text-center text-[11px] text-muted">
            Page {page} of {totalPages}
          </span>
          <Button
            size="xs"
            variant="outline"
            disabled={disabled || page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

export function RecentActivitySection({
  accessToken,
  symbol = null,
  summary = null,
  showFullHistory = false,
  onRunSuggestedAction,
  onRefresh,
  compact = false,
  hideSuggestedActions = false,
  variant = "default",
  className,
}: Props) {
  const [orders, setOrders] = useState<RecentOrderEntry[]>(
    summary?.latestOrders ?? [],
  );
  const [suggestedActions, setSuggestedActions] = useState(
    summary?.suggestedActions ?? [],
  );
  const [daysBack, setDaysBack] = useState(
    showFullHistory ? 7 : (summary?.daysBack ?? 7),
  );
  const [symbolFilter, setSymbolFilter] = useState<string | null>(null);
  const [activityBySymbol, setActivityBySymbol] = useState<
    Record<string, number>
  >({});
  const [recentOrderCount, setRecentOrderCount] = useState(
    summary?.recentOrderCount ?? 0,
  );
  const [totalOrders, setTotalOrders] = useState(summary?.totalOrders ?? 0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const isPositionVariant = variant === "position";
  const usesPagination =
    Boolean(symbol || showFullHistory) && !compact && !isPositionVariant;
  const totalPages = Math.max(1, Math.ceil(totalOrders / ACTIVITY_PAGE_SIZE));

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset pagination when the selected activity scope changes.
  useEffect(() => {
    setPage(1);
  }, [daysBack, symbolFilter, symbol]);

  const load = useCallback(
    async (refresh = false) => {
      if (!accessToken) return;

      setLoading(true);
      setError(null);

      try {
        const data = await fetchRecentOrders(accessToken, {
          symbol: symbol ?? symbolFilter ?? undefined,
          daysBack,
          limit: usesPagination ? ACTIVITY_PAGE_SIZE : undefined,
          offset: usesPagination ? (page - 1) * ACTIVITY_PAGE_SIZE : undefined,
          refresh,
        });
        setOrders(data.orders);
        setSuggestedActions(data.suggestedActions);
        setTotalOrders(data.totalOrders);
        setRecentOrderCount(data.recentOrderCount);
        if (!symbol && !symbolFilter) {
          setActivityBySymbol(data.activityBySymbol ?? {});
        }
        setLastUpdated(Date.now());
      } catch {
        setError("Could not load recent trade activity.");
      } finally {
        setLoading(false);
      }
    },
    [accessToken, symbol, symbolFilter, daysBack, page, usesPagination],
  );

  useEffect(() => {
    if (symbol || showFullHistory) {
      void load(false);
      return;
    }

    if (summary && !showFullHistory) {
      setOrders(summary.latestOrders);
      setSuggestedActions(summary.suggestedActions);
      setDaysBack(summary.daysBack);
      setRecentOrderCount(summary.recentOrderCount);
      setTotalOrders(summary.totalOrders);
      setActivityBySymbol(
        Object.fromEntries(
          (summary.symbolsTraded ?? []).map((item) => [
            item.symbol,
            item.orderCount,
          ]),
        ),
      );
    }
  }, [symbol, showFullHistory, summary, load]);

  const displayOrders =
    compact || isPositionVariant ? orders.slice(0, 5) : orders;

  const title = isPositionVariant
    ? "Recent trades"
    : symbol
      ? `${symbol} recent trades`
      : "Recent trade activity";

  const subtitle = (() => {
    if (usesPagination) {
      const scope = symbol
        ? `${symbol} · `
        : symbolFilter
          ? `${symbolFilter} · `
          : "";
      if (recentOrderCount > 0 && daysBack > 7 && !symbol && !symbolFilter) {
        return `${recentOrderCount} in the last 7 days · ${totalOrders} total · ${scope}last ${daysBack} days`;
      }
      return `${totalOrders} filled order${totalOrders === 1 ? "" : "s"} · ${scope}last ${daysBack} days`;
    }

    if (symbol) {
      return `${displayOrders.length} filled order${displayOrders.length === 1 ? "" : "s"} in the last ${daysBack} days`;
    }

    const total = summary?.totalOrders ?? displayOrders.length;
    if (total > displayOrders.length) {
      return `${recentOrderCount > 0 ? `${recentOrderCount} in the last 7 days · ` : ""}${total} in ${daysBack} days · showing ${displayOrders.length}`;
    }

    return recentOrderCount > 0
      ? `${recentOrderCount} in the last 7 days · ${totalOrders || displayOrders.length} in ${daysBack} days`
      : `${totalOrders || displayOrders.length} filled orders · last ${daysBack} days`;
  })();

  if (
    !symbol &&
    !summary &&
    !showFullHistory &&
    !loading &&
    !displayOrders.length
  ) {
    return null;
  }

  if (isPositionVariant) {
    return (
      <section
        className={cn("w-full max-w-none overflow-hidden", className)}
        aria-label={title}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border/50 py-4">
          <div className="min-w-0">
            <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {displayOrders.length
                ? `${displayOrders.length} fill${displayOrders.length === 1 ? "" : "s"} · last ${daysBack} days`
                : `Last ${daysBack} days`}
            </p>
            {lastUpdated != null && symbol && (
              <FreshnessLabel
                updatedAt={lastUpdated}
                pending={loading}
                className="mt-0.5"
              />
            )}
          </div>

          <Button
            size="xs"
            variant="outline"
            disabled={loading}
            onClick={() => void load(true)}
            aria-label="Refresh trade activity"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", loading && "animate-spin")}
              aria-hidden
            />
            Refresh
          </Button>
        </div>

        <div className="py-4">
          {error ? (
            <ErrorBanner message={error} onRetry={() => void load(true)} />
          ) : loading && !displayOrders.length ? (
            <div className="space-y-2">
              {[1, 2, 3].map((row) => (
                <div
                  key={row}
                  className="h-12 animate-pulse rounded-[var(--app-radius)] bg-muted-bg"
                />
              ))}
            </div>
          ) : displayOrders.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm font-medium text-foreground">
                No recent fills
              </p>
              <p className="mt-1 text-xs text-muted">
                No filled orders in the last {daysBack} days.
              </p>
            </div>
          ) : (
            <OrderRows orders={displayOrders} compact variant="position" />
          )}
        </div>
      </section>
    );
  }

  return (
    <section className={cn("w-full space-y-4", className)} aria-label={title}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="min-w-0">
            <h2 className="text-[11px] font-semibold uppercase tracking-wide text-muted">
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted">{subtitle}</p>
            {lastUpdated != null && symbol && (
              <FreshnessLabel
                updatedAt={lastUpdated}
                pending={loading}
                className="mt-0.5"
              />
            )}
          </div>
        </div>

        {(symbol || showFullHistory || onRefresh) && (
          <Button
            size="xs"
            variant="outline"
            disabled={loading}
            onClick={() => {
              if (symbol || showFullHistory) {
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

      {showFullHistory && !symbol && (
        <ActivityFilters
          daysBack={daysBack}
          onDaysBackChange={setDaysBack}
          symbolFilter={symbolFilter}
          onSymbolFilterChange={setSymbolFilter}
          activityBySymbol={activityBySymbol}
          disabled={loading}
        />
      )}

      {error && (
        <div className="pt-3">
          <ErrorBanner message={error} onRetry={() => void load(true)} />
        </div>
      )}

      {loading && !displayOrders.length ? (
        <div className="space-y-2 py-4">
          {[1, 2, 3].map((row) => (
            <div
              key={row}
              className="h-10 animate-pulse rounded-lg bg-muted-bg"
            />
          ))}
        </div>
      ) : displayOrders.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm font-medium text-foreground">
            No fills in this range
          </p>
          <p className="mt-1 text-xs text-muted">
            {symbolFilter
              ? `No filled orders for ${symbolFilter} in the last ${daysBack} days.`
              : `No filled orders in the last ${daysBack} days.`}
          </p>
          {symbolFilter && (
            <button
              type="button"
              onClick={() => setSymbolFilter(null)}
              className="mt-3 text-xs font-medium text-accent-strong hover:underline"
            >
              Clear symbol filter
            </button>
          )}
        </div>
      ) : (
        <>
          <OrderRows orders={displayOrders} compact={compact || !!symbol} />
          {usesPagination && (
            <ActivityPagination
              page={page}
              totalPages={totalPages}
              totalOrders={totalOrders}
              offset={(page - 1) * ACTIVITY_PAGE_SIZE}
              pageCount={displayOrders.length}
              onPageChange={setPage}
              disabled={loading}
            />
          )}
        </>
      )}

      <SuggestedActionChips
        actions={hideSuggestedActions ? [] : suggestedActions}
        onRun={onRunSuggestedAction}
        disabled={loading}
      />
    </section>
  );
}
