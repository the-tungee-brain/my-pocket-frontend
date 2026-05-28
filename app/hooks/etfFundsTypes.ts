export type FundWeighting = {
  label: string;
  weightPct: number;
};

export type FundTopHolding = {
  symbol?: string | null;
  name: string;
  weightPct: number;
};

export type EtfFundsSnapshot = {
  category?: string | null;
  family?: string | null;
  legalType?: string | null;
  description?: string | null;
  expenseRatioPct?: number | null;
  categoryExpenseRatioPct?: number | null;
  holdingsTurnoverPct?: number | null;
  totalNetAssets?: number | null;
  assetClasses?: FundWeighting[];
  sectorWeightings?: FundWeighting[];
  bondRatings?: FundWeighting[];
  topHoldings?: FundTopHolding[];
  dataAsOf?: string | null;
};
