import type {
  TradeReplayActionability,
  TradeReplayEvent,
  TradeReplayResponse,
  TradeReplaySeverity,
} from "@/app/types/tradeReplay";

function eventTimestamp(event: TradeReplayEvent): number {
  const parsed = new Date(event.event_time).getTime();
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

function replayDedupeKey(event: TradeReplayEvent): string {
  return [
    event.symbol.toUpperCase(),
    event.workflow,
    event.event_date ?? "",
    event.event_type,
    event.dedupe_key ?? event.level_price ?? event.event_time,
  ].join("|");
}

export function normalizeTradeReplayResponse(
  response: TradeReplayResponse,
): TradeReplayResponse {
  const seen = new Set<string>();
  const events = [...(response.events ?? [])]
    .sort((left, right) => eventTimestamp(left) - eventTimestamp(right))
    .filter((event) => {
      const key = replayDedupeKey(event);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  return { ...response, events };
}

export function actionabilityLabel(
  value: TradeReplayActionability,
): string {
  if (value === "active") return "Still active";
  if (value === "missed") return "Missed";
  return "Invalidated";
}

export function eventTitle(eventType: string): string {
  const labels: Record<string, string> = {
    entry_missed: "Entry is now extended",
    entry_triggered: "Entry triggered",
    long_trigger_activated: "Long trigger activated",
    opening_range_broke: "Opening range broke",
    opening_range_failed: "Opening range failed",
    pullback_opportunity: "Pullback opportunity appeared",
    rr_degraded: "Current R/R degraded",
    setup_extended: "Setup became extended",
    setup_invalidated: "Setup invalidated",
    short_trigger_activated: "Short trigger activated",
    stop_hit: "Stop was hit",
    target_1_hit: "Target 1 hit",
    target_2_hit: "Target 2 hit",
    target_hit: "Target was reached",
    vwap_lost: "Price lost VWAP",
    vwap_reclaimed: "Price reclaimed VWAP",
  };
  if (labels[eventType]) return labels[eventType];

  return eventType
    .replace(/_/g, " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

export function severityClass(severity: TradeReplaySeverity): string {
  if (severity === "important") return "border-accent/50 text-foreground";
  if (severity === "warning") return "border-warning/60 text-warning";
  return "border-border/60 text-muted";
}
