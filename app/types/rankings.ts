export type RankingItem = {
  symbol: string;
  rank: number;
  final_score: number;
  ml_probability: number | null;
  expected_excess_return: number | null;
};

export type RankingsTopResponse = {
  api_version: string;
  timestamp: string;
  run_id: string;
  as_of_date: string;
  regime_id: string | null;
  items: RankingItem[];
};

export type PortfolioHoldingV1 = {
  symbol: string;
  weight: number;
  score_contribution: number;
  final_score?: number | null;
  expected_excess_return?: number | null;
};

export type PortfolioLatestResponse = {
  api_version: string;
  timestamp: string;
  portfolio_id: string;
  ranking_run_id: string;
  as_of_date: string;
  sizing_mode: string;
  holdings: PortfolioHoldingV1[];
  metrics: {
    expected_return_5d: number;
    expected_excess_5d: number;
    volatility?: number | null;
    beta_vs_spy?: number | null;
    correlation_risk_score?: number | null;
    sector_breakdown: Record<string, number>;
    turnover_estimate?: number | null;
    concentration_hhi?: number | null;
  };
  risk_layer?: Record<string, unknown> | null;
};

export type SystemHealthResponse = {
  api_version: string;
  system_status: string;
  regime_id?: string | null;
  as_of_date?: string | null;
  universe_size?: number | null;
  last_ranking_run_at?: string | null;
  last_portfolio_run_at?: string | null;
  last_pipeline_run_time?: string | null;
};
