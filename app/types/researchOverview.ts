import type { AssetType } from "@/app/types/research";
import type { SymbolIntelligence } from "@/app/types/intelligence";
export type StockSummarySentiment = "Bullish" | "Neutral" | "Bearish";

export type StockSummary = {
  short: string;
  long: string;
  sentiment: StockSummarySentiment;
  investmentThesis: string;
  keyStrengths: string[];
  keyRisks: string[];
  whatToWatch: string[];
  valuationContext: string;
};

import type { ResearchSnapshot } from "@/lib/researchSnapshot";
import type { PerformanceSnapshot } from "@/app/hooks/usePerformance";
import type { StreetAnalysisSnapshot } from "@/app/hooks/streetAnalysisTypes";
import type { EtfFundsSnapshot } from "@/app/hooks/etfFundsTypes";
import type { EtfHoldingsContext } from "@/app/types/research";

export type ResearchOverviewBundle = {
  symbol: string;
  assetType: AssetType | null;
  asOf: string;
  snapshot: ResearchSnapshot;
  performance: PerformanceSnapshot;
  intelligence: SymbolIntelligence;
  streetAnalysis?: StreetAnalysisSnapshot | null;
  etfFunds?: EtfFundsSnapshot | null;
  etfHoldings?: EtfHoldingsContext | null;
  summary?: StockSummary | null;
};
