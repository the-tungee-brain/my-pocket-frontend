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

export type PatternPortfolioStrategy = {
  strategyType: string;
  universe: string;
  topN: number;
  rebalanceDays: number;
  holdDays: number;
  maxPositionWeight: number;
};

export type PatternTrendForecast = {
  asOfDate: string;
  horizonDays: number;
  labelScheme: string;
  prediction: number;
  upProb?: number | null;
  rankingScore?: number | null;
  tradeSignal?: boolean | null;
  inTrainingUniverse: boolean;
  probabilities: Record<string, number>;
  indicators: Record<string, number>;
  modelTrainEndDate?: string | null;
  modelKey?: string | null;
  modelLabel?: string | null;
  trainingUniverse?: string | null;
  nFeatures?: number | null;
  featureGroups?: string[];
  portfolioStrategy?: PatternPortfolioStrategy | null;
  isBenchmark?: boolean;
  benchmarkNotice?: string | null;
};

export type PrimaryCandlestickPattern = {
  patternId: string;
  label: string;
  direction: string;
  strength: number;
  asOfDate: string;
  barIndex?: number | null;
};

export type ChartIntelligenceScoreRow = {
  name: string;
  bias: "bullish" | "neutral" | "bearish" | string;
  detail: string;
};

export type ChartIntelligenceScorecard = {
  rows: ChartIntelligenceScoreRow[];
  thesis: {
    headline: string;
    action: string;
    detail: string;
  };
  priorityOrder?: string[];
};

export type ChartIntelligenceNarrative = {
  summary: string;
  action: string;
  headline: string;
  disclaimer: string;
};

export type ChartIntelligenceZone = {
  priceLow: number;
  priceHigh: number;
  label?: string;
  zoneType?: string;
  touches?: number;
  strength?: number;
};

export type ChartIntelligenceTrendline = {
  label?: string;
  style?: string;
  ratio?: number;
  startDate?: string;
  endDate?: string;
  startPrice?: number;
  endPrice?: number;
  points?: { date: string; price: number }[];
};

export type ChartIntelligenceBreakoutEvent = {
  kind: string;
  barIndex?: number;
  date?: string;
  price?: number;
  zoneLabel?: string;
  label?: string;
  volumeRatio?: number | null;
};

export type ChartIntelligenceFibChannel = {
  bias?: string;
  summary?: string;
  lines?: ChartIntelligenceTrendline[];
};

export type ChartIntelligenceAnnotation = {
  type?: string;
  breakoutKind?: string;
  barIndex?: number;
  date?: string;
  price?: number;
  label?: string;
  direction?: string;
  position?: string;
  swingType?: string;
};

export type ChartIntelligencePatternMetadata = {
  patternId: string;
  label: string;
  direction: string;
  confidence: number;
  qualityScore: number;
  candleIndexes?: number[];
  startDate?: string;
  endDate?: string;
  qualificationChecks?: { label: string; passed: boolean }[];
  explanation?: string;
};

export type ChartIntelligence = {
  trendlines: ChartIntelligenceTrendline[];
  supportZones: ChartIntelligenceZone[];
  resistanceZones: ChartIntelligenceZone[];
  annotations: ChartIntelligenceAnnotation[];
  highlightedCandles: { barIndex?: number; date?: string; patternId?: string }[];
  breakoutEvents?: ChartIntelligenceBreakoutEvent[];
  fibChannel?: ChartIntelligenceFibChannel | null;
  patternMetadata: ChartIntelligencePatternMetadata[];
  structure: Record<string, unknown>;
  movingAverages: Record<string, unknown>;
  volume: Record<string, unknown>;
  supportResistanceSummary?: string;
  relativeStrength: Record<string, unknown>;
  narrative: ChartIntelligenceNarrative;
  scorecard: ChartIntelligenceScorecard;
};

export type PatternTrendContextIntel = {
  asOfDate: string;
  close: number;
  sma50?: number | null;
  sma200?: number | null;
  aboveSma50?: boolean | null;
  aboveSma200?: boolean | null;
  trendBias: string;
  rsVsSpy21d?: number | null;
  rsVsSpy63d?: number | null;
  rsVsSpy126d?: number | null;
  volRatio20d?: number | null;
  volZscore20d?: number | null;
};

export type PatternIntelligenceScores = {
  patternStrength: number;
  trendStrength: number;
  relativeStrength: number;
  volumeConfirmation: number;
  modelAlignment: number;
  confirmationScore: number;
  confidence: string;
  alignmentState: "confirmed" | "conflict" | "model_only" | string;
};

export type PatternHistoricalStats = {
  patternId: string;
  label: string;
  occurrenceCount: number;
  avgReturn5d?: number | null;
  avgReturn20d?: number | null;
  winRate5d?: number | null;
  winRate20d?: number | null;
  maxDrawdown20d?: number | null;
};

export type PatternSetupOutcome = {
  label: string;
  patternLabel: string;
  trendLabel: string;
  rsLabel: string;
  occurrenceCount: number;
  patternOnlyCount: number;
  avgReturn5d?: number | null;
  avgReturn20d?: number | null;
  winRate5d?: number | null;
  winRate20d?: number | null;
  maxDrawdown20d?: number | null;
};

export type PatternExplanation = {
  headline: string;
  patternSummary: string;
  trendContext: string;
  historicalContext: string;
  modelContext: string;
  confidenceExplanation: string;
  disclaimer: string;
};

export type PatternSignalSummary = {
  modelC: string;
  trend: string;
  relativeStrength: string;
  pattern?: string | null;
  patternWarning?: boolean;
};

export type PatternSignalState = {
  label: string;
  probability?: number | null;
  probabilityText: string;
  tone: string;
  isBenchmark?: boolean;
  benchmarkNotice?: string | null;
};

export type PatternTimeframeSlice = {
  label: string;
  caption: string;
};

export type PatternTimeframeInterpretation = {
  shortTerm: PatternTimeframeSlice;
  longTermTrend: PatternTimeframeSlice;
  relativeStrength: PatternTimeframeSlice;
};

export type PatternAlignmentBlock = {
  state: string;
  headline: string;
  explanation: string;
};

export type PatternEvidence = {
  framing?: string | null;
  statsNote?: string | null;
  insight: string;
  conditionalNote?: string | null;
  summary: string;
  setupLabel?: string | null;
  occurrenceCount?: number | null;
  winRate5d?: number | null;
  avgReturn5d?: number | null;
  avgReturn20d?: number | null;
};

export type PatternInterpretation = {
  signalState?: PatternSignalState | null;
  timeframe?: PatternTimeframeInterpretation | null;
  alignment?: PatternAlignmentBlock | null;
  signalSummary: PatternSignalSummary;
  verdict: string;
  evidence: PatternEvidence;
};

export type PatternIntelligence = {
  symbol: string;
  asOfDate: string;
  primaryPattern?: PrimaryCandlestickPattern | null;
  activePatterns: PrimaryCandlestickPattern[];
  trendContext: PatternTrendContextIntel;
  scores: PatternIntelligenceScores;
  historicalStats?: PatternHistoricalStats | null;
  setupOutcome?: PatternSetupOutcome | null;
  coreModel?: Record<string, unknown> | null;
  explanation: PatternExplanation;
  interpretation?: PatternInterpretation | null;
  chartIntelligence?: ChartIntelligence | null;
  isBenchmark?: boolean;
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
  patternIntelligence?: PatternIntelligence | null;
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
