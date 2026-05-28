export type WheelBacktestYears = 5 | 10 | 15;

export type WheelBacktestTrade = {
  date: string;
  action: string;
  putCall?: string | null;
  strike?: number | null;
  premiumUsd: number;
  feesUsd: number;
  close: number;
  note?: string | null;
};

export type WheelBacktestEquityPoint = {
  date: string;
  equityUsd: number;
  cashUsd: number;
  shares: number;
  phase: string;
};

export type WheelBacktestAnnualRow = {
  year: number;
  startEquityUsd: number;
  endEquityUsd: number;
  returnPct: number;
  premiumUsd: number;
  feesUsd: number;
};

export type WheelBacktestResult = {
  symbol: string;
  lookbackYears: number;
  startDate: string;
  endDate: string;
  tradingDays: number;
  config: Record<string, number>;
  assumptions: string[];
  startingCashUsd: number;
  endingEquityUsd: number;
  totalReturnPct: number;
  cagrPct: number | null;
  buyAndHoldReturnPct: number;
  buyAndHoldCagrPct: number | null;
  totalPremiumCollectedUsd: number;
  totalFeesUsd: number;
  totalDividendsUsd: number;
  putAssignments: number;
  putsExpiredOtm: number;
  callsAssigned: number;
  callsExpiredOtm: number;
  completedWheelCycles: number;
  skippedTradesInsufficientCash: number;
  trades: WheelBacktestTrade[];
  equityCurve: WheelBacktestEquityPoint[];
  annualSummary: WheelBacktestAnnualRow[];
};
