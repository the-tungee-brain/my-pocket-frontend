export type ExitVerdict = "HOLD" | "TRIM" | "REVIEW_SELL" | "EXIT";
export type ExitConfidence = "low" | "medium" | "high";

export type EquityExitGuidanceContext = {
  regimeId?: string | null;
  tradeQualityScore?: number | null;
  positionWeightPct?: number | null;
  openProfitLossPct?: number | null;
  rankingRank?: number | null;
};

export type EquityExitGuidance = {
  symbol: string;
  asOfDate?: string | null;
  eligible: boolean;
  verdict?: ExitVerdict | null;
  confidence?: ExitConfidence | null;
  exitUrgency?: number | null;
  primaryReason?: string | null;
  supportingFactors: string[];
  riskFactors: string[];
  wouldImprove: string[];
  wouldWorsen: string[];
  disclaimer: string;
  dataGaps: string[];
  context?: EquityExitGuidanceContext | null;
};

export type PortfolioExitAttentionItem = {
  symbol: string;
  verdict: ExitVerdict;
  confidence: ExitConfidence;
  exitUrgency: number;
  primaryReason: string;
};

export type PortfolioExitAttentionResponse = {
  items: PortfolioExitAttentionItem[];
};
