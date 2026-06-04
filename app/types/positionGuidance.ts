export type SymbolThesis = "BULLISH" | "NEUTRAL" | "BEARISH";
export type GuidanceConfidence = "low" | "medium" | "high";

export type PositionKind =
  | "EQUITY_LONG"
  | "LONG_CALL"
  | "LONG_PUT"
  | "SHORT_CALL"
  | "SHORT_PUT";

export type EquityVerdict = "HOLD" | "TRIM" | "REVIEW_SELL" | "EXIT";
export type LongOptionVerdict = "HOLD" | "REVIEW_CLOSE" | "CLOSE";
export type ShortOptionVerdict =
  | "HOLD"
  | "ROLL"
  | "CLOSE"
  | "REVIEW_ASSIGNMENT_RISK";

export type PositionVerdict =
  | EquityVerdict
  | LongOptionVerdict
  | ShortOptionVerdict;

export type SymbolThesisBlock = {
  thesis: SymbolThesis;
  summary: string;
  tradeQualityScore?: number | null;
  regimeId?: string | null;
};

export type GuidanceDriver = {
  code: string;
  label: string;
  points: number;
  detail?: string | null;
};

export type ScoringContributor = {
  bucket: string;
  points: number;
  label: string;
  driverCode?: string | null;
};

export type PositionGuidanceItem = {
  positionKey: string;
  positionKind: PositionKind;
  displayLabel: string;
  instrumentSymbol: string;
  underlyingSymbol: string;
  putCall?: string | null;
  strike?: number | null;
  expiration?: string | null;
  quantity: number;
  marketValue: number;
  openProfitLossPct?: number | null;
  verdict: PositionVerdict;
  confidence: GuidanceConfidence;
  urgency: number;
  relativeRiskRank?: number;
  crossLegSanity?: boolean;
  primaryDriver?: GuidanceDriver;
  secondaryDriver?: GuidanceDriver | null;
  tertiaryDriver?: GuidanceDriver | null;
  justification: string;
  primaryReason: string;
  supportingFactors: string[];
  riskFactors: string[];
  scoringContributors?: ScoringContributor[];
};

export type SymbolPositionGuidance = {
  symbol: string;
  asOfDate?: string | null;
  hasPositions: boolean;
  thesis?: SymbolThesisBlock | null;
  positions: PositionGuidanceItem[];
  synthesisNarrative: string;
  analysisPrompt: string;
  disclaimer: string;
  dataGaps: string[];
  scoringTrace?: string;
};

export type PortfolioExitAttentionItem = {
  positionKey: string;
  symbol: string;
  positionKind: PositionKind;
  displayLabel: string;
  verdict: PositionVerdict;
  confidence: GuidanceConfidence;
  urgency: number;
  relativeRiskRank?: number;
  crossLegSanity?: boolean;
  primaryReason: string;
};

export type PortfolioExitAttentionResponse = {
  items: PortfolioExitAttentionItem[];
};
