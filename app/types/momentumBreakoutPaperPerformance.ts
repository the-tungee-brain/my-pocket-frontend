/** Live paper-trading performance (not historical backtest). */

export type PaperTradePerformanceMeta = {
  label: string;
  disclaimer: string;
  source: string;
};

export type PaperTradeSummary = {
  totalAlerts: number;
  triggeredAlerts: number;
  expiredAlerts: number;
  winRate: number | null;
  averageWin: number | null;
  averageLoss: number | null;
  expectancy: number | null;
  profitFactor: number | null;
  averageHoldingDays: number | null;
  maxDrawdown: number | null;
  currentOpenTrades: number;
};

export type PaperTradeBucket = {
  key: string;
  tradeCount: number;
  winRate: number | null;
  expectancy: number | null;
  profitFactor: number | null;
  averageReturnPct: number | null;
};

export type PaperTradeRecord = {
  alertId: string;
  symbol: string;
  setupName: string;
  signalDate: string;
  entryTriggeredAt: string | null;
  entryPrice: number;
  stopPrice: number;
  targetPrice: number;
  exitAt: string | null;
  exitPrice: number | null;
  status: string;
  outcomeReturnPct: number | null;
  holdingDays: number | null;
  riskGateAction: string;
  marketRegime: string | null;
  volumeRatio: number | null;
  rsPercentile: number | null;
  createdAt: string;
};

export type PaperTradePerformanceSummaryResponse = {
  meta: PaperTradePerformanceMeta;
  summary: PaperTradeSummary;
  byRiskGate: PaperTradeBucket[];
};

export type PaperTradePerformanceTradesResponse = {
  meta: PaperTradePerformanceMeta;
  trades: PaperTradeRecord[];
};

export type PaperTradePerformanceBucketsResponse = {
  meta: PaperTradePerformanceMeta;
  buckets: PaperTradeBucket[];
};
