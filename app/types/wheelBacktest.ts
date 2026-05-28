export type WheelBacktestYears = 5 | 10 | 15;

export type WheelBacktestTrade = {
  date: string;
  action: string;
  putCall?: string | null;
  strike?: number | null;
  premiumUsd: number;
  feesUsd: number;
  close: number;
  stockPrice?: number | null;
  effectiveEntryPrice?: number | null;
  effectiveExitPrice?: number | null;
  note?: string | null;
};

export type WheelBacktestCycle = {
  cycle: number;
  putStrike?: number | null;
  stockEntryDate?: string | null;
  stockEntryClose?: number | null;
  effectiveEntryPrice?: number | null;
  callStrike?: number | null;
  stockExitDate?: string | null;
  stockExitClose?: number | null;
  effectiveExitPrice?: number | null;
  stockRoundTripPlUsd?: number | null;
  completed?: boolean;
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
  plUsd: number;
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
  totalPlUsd: number;
  totalReturnPct: number;
  cagrPct: number | null;
  buyAndHoldReturnPct: number;
  buyAndHoldCagrPct: number | null;
  buyAndHoldEndingUsd: number;
  capitalTopUpsUsd: number;
  spotPriceAtStart: number;
  spotPriceAtEnd: number;
  wheelCycles: WheelBacktestCycle[];
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
