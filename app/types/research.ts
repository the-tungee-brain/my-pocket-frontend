export type AssetType =
  | "STOCK"
  | "ETF"
  | "MUTUAL_FUND"
  | "INDEX"
  | "CRYPTO"
  | "ADR"
  | "BOND"
  | "OPTION";

export type TradingBiasLabel = "Bullish" | "Neutral" | "Bearish";
export type TradingBiasConfidence = "High" | "Medium" | "Low";
export type TradingBiasAction =
  | "Watch"
  | "Avoid"
  | "Confirm breakout"
  | "Pullback setup"
  | "Risk-off";
export type TradingBiasAlignmentState = "aligned" | "mixed" | "against";
export type TradingBiasVolumeAlignment = "confirmed" | "neutral" | "warning";
export type TradingBiasCatalystAlignment =
  | "positive"
  | "neutral"
  | "negative"
  | "none";

export type TradingBiasLevels = {
  support: number | null;
  resistance: number | null;
  breakoutLevel: number | null;
  stopInvalidLevel: number | null;
};

export type TradingBiasAlignment = {
  marketRegime: TradingBiasAlignmentState;
  relativeStrength: TradingBiasAlignmentState;
  patternTrend: TradingBiasAlignmentState;
  volume: TradingBiasVolumeAlignment;
  catalyst: TradingBiasCatalystAlignment;
};

export type TradingBiasResponse = {
  symbol: string;
  bias: TradingBiasLabel;
  confidence: TradingBiasConfidence;
  horizon: "1-5 sessions";
  action: TradingBiasAction;
  bullishFactors: string[];
  bearishFactors: string[];
  invalidation: string | null;
  levels: TradingBiasLevels;
  alignment: TradingBiasAlignment;
  dataGaps: string[];
};

export type IntradayTradingBiasSetupType =
  | "GapAndGo"
  | "OpeningRangeBreakout"
  | "VWAPReclaim"
  | "GapFade"
  | "TrendDay"
  | "RangeDay"
  | "FailedBreakout"
  | "None";

export type IntradayTradingBiasAction =
  | "Watch"
  | "Avoid"
  | "ConfirmBreakout"
  | "WaitForPullback"
  | "RiskOff";

export type IntradayTradingBiasVwapState =
  | "above"
  | "below"
  | "reclaiming"
  | "rejecting";

export type IntradayTradingBiasVolumeState =
  | "confirmed"
  | "neutral"
  | "weak";

export type IntradayTradingBiasCatalystState =
  | "positive"
  | "neutral"
  | "negative"
  | "none";

export type IntradayTradingBiasLevels = {
  premarketHigh: number | null;
  premarketLow: number | null;
  openRangeHigh: number | null;
  openRangeLow: number | null;
  vwap: number | null;
  support: number | null;
  resistance: number | null;
  invalidation: number | null;
};

export type IntradayTradingBiasAlignment = {
  market: TradingBiasAlignmentState;
  intradayTrend: TradingBiasAlignmentState;
  vwap: IntradayTradingBiasVwapState;
  volume: IntradayTradingBiasVolumeState;
  catalyst: IntradayTradingBiasCatalystState;
};

export type IntradayTradingBiasResponse = {
  bias: TradingBiasLabel;
  confidence: TradingBiasConfidence;
  horizon: "Intraday";
  setupType: IntradayTradingBiasSetupType;
  action: IntradayTradingBiasAction;
  levels: IntradayTradingBiasLevels;
  alignment: IntradayTradingBiasAlignment;
  reasons: string[];
  warnings: string[];
  dataGaps: string[];
  lastUpdated: string | null;
  stalenessSeconds: number | null;
  provider: "yfinance";
  isRealtime: false;
};

export type TraderPlaybookBestSetup =
  | "BreakoutContinuation"
  | "PullbackToSupport"
  | "FailedBreakout"
  | "RangeDay"
  | "TrendContinuation"
  | "None";

export type TraderPlaybookStatus =
  | "Valid"
  | "Waiting"
  | "Invalid"
  | "NoSetup";
export type TraderPlaybookSide = "Long" | "Short" | "NoTrade";

export type TraderPlaybookRiskRewardLabel =
  | "favorable"
  | "mixed"
  | "poor"
  | "unavailable";

export type TraderPlaybookExecutionReadiness = "ready" | "watch" | "avoid";
export type TraderPlaybookAlignmentWithUnavailable =
  | TradingBiasAlignmentState
  | "unavailable";

export type TraderPlaybookConditions = {
  validIf: string[];
  invalidIf: string[];
};

export type TraderPlaybookLevels = {
  entry: number | null;
  stop: number | null;
  target1: number | null;
  target2: number | null;
  support: number | null;
  resistance: number | null;
  breakoutLevel: number | null;
};

export type TraderPlaybookRisk = {
  riskPerShare: number | null;
  rewardToTarget1: number | null;
  rewardToTarget2: number | null;
  rMultipleTarget1: number | null;
  rMultipleTarget2: number | null;
  riskRewardLabel: TraderPlaybookRiskRewardLabel;
};

export type TraderPlaybookAlignment = {
  dailyBias: TradingBiasAlignmentState;
  executionReadiness: TraderPlaybookExecutionReadiness;
  marketRegime: TraderPlaybookAlignmentWithUnavailable;
  relativeStrength: TraderPlaybookAlignmentWithUnavailable;
  priceStructure: TraderPlaybookAlignmentWithUnavailable;
  catalyst: TradingBiasCatalystAlignment;
};

export type TraderPlaybookResponse = {
  direction: TradingBiasLabel;
  confidence: TradingBiasConfidence;
  horizon: "1-5 sessions";
  dataMode: "daily";
  bestSetup: TraderPlaybookBestSetup;
  side?: TraderPlaybookSide;
  status: TraderPlaybookStatus;
  conditions: TraderPlaybookConditions;
  levels: TraderPlaybookLevels;
  risk: TraderPlaybookRisk;
  alignment: TraderPlaybookAlignment;
  reasons: string[];
  warnings: string[];
  dataGaps: string[];
};

export type EtfHoldingItem = {
  ticker?: string | null;
  name: string;
  weight_pct: number;
  sector?: string | null;
  market_cap?: string | null;
  piotroskiF?: number | null;
  altmanZ?: number | null;
  qualityScore?: number | null;
};

export type EtfHoldingsContext = {
  ticker: string;
  total_holdings: number;
  aum?: string | null;
  sector_breakdown: Record<string, number>;
  holdings: EtfHoldingItem[];
  strongestHoldings?: EtfHoldingItem[];
  weakestHoldings?: EtfHoldingItem[];
  dividend_yield?: string | null;
  expense_ratio?: string | null;
  dataAsOf?: string | null;
  confidenceScore?: number | null;
};

export type DividendPaymentItem = {
  date: string;
  amountPerShare: number;
};

export type AnnualDividendIncome = {
  year: number;
  totalPerShare: number;
  incomeOnShares: number;
  isPartialYear?: boolean;
};

export type DividendAdvancedSnowballScenario = {
  enabled: boolean;
  initialShares: number;
  finalShares: number;
  sharePriceAtStart: number;
  sharePriceLatest: number;
  priceCagrPct: number;
  annualIncomeLatestDrip: number;
  portfolioValueLatest: number;
  totalDividendsReinvested: number;
  totalAnnualContributionsUsd?: number;
  totalProjectedDividends?: number;
  usesHistoricalSharePrices?: boolean;
};

export type DividendBacktestYearRow = {
  year: number;
  dps: number;
  shares: number;
  dividendIncome: number;
  sharePrice: number;
  dividendYieldPct: number;
};

export type DividendHistoricalBacktest = {
  startYear: number;
  endYear: number;
  initialShares: number;
  cashCollected: number;
  cashCollectedAnnual: number;
  yearlyBreakdown: DividendBacktestYearRow[];
  drip?: DividendAdvancedSnowballScenario | null;
};

export type DividendSnowballScenario = {
  shares: number;
  startYear: number;
  totalCollected: number;
  annualIncomeLatest: number;
  annualIncomeStart: number;
  latestYear: number;
  projectYears: number;
  dividendCagrPct: number;
  investmentUsd?: number | null;
  sharePrice?: number | null;
  advanced?: DividendAdvancedSnowballScenario | null;
};

export const DIVIDEND_PROJECTION_YEAR_PRESETS = [5, 10, 15, 20, 25, 30] as const;

/** Historic replay windows — capped by typical dividend history depth. */
export const DIVIDEND_BACKTEST_YEAR_PRESETS = [5, 10, 15] as const;

export type DividendPositionParams = {
  investmentUsd?: number | null;
  sharePrice?: number | null;
  shares?: number | null;
  reinvestDividends?: boolean;
  priceCagrPct?: number | null;
  /** New cash added at the start of each year after the first. */
  annualContributionUsd?: number | null;
};

export type DividendSnowballParams = DividendPositionParams & {
  projectYears?: number | null;
  dividendCagrPct?: number | null;
};

export type DividendBacktestParams = DividendPositionParams & {
  /** First year for the historical dividend backtest window. */
  historyStartYear?: number | null;
};

/** @deprecated Use DividendSnowballParams or DividendBacktestParams */
export type DividendScenarioParams = DividendSnowballParams & DividendBacktestParams;

export type DividendHistoryContext = {
  ticker: string;
  totalDividends: number;
  totalSplits?: number;
  consecutiveAnnualIncreases: number;
  cagr5yPct?: number | null;
  cagr10yPct?: number | null;
  dividendYieldPct?: number | null;
  priceCagrPct?: number | null;
  annualIncome: AnnualDividendIncome[];
  recentPayments: DividendPaymentItem[];
  payments: DividendPaymentItem[];
  scenario?: DividendSnowballScenario | null;
  historicalBacktest?: DividendHistoricalBacktest | null;
  dataAsOf?: string | null;
  confidenceScore?: number | null;
};
