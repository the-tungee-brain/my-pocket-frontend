export type CashMapStep = {
  step: number;
  label: string;
  amount?: number | null;
  isSubtraction?: boolean;
};

export type PortfolioCashMap = {
  steps: CashMapStep[];
  deployableCash: number;
  trimProceeds?: number | null;
  totalToRedeploy: number;
  minCashBufferPct?: number;
};

export type PortfolioConcentrationMetrics = {
  liquidationValue: number;
  cash: number;
  cashPct: number;
  cspReserved: number;
  cashAfterCsp: number;
  minCashBuffer: number;
  deployableCash: number;
  distinctSymbols: number;
  effectiveNames: number;
  top1Pct: number;
  top3Pct: number;
  top5Pct: number;
  singleNameLimitPct: number;
};

export type HoldingAllocationReview = {
  symbol: string;
  weightPct: number;
  marketValue: number;
  status: string;
  actionSummary: string;
};

export type TrimPlanItem = {
  symbol: string;
  currentWeightPct: number;
  targetWeightPct: number;
  trimDollars: number;
};

export type DeployPlanItem = {
  symbol: string;
  deployDollars: number;
  note?: string | null;
};

export type PortfolioAnalysisPrecomputed = {
  concentration: PortfolioConcentrationMetrics;
  cashMap: PortfolioCashMap;
  holdings: HoldingAllocationReview[];
  trimPlan: TrimPlanItem[];
  deployPlan: DeployPlanItem[];
  totalTrimProceeds: number;
};
