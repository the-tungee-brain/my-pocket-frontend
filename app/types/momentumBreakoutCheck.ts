import type { ScanRiskGateDto } from "@/app/types/momentumBreakoutScan";

export type MomentumBreakoutCheckStatus =
  | "TRADABLE_BREAKOUT"
  | "REJECTED_BREAKOUT"
  | "NO_BREAKOUT_SETUP"
  | "DATA_UNAVAILABLE";

export type MomentumBreakoutCheckResponse = {
  symbol: string;
  status: MomentumBreakoutCheckStatus;
  verdictTitle: string;
  verdictMessage: string;
  failedSetupRules: string[];
  rejectionReasons: string[];
  entryPrice: number | null;
  stopPrice: number | null;
  targetPrice: number | null;
  stopDistancePct: number | null;
  historicalWinRate: number | null;
  historicalProfitFactor: number | null;
  historicalTotalTrades: number | null;
  riskGate: ScanRiskGateDto | null;
  canTrackBreakoutPlan: boolean;
};
