import type { SectorWeight } from "@/app/types/intelligence";

export type PortfolioOptimizationRating =
  | "Excellent"
  | "Good"
  | "Fair"
  | "Weak"
  | "Poor";

export type PortfolioOptimizationStatus =
  | "strong"
  | "good"
  | "watch"
  | "poor"
  | "unavailable";

export type PortfolioStockWeight = {
  symbol: string;
  portfolioWeightPct: number;
  investedWeightPct?: number | null;
  weightPct: number;
  marketValue: number;
  level: "normal" | "elevated" | "high" | "critical";
};

export type PortfolioOptimizationBreakdownItem = {
  score?: number | null;
  maxScore: number;
  status: PortfolioOptimizationStatus;
  summary: string;
};

export type PortfolioOptimizationBreakdown = {
  stockConcentration: PortfolioOptimizationBreakdownItem;
  sectorConcentration: PortfolioOptimizationBreakdownItem;
  etfDiversification: PortfolioOptimizationBreakdownItem;
  cashAllocation: PortfolioOptimizationBreakdownItem;
  positionCount: PortfolioOptimizationBreakdownItem;
  correlation: PortfolioOptimizationBreakdownItem;
};

export type PortfolioOptimizationDriver = {
  category: string;
  title: string;
  detail: string;
  impactScore: number;
};

export type PortfolioOptimizationSuggestion = {
  rank: number;
  category: string;
  title: string;
  why: string;
  action: string;
  impactScore: number;
  estimatedScoreImprovement: number;
  symbols: string[];
};

export type PortfolioOptimizationResponse = {
  diversificationScore: number;
  rating: PortfolioOptimizationRating;
  stockWeights: PortfolioStockWeight[];
  sectorWeights: SectorWeight[];
  breakdown: PortfolioOptimizationBreakdown;
  topDrivers: PortfolioOptimizationDriver[];
  rankedSuggestions: PortfolioOptimizationSuggestion[];
  dataGaps: string[];
};
