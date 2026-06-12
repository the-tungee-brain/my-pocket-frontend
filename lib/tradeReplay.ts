import type {
  TradeReplayActionability,
  TradeReplayEvent,
  TradeReplayResponse,
  TradeReplaySeverity,
} from "@/app/types/tradeReplay";

const MARKET_TIME_ZONE = "America/New_York";
const REGULAR_OPEN_MINUTES = 9 * 60 + 30;
const REGULAR_CLOSE_MINUTES = 16 * 60;

const SAME_CANDLE_LONG_TRIGGER_TYPES = new Set([
  "entry_triggered",
  "long_trigger_activated",
  "opening_range_broke",
]);

const SAME_CANDLE_INVALIDATION_TYPES = new Set([
  "opening_range_failed",
  "setup_invalidated",
]);

function parseReplayTimestamp(value?: string | null): number {
  if (!value) return Number.NaN;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function canonicalEventTime(event: TradeReplayEvent): string {
  const marketTimestamp = parseReplayTimestamp(event.event_time);
  if (Number.isFinite(marketTimestamp)) {
    return new Date(marketTimestamp).toISOString();
  }

  const ingestionTimestamp = parseReplayTimestamp(event.created_at);
  if (Number.isFinite(ingestionTimestamp)) {
    return new Date(ingestionTimestamp).toISOString();
  }

  return event.event_time;
}

function eventTimestamp(event: TradeReplayEvent): number {
  const parsed = parseReplayTimestamp(event.event_time);
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER;
}

function sameMarketMinute(left: TradeReplayEvent, right: TradeReplayEvent): boolean {
  const leftTimestamp = eventTimestamp(left);
  const rightTimestamp = eventTimestamp(right);
  if (
    leftTimestamp === Number.MAX_SAFE_INTEGER ||
    rightTimestamp === Number.MAX_SAFE_INTEGER
  ) {
    return false;
  }

  return Math.floor(leftTimestamp / 60_000) === Math.floor(rightTimestamp / 60_000);
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

function isSameCandleLongTrigger(event: TradeReplayEvent): boolean {
  if (!SAME_CANDLE_LONG_TRIGGER_TYPES.has(event.event_type)) return false;
  if (event.event_type === "long_trigger_activated") return true;

  return /\blong\b|break(?:out)? above|above the opening range/i.test(
    `${event.event_type} ${event.message}`,
  );
}

function isSameCandleInvalidation(event: TradeReplayEvent): boolean {
  return (
    SAME_CANDLE_INVALIDATION_TYPES.has(event.event_type) &&
    /opening range/i.test(`${event.event_type} ${event.message}`)
  );
}

function collapseSameCandleTriggerInvalidations(
  events: TradeReplayEvent[],
): TradeReplayEvent[] {
  const collapsed: TradeReplayEvent[] = [];

  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    const next = events[index + 1];

    if (
      next &&
      event.symbol.toUpperCase() === next.symbol.toUpperCase() &&
      event.workflow === next.workflow &&
      sameMarketMinute(event, next) &&
      isSameCandleLongTrigger(event) &&
      isSameCandleInvalidation(next)
    ) {
      collapsed.push({
        ...event,
        id: `${event.id}-${next.id}-same-candle-failed`,
        event_type: "long_breakout_failed_same_candle",
        message:
          "Long breakout triggered but immediately failed back inside the opening range.",
        severity: "warning",
        actionability: "invalidated",
        dedupe_key: `${event.dedupe_key ?? event.id}|${next.dedupe_key ?? next.id}|same-candle-failed`,
      });
      index += 1;
      continue;
    }

    collapsed.push(event);
  }

  return collapsed;
}

function normalizeTradeReplayEvent(event: TradeReplayEvent): TradeReplayEvent {
  return { ...event, event_time: canonicalEventTime(event) };
}

export function normalizeTradeReplayResponse(
  response: TradeReplayResponse,
): TradeReplayResponse {
  const seen = new Set<string>();
  const events = collapseSameCandleTriggerInvalidations(
    [...(response.events ?? [])]
      .map(normalizeTradeReplayEvent)
      .sort((left, right) => eventTimestamp(left) - eventTimestamp(right))
      .filter((event) => {
        const key = replayDedupeKey(event);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }),
  );

  return { ...response, events };
}

function marketTimeParts(value: string): { hour: number; minute: number } | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: MARKET_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value);
  const minute = Number(parts.find((part) => part.type === "minute")?.value);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return { hour, minute };
}

export function replaySessionLabel(value: string): string {
  const parts = marketTimeParts(value);
  if (!parts) return "";

  const minutes = parts.hour * 60 + parts.minute;
  if (minutes < REGULAR_OPEN_MINUTES) return "Pre-market session ET";
  if (minutes < REGULAR_CLOSE_MINUTES) return "Regular session ET";
  return "After-hours session ET";
}

export function formatReplayEventTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const displayTime = new Intl.DateTimeFormat("en-US", {
    timeZone: MARKET_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);

  return `${displayTime} ET`;
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
    long_breakout_failed_same_candle: "Long breakout failed",
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
