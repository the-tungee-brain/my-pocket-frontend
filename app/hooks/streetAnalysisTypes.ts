export type AnalystPriceTargets = {
  current?: number | null;
  low?: number | null;
  high?: number | null;
  mean?: number | null;
  median?: number | null;
  upsideToMeanPct?: number | null;
};

export type RecommendationBreakdown = {
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
};

export type PeriodEstimate = {
  periodKey: string;
  label: string;
  analystCount?: number | null;
  avg?: number | null;
  low?: number | null;
  high?: number | null;
  growthPct?: number | null;
};

export type StreetAnalysisSnapshot = {
  priceTargets?: AnalystPriceTargets | null;
  recommendation?: RecommendationBreakdown | null;
  consensusLabel?: string | null;
  nextQuarterEps?: PeriodEstimate | null;
  nextQuarterRevenue?: PeriodEstimate | null;
  estimateRevisionHeadline?: string | null;
};
