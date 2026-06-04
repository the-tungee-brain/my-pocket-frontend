export type CustomTradePlanResponse = {
  symbol: string;
  setupName: string;
  direction: "LONG";
  entryPrice: number;
  entryMethod: string;
  currentPrice: number;
  distanceToEntryPct: number;
  entryExplanation: string;
  latestBarDate: string;
  planActiveAtCurrentPrice: boolean;
  stopPrice: number;
  targetPrice: number;
  riskReward: number;
  warnings: string[];
  educationalOnly: boolean;
};
