import type {
  RecentOrderEntry,
  RecentOrdersResponse,
  SuggestedAnalysisAction,
} from "@/app/types/schwab";
import { formatUsd } from "@/lib/formatCurrency";

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
