export type TradeReplayWorkflow = "day_trade" | "swing_trade";

export type TradeReplaySeverity = "info" | "important" | "warning";

export type TradeReplayActionability = "active" | "missed" | "invalidated";

export type TradeReplaySource = "realtime" | "delayed" | "historical";

export type TradeReplayEvent = {
  id: string | number;
  plan_id?: string | number | null;
  symbol: string;
  event_date?: string | null;
  workflow: TradeReplayWorkflow;
  event_type: string;
  event_time: string;
  level_price?: number | null;
  observed_price?: number | null;
  message: string;
  severity: TradeReplaySeverity;
  actionability: TradeReplayActionability;
  source: TradeReplaySource;
  source_freshness_label?: string | null;
  dedupe_key?: string | null;
  created_at?: string | null;
};

export type TradeReplayResponse = {
  symbol: string;
  date: string;
  workflow: TradeReplayWorkflow;
  source: TradeReplaySource;
  source_freshness_label?: string | null;
  events: TradeReplayEvent[];
};
