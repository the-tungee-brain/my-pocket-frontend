export type OptionLegOutcome = {
  putCall?: "CALL" | "PUT";
  side?: "call" | "put";
  strike: number;
  expiration: string;
  contracts?: number;
  daysToExpiration?: number;
  delta?: number | null;
  bid?: number | null;
  ask?: number | null;
  mark?: number | null;
  cashPerContract?: number | null;
  cashDirection?: "pay" | "collect" | null;
};

export type RollCashPicture = {
  entryPremiumPerContract?: number | null;
  closeCostPerContract?: number | null;
  openCollectPerContract?: number | null;
  rollNetPerContract?: number | null;
  netCashAfterRollPerContract?: number | null;
  lossOnClosedPutPerContract?: number | null;
  summary?: string | null;
};

export type RollPathOutcome = {
  closeLeg: OptionLegOutcome;
  openLeg: OptionLegOutcome;
  netCreditPerShare?: number | null;
  netCreditPerContract?: number | null;
  isNetCredit: boolean;
  cashPicture?: RollCashPicture | null;
};

export type ClosePathOutcome = {
  costPerShare?: number | null;
  costPerContract?: number | null;
  openPnl?: number | null;
};

export type HoldPathOutcome = {
  daysToExpiration?: number | null;
  delta?: number | null;
  underlyingPrice?: number | null;
  inTheMoney?: boolean | null;
  assignmentNote?: string | null;
};

export type HeldOptionDecisionDrivers = {
  portfolioWeightPct?: number | null;
  openPnl?: number | null;
  openPnlPct?: number | null;
  entryPremiumPerShare?: number | null;
  entryPremiumPerContract?: number | null;
  actionTrigger?: string | null;
};

export type ComparePathOption = {
  path: "roll" | "close" | "hold";
  title: string;
  lines: string[];
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
  action?: "roll" | "close" | "hold";
};

export type HeldOptionOutcomes = {
  drivers: HeldOptionDecisionDrivers;
  currentLeg: OptionLegOutcome;
  roll?: RollPathOutcome | null;
  rollCashPicture?: RollCashPicture | null;
  close: ClosePathOutcome;
  hold: HoldPathOutcome;
  comparePaths: ComparePathOption[];
};

export type SymbolAnalysisPrecomputed = {
  symbol: string;
  underlyingPrice?: number | null;
  optionsScorecard?: unknown | null;
  rollSuggestions?: OptionRollSuggestion[];
  heldOptionOutcomes: HeldOptionOutcomes[];
};

export type SymbolAnalysisV1Envelope = {
  analysis: {
    summary: string;
    recommendedAction: {
      title: string;
      reason: string;
      symbol: string;
    };
    sections: Array<{
      id?: string;
      title: string;
      body?: string;
      bullets?: string[];
    }>;
  };
  precomputed: SymbolAnalysisPrecomputed | null;
};
