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
