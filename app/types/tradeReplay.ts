export type TradeReplayWorkflow = "day_trade" | "swing_trade";

export type DayTradeReplayDirectionMode =
  | "long_only"
  | "short_only"
  | "long_and_short";

export type TradeReplaySeverity = "info" | "important" | "warning";

export type TradeReplayActionability = "active" | "missed" | "invalidated";

export type TradeReplaySource = "realtime" | "delayed" | "historical";

export type MissedMovesRange = "today" | "last_5_trading_days";

export type MissedMovesSort =
  | "most_recent"
  | "biggest_move"
  | "highest_setup_quality";

export type MissedMoveOutcome =
  | "target_hit"
  | "extended"
  | "invalidated"
  | "stopped";

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
  direction_mode?: DayTradeReplayDirectionMode | null;
  source: TradeReplaySource;
  source_freshness_label?: string | null;
  events: TradeReplayEvent[];
};

export type MissedMoveSummaryRow = {
  id: string | number;
  date: string;
  symbol: string;
  workflow?: TradeReplayWorkflow | null;
  setup_type: string;
  direction?: string | null;
  trigger_time?: string | null;
  trigger_price: number | null;
  outcome: MissedMoveOutcome;
  max_move_after_trigger_pct: number | null;
  setup_quality_score?: number | null;
  entry?: number | null;
  stop?: number | null;
  target_1?: number | null;
  target_2?: number | null;
  open_range_high?: number | null;
  open_range_low?: number | null;
  vwap?: number | null;
  event_count?: number | null;
  source?: TradeReplaySource | null;
  source_freshness_label?: string | null;
};

export type MissedMovesSummaryResponse = {
  range: MissedMovesRange;
  sort: MissedMovesSort;
  source?: TradeReplaySource | null;
  source_freshness_label?: string | null;
  rows: MissedMoveSummaryRow[];
};
