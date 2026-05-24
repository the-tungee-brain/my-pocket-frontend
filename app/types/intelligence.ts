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
};

export type PortfolioDigest = {
  sectorWeights: SectorWeight[];
  macroRegime?: string | null;
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

export type CachedResearchSnippet = {
  sentiment?: string | null;
  investmentThesis?: string | null;
  keyStrengths: string[];
  keyRisks: string[];
  whatToWatch: string[];
  valuationContext?: string | null;
};

export type SymbolIntelligence = {
  symbol: string;
  signals: IntelligenceSignal[];
  peerComparison?: PeerComparison | null;
  eventTimeline?: EventTimelineEntry[];
  optionsScorecard?: OptionsScorecard | null;
  cachedResearch?: CachedResearchSnippet | null;
  dataGaps?: string[];
  partial?: boolean;
};
