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
};

export type DividendSnowballScenario = {
  shares: number;
  startYear: number;
  totalCollected: number;
  annualIncomeLatest: number;
  annualIncomeStart: number;
  latestYear: number;
  investmentUsd?: number | null;
  sharePrice?: number | null;
  advanced?: DividendAdvancedSnowballScenario | null;
};

export type DividendScenarioParams = {
  investmentUsd?: number | null;
  sharePrice?: number | null;
  reinvestDividends?: boolean;
  priceCagrPct?: number | null;
};

export type DividendHistoryContext = {
  ticker: string;
  totalDividends: number;
  totalSplits?: number;
  consecutiveAnnualIncreases: number;
  cagr5yPct?: number | null;
  cagr10yPct?: number | null;
  annualIncome: AnnualDividendIncome[];
  recentPayments: DividendPaymentItem[];
  payments: DividendPaymentItem[];
  scenario: DividendSnowballScenario;
  dataAsOf?: string | null;
  confidenceScore?: number | null;
};
