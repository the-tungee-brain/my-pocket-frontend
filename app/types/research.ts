export type AssetType =
  | "STOCK"
  | "ETF"
  | "MUTUAL_FUND"
  | "INDEX"
  | "CRYPTO"
  | "ADR"
  | "BOND"
  | "OPTION";

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
};

export type DividendHistoricalBacktest = {
  startYear: number;
  endYear: number;
  cashCollected: number;
  cashCollectedAnnual: number;
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

export type DividendScenarioParams = {
  investmentUsd?: number | null;
  sharePrice?: number | null;
  shares?: number | null;
  projectYears?: number | null;
  dividendCagrPct?: number | null;
  reinvestDividends?: boolean;
  priceCagrPct?: number | null;
  /** New cash added at the start of each year after the first (projection). */
  annualContributionUsd?: number | null;
};

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
