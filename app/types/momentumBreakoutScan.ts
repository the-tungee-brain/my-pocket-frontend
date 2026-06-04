/** Momentum Breakout scanner API (camelCase JSON). */

import type { AlertRiskGateAction } from "@/app/types/momentumBreakoutAlerts";

export type ScanRiskGateDto = {
  allowed: boolean;
  action: AlertRiskGateAction | string;
  reasons: string[];
  recommendedPositionRiskPct: number;
  maxNotionalUsd: number | null;
  alertPriority: string;
  educationalOnly?: boolean;
};

export type MomentumBreakoutScanCandidateDto = {
  symbol: string;
  entryPrice: number;
  stopPrice: number;
  targetPrice: number;
  riskReward: number;
  historicalWinRate: number | null;
  historicalProfitFactor: number | null;
  historicalTotalTrades: number | null;
  setupScore: number;
  stopDistancePct: number;
  volumeRatio: number | null;
  rsPercentile: number | null;
  marketRegime: string | null;
  riskGate: ScanRiskGateDto;
};

export type MomentumBreakoutScanResponse = {
  scanTime: string;
  totalSymbolsScanned: number;
  validSetupsFound: number;
  tradableCandidatesFound: number;
  blockedCandidatesCount: number;
  candidatesFound: number;
  candidates: MomentumBreakoutScanCandidateDto[];
};

export type MomentumBreakoutScanOptions = {
  symbols?: string;
  limit?: number;
  tradableOnly?: boolean;
  minHistoricalProfitFactor?: number;
  minHistoricalTrades?: number;
  maxStopDistancePct?: number;
};
