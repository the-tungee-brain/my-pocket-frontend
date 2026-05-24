import type {
  RecentOrderEntry,
  RecentOrderLegEntry,
  RecentOrdersResponse,
  SuggestedAnalysisAction,
} from "@/app/types/schwab";
import { formatUsd } from "@/lib/formatCurrency";

export type OrderDisplayGroup =
  | {
      kind: "roll";
      groupId: string;
      label: string;
      orders: RecentOrderEntry[];
    }
  | {
      kind: "single";
      order: RecentOrderEntry;
    };

export function groupOrdersForDisplay(
  orders: RecentOrderEntry[],
): OrderDisplayGroup[] {
  const seenRollGroups = new Set<string>();
  const groups: OrderDisplayGroup[] = [];

  for (const order of orders) {
    if (order.activityGroupKind === "roll" && order.activityGroupId) {
      if (seenRollGroups.has(order.activityGroupId)) continue;
      seenRollGroups.add(order.activityGroupId);
      groups.push({
        kind: "roll",
        groupId: order.activityGroupId,
        label: order.activityGroupLabel ?? "Option roll",
        orders: orders.filter(
          (item) => item.activityGroupId === order.activityGroupId,
        ),
      });
      continue;
    }
    groups.push({ kind: "single", order });
  }

  return groups;
}

export function formatOrderContractLabel(order: RecentOrderEntry): string | null {
  return order.contractLabel ?? null;
}

export function formatLegContractLabel(leg: RecentOrderLegEntry): string | null {
  return leg.contractLabel ?? null;
}

export function isMultiLegOrder(order: RecentOrderEntry): boolean {
  return (order.legCount ?? 1) > 1 || (order.legs?.length ?? 0) > 1;
}

export function formatOrderStrategyBadge(order: RecentOrderEntry): string | null {
  if (order.activityGroupKind === "roll" && order.activityGroupLabel) {
    return order.activityGroupLabel;
  }
  return order.strategyLabel ?? null;
}

export function formatOrderSide(side: string): string {
  return side
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatOrderFillTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function isOptionLeg(leg: RecentOrderLegEntry): boolean {
  return leg.assetType === "OPTION";
}

export function formatLegQuantity(leg: RecentOrderLegEntry): string {
  if (leg.quantity == null) return "—";
  const qty = leg.quantity;
  if (isOptionLeg(leg)) return `${qty % 1 === 0 ? qty.toFixed(0) : qty} ct`;
  if (leg.assetType === "EQUITY") {
    return `${qty % 1 === 0 ? qty.toFixed(0) : qty} sh`;
  }
  return `${qty % 1 === 0 ? qty.toFixed(0) : qty}`;
}

export function formatLegFillPrice(leg: RecentOrderLegEntry): string {
  if (leg.averageFillPrice == null) return "—";
  const price = formatUsd(leg.averageFillPrice, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return isOptionLeg(leg) ? `${price}/ct` : `${price}/sh`;
}

export function formatLegPremium(leg: RecentOrderLegEntry): string {
  if (!isOptionLeg(leg) || leg.premiumPerContract == null) return "—";
  return formatUsd(leg.premiumPerContract, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatLegTotalCash(leg: RecentOrderLegEntry): string {
  if (leg.totalCash == null) return "—";
  return formatUsd(leg.totalCash, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function isOptionOrder(order: RecentOrderEntry): boolean {
  return order.assetType === "OPTION";
}

export function isEquityOrder(order: RecentOrderEntry): boolean {
  return order.assetType === "EQUITY";
}

export function formatOrderQuantity(order: RecentOrderEntry): string {
  if (order.quantity == null) return "—";
  const qty = order.quantity;
  if (isOptionOrder(order)) return `${qty % 1 === 0 ? qty.toFixed(0) : qty} ct`;
  if (isEquityOrder(order)) return `${qty % 1 === 0 ? qty.toFixed(0) : qty} sh`;
  return `${qty % 1 === 0 ? qty.toFixed(0) : qty}`;
}

export function formatOrderFillPrice(order: RecentOrderEntry): string {
  if (order.averageFillPrice == null) return "—";
  const price = formatUsd(order.averageFillPrice, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return isOptionOrder(order) ? `${price}/ct` : `${price}/sh`;
}

export function formatOrderPremiumPerContract(order: RecentOrderEntry): string {
  if (!isOptionOrder(order) || order.premiumPerContract == null) return "—";
  return formatUsd(order.premiumPerContract, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatOrderTotalCash(order: RecentOrderEntry): string {
  if (order.totalCash == null) return "—";
  return formatUsd(order.totalCash, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** @deprecated Use formatOrderTotalCash */
export function formatOrderTotalPremium(order: RecentOrderEntry): string {
  return formatOrderTotalCash(order);
}

/** @deprecated Use formatOrderFillPrice for per-share/contract-aware display */
export function formatOrderPrice(price?: number | null): string {
  if (price == null) return "—";
  return formatUsd(price, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Map backend analysis action values to quick-action chip ids. */
export function suggestedActionToQuickActionId(action: string): string {
  const normalized = action.trim().toLowerCase().replace(/_/g, "-");
  const aliases: Record<string, string> = {
    "tax-angle": "tax-angle",
    "what-changed": "what-changed",
    "risk-check": "risk-check",
    "daily-summary": "daily-summary",
    "assignment-risk": "assignment-risk",
    "concentration-check": "concentration-check",
  };
  return aliases[normalized] ?? normalized;
}

export function pickSuggestedActions(
  actions: SuggestedAnalysisAction[],
  limit = 3,
): SuggestedAnalysisAction[] {
  return [...actions].sort((a, b) => a.priority - b.priority).slice(0, limit);
}

export function hasRecentTradeActivity(
  response: RecentOrdersResponse | null | undefined,
): boolean {
  return !!response?.orders?.length;
}
