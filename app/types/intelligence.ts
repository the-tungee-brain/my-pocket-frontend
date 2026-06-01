export type SignalSeverity = "info" | "watch" | "warning" | "critical";

export type IntelligenceSignal = {
  kind: string;
  severity: SignalSeverity;
  message: string;
  symbol?: string | null;
};

export type SectorWeight = {
  sector: string;
  weightPct: number;
  symbols: string[];
};

export type PortfolioNewsItem = {
  symbol: string;
  headline: string;
  sentiment?: string | null;
  weightPct?: number | null;
  url?: string | null;
};

export type MarketNewsItem = {
  headline: string;
  source?: string | null;
  url?: string | null;
};

export type PortfolioDigest = {
  sectorWeights: SectorWeight[];
  macroRegime?: string | null;
  macroNews?: MarketNewsItem[];
  topNews: PortfolioNewsItem[];
  earningsThisWeek: string[];
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
  oneYearReturn?: string | null;
  peTrailing?: string | null;
  sector?: string | null;
};

export type PeerComparison = {
  targetSymbol: string;
  targetOneYearReturn?: string | null;
  targetPeTrailing?: string | null;
  peers: PeerMetric[];
  summary?: string | null;
};

export type EventTimelineEntry = {
  date: string;
  kind: string;
  title: string;
  detail?: string | null;
  url?: string | null;
};

export type OptionsStrikeCandidate = {
  side: "call" | "put";
  strike: number;
  expiration: string;
  delta?: number | null;
  openInterest?: number | null;
  bid?: number | null;
  ask?: number | null;
  lastPrice?: number | null;
  mark?: number | null;
  theta?: number | null;
  iv?: number | null;
  score: number;
  rationale: string;
};

export type OptionsScorecard = {
  underlyingPrice?: number | null;
  coveredCallCandidates: OptionsStrikeCandidate[];
  cspCandidates: OptionsStrikeCandidate[];
  assignmentFlags: string[];
};

export type OptionChainSideQuote = {
  bid?: number | null;
  ask?: number | null;
  mark?: number | null;
  lastPrice?: number | null;
  delta?: number | null;
  theta?: number | null;
  openInterest?: number | null;
  iv?: number | null;
};

export type OptionChainTableRow = {
  strike: number;
  call?: OptionChainSideQuote | null;
  put?: OptionChainSideQuote | null;
};

export type OptionChainPreview = {
  expiration?: string | null;
  strikeCount?: number;
  underlyingPrice?: number | null;
  rows: OptionChainTableRow[];
};

export type CachedResearchSnippet = {
  sentiment?: string | null;
  short?: string | null;
  long?: string | null;
  investmentThesis?: string | null;
  keyStrengths: string[];
  keyRisks: string[];
  whatToWatch: string[];
  valuationContext?: string | null;
};

export type PatternTrendForecast = {
  asOfDate: string;
  horizonDays: number;
  labelScheme: string;
  prediction: number;
  upProb?: number | null;
  tradeSignal?: boolean | null;
  inTrainingUniverse: boolean;
  probabilities: Record<string, number>;
  indicators: Record<string, number>;
  modelTrainEndDate?: string | null;
};

export type SymbolIntelligence = {
  symbol: string;
  signals: IntelligenceSignal[];
  peerComparison?: PeerComparison | null;
  eventTimeline?: EventTimelineEntry[];
  optionsScorecard?: OptionsScorecard | null;
  optionChainPreview?: OptionChainPreview | null;
  rollSuggestions?: OptionRollSuggestion[];
  cachedResearch?: CachedResearchSnippet | null;
  patternForecast?: PatternTrendForecast | null;
  dataGaps?: string[];
  partial?: boolean;
  reauthRequired?: boolean;
  authorizationUrl?: string | null;
};

export type OptionRollSuggestion = {
  side: "call" | "put";
  currentStrike: number;
  currentExpiration: string;
  suggestedStrike: number;
  suggestedExpiration: string;
  currentDelta?: number | null;
  suggestedDelta?: number | null;
  estimatedCredit?: number | null;
  rationale: string;
  action: "roll" | "close" | "hold";
};

export type PositionWeightChange = {
  symbol: string;
  previousWeightPct: number;
  currentWeightPct: number;
  changePct: number;
};

export type PortfolioChanges = {
  fromDate?: string | null;
  toDate?: string | null;
  liquidationValueChange?: number | null;
  liquidationValueChangePct?: number | null;
  newSymbols: string[];
  removedSymbols: string[];
  weightChanges: PositionWeightChange[];
  summary?: string | null;
};

export type AttentionItem = {
  action: string;
  label: string;
  symbol?: string | null;
  reason: string;
  priority: number;
  source: "current" | "historical";
  firstSeenAt?: string | null;
  daysActive?: number | null;
  alertId?: string | null;
};

export type MorningBrief = {
  generatedAt: string;
  macroRegime?: string | null;
  digest?: PortfolioDigest | null;
  changes?: PortfolioChanges | null;
  signals: IntelligenceSignal[];
  topAlerts: ProactiveAlert[];
  attentionQueue: AttentionItem[];
  deliveryReady: boolean;
};
