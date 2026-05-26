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
