export type SetupStageId =
  | "BASE_BUILDING"
  | "TIGHTENING"
  | "BREAKOUT_WATCH"
  | "BREAKOUT_TRIGGERED"
  | "EXTENDED";

export type EmergingLeaderItem = {
  rank: number;
  symbol: string;
  setupQualityScore: number;
  setupStage: SetupStageId;
  setupStageLabel: string;
  compressionVelocity: number;
  compressionVelocityLabel: string;
  whyItRanks: string;
  positiveFactors: string[];
  missingFactors: string[];
  nextConfirmation: string[];
};

export type EmergingLeadersResponse = {
  asOfDate?: string | null;
  timestamp: string;
  universeScanned: number;
  symbolsWithData: number;
  evaluationsComputed: number;
  excludedTopMovers: number;
  items: EmergingLeaderItem[];
};
