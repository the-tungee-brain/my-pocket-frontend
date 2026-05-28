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

export type AnalystRatingAction = {
  date: string;
  firm: string;
  toGrade: string;
  fromGrade?: string | null;
  action?: string | null;
};

export type InstitutionalHolder = {
  holder: string;
  pctHeld?: number | null;
  shares?: number | null;
  value?: number | null;
};

export type InsiderTransactionRow = {
  date: string;
  insider: string;
  transaction?: string | null;
  shares?: number | null;
  value?: number | null;
};

export type OwnershipSnapshot = {
  insidersPctHeld?: number | null;
  institutionsPctHeld?: number | null;
  topInstitutional?: InstitutionalHolder[];
  recentInsiderTransactions?: InsiderTransactionRow[];
};

export type StreetAnalysisSnapshot = {
  priceTargets?: AnalystPriceTargets | null;
  recommendation?: RecommendationBreakdown | null;
  consensusLabel?: string | null;
  nextQuarterEps?: PeriodEstimate | null;
  nextQuarterRevenue?: PeriodEstimate | null;
  epsEstimates?: PeriodEstimate[];
  revenueEstimates?: PeriodEstimate[];
  estimateRevisionHeadline?: string | null;
  estimateDriftHeadline?: string | null;
  growthContextHeadline?: string | null;
  recentRatingActions?: AnalystRatingAction[];
  ownership?: OwnershipSnapshot | null;
};

export const ESTIMATE_PERIOD_KEYS = ["0q", "+1q", "0y", "+1y"] as const;

export type EstimatePeriodKey = (typeof ESTIMATE_PERIOD_KEYS)[number];
