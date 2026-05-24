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

export function formatOrderQuantity(order: RecentOrderEntry): string {
  if (order.quantity == null) return "—";
  const qty = order.quantity;
  const unit = order.assetType === "OPTION" ? " ct" : "";
  return `${qty % 1 === 0 ? qty.toFixed(0) : qty}${unit}`;
}

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
