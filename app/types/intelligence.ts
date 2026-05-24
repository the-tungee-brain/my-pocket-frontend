export type SignalSeverity = "info" | "watch" | "warning" | "critical";

export type IntelligenceSignal = {
  kind: string;
  severity: SignalSeverity;
  message: string;
  symbol?: string | null;
};

export type SectorWeight = {
  sector: string;
  weight_pct: number;
  symbols: string[];
};

export type PortfolioNewsItem = {
  symbol: string;
  headline: string;
  sentiment?: string | null;
  weight_pct?: number | null;
};

export type PortfolioDigest = {
  sector_weights: SectorWeight[];
  macro_regime?: string | null;
  top_news: PortfolioNewsItem[];
  earnings_this_week: string[];
};

export type ProactiveAlert = {
  action: string;
  label: string;
  reason: string;
  priority: number;
  symbol?: string | null;
};

export type PortfolioIntelligence = {
  signals: IntelligenceSignal[];
  digest?: PortfolioDigest | null;
  alerts: ProactiveAlert[];
};

export type PeerMetric = {
  symbol: string;
  name?: string | null;
  one_year_return?: string | null;
  pe_trailing?: string | null;
  sector?: string | null;
};

export type PeerComparison = {
  target_symbol: string;
  target_one_year_return?: string | null;
  target_pe_trailing?: string | null;
  peers: PeerMetric[];
  summary?: string | null;
};

export type EventTimelineEntry = {
  date: string;
  kind: string;
  title: string;
  detail?: string | null;
};

export type OptionsStrikeCandidate = {
  side: "call" | "put";
  strike: number;
  expiration: string;
  delta?: number | null;
  open_interest?: number | null;
  bid?: number | null;
  ask?: number | null;
  iv?: number | null;
  score: number;
  rationale: string;
};

export type OptionsScorecard = {
  underlying_price?: number | null;
  covered_call_candidates: OptionsStrikeCandidate[];
  csp_candidates: OptionsStrikeCandidate[];
  assignment_flags: string[];
};

export type CachedResearchSnippet = {
  sentiment?: string | null;
  investment_thesis?: string | null;
  key_strengths: string[];
  key_risks: string[];
  what_to_watch: string[];
  valuation_context?: string | null;
};

export type SymbolIntelligence = {
  symbol: string;
  signals: IntelligenceSignal[];
  peer_comparison?: PeerComparison | null;
  event_timeline: EventTimelineEntry[];
  options_scorecard?: OptionsScorecard | null;
  cached_research?: CachedResearchSnippet | null;
};
