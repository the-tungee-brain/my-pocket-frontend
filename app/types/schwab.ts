import type {
  ProactiveAlert,
  PortfolioIntelligence,
} from "@/app/types/intelligence";

export type Instrument = {
  assetType: "EQUITY" | "OPTION";
  cusip: string;
  symbol: string;
  description?: string | null;
  netChange: number;
  type?: string | null;
  putCall?: "CALL" | "PUT" | null;
  underlyingSymbol?: string | null;
  strikePrice?: number | null;
  expirationDate?: string | null;
};

export type Position = {
  shortQuantity: number;
  averagePrice: number;
  currentDayProfitLoss: number;
  currentDayProfitLossPercentage: number;
  longQuantity: number;
  settledLongQuantity: number;
  settledShortQuantity: number;
  instrument: Instrument;
  marketValue: number;
  maintenanceRequirement: number;
  averageLongPrice?: number | null;
  taxLotAverageLongPrice?: number | null;
  longOpenProfitLoss?: number | null;
  previousSessionLongQuantity?: number | null;
  averageShortPrice?: number | null;
  taxLotAverageShortPrice?: number | null;
  shortOpenProfitLoss?: number | null;
  previousSessionShortQuantity?: number | null;
  currentDayCost: number;
  /** Detected by backend: covered_call, cash_secured_put, etc. */
  optionStrategy?: string | null;
  /** Computed by backend from Schwab position fields */
  costBasis?: number | null;
  openProfitLoss?: number | null;
  openProfitLossPct?: number | null;
  portfolioWeightPct?: number | null;
};

export type PortfolioMetrics = {
  totalOpenProfitLoss?: number | null;
  totalCostBasis?: number | null;
  openProfitLossPct?: number | null;
};

export type InitialBalances = {
  accruedInterest: number;
  availableFundsNonMarginableTrade: number;
  bondValue: number;
  buyingPower: number;
  cashBalance: number;
  cashAvailableForTrading: number;
  cashReceipts: number;
  dayTradingBuyingPower: number;
  dayTradingBuyingPowerCall: number;
  dayTradingEquityCall: number;
  equity: number;
  equityPercentage: number;
  liquidationValue: number;
  longMarginValue: number;
  longOptionMarketValue: number;
  longStockValue: number;
  maintenanceCall: number;
  maintenanceRequirement: number;
  margin: number;
  marginEquity: number;
  moneyMarketFund: number;
  mutualFundValue: number;
  regTCall: number;
  shortMarginValue: number;
  shortOptionMarketValue: number;
  shortStockValue: number;
  totalCash: number;
  isInCall: boolean;
  pendingDeposits: number;
  marginBalance: number;
  shortBalance: number;
  accountValue: number;
};

export type CurrentBalances = {
  accruedInterest: number;
  cashBalance: number;
  cashReceipts: number;
  longOptionMarketValue: number;
  liquidationValue: number;
  longMarketValue: number;
  moneyMarketFund: number;
  savings: number;
  shortMarketValue: number;
  pendingDeposits: number;
  mutualFundValue: number;
  bondValue: number;
  shortOptionMarketValue: number;
  availableFunds: number;
  availableFundsNonMarginableTrade: number;
  buyingPower: number;
  buyingPowerNonMarginableTrade: number;
  dayTradingBuyingPower: number;
  equity: number;
  equityPercentage: number;
  longMarginValue: number;
  maintenanceCall: number;
  maintenanceRequirement: number;
  marginBalance: number;
  regTCall: number;
  shortBalance: number;
  shortMarginValue: number;
  sma: number;
};

export type ProjectedBalances = {
  availableFunds: number;
  availableFundsNonMarginableTrade: number;
  buyingPower: number;
  dayTradingBuyingPower: number;
  dayTradingBuyingPowerCall: number;
  maintenanceCall: number;
  regTCall: number;
  isInCall: boolean;
  stockBuyingPower: number;
};

export type SecuritiesAccount = {
  type: "MARGIN";
  accountNumber: string;
  roundTrips: number;
  isDayTrader: boolean;
  isClosingOnlyRestricted: boolean;
  pfcbFlag: boolean;
  positions: Position[];
  initialBalances: InitialBalances;
  currentBalances: CurrentBalances;
  projectedBalances: ProjectedBalances;
};

export type AggregatedBalance = {
  currentLiquidationValue: number;
  liquidationValue: number;
};

export type SchwabAccounts = {
  securitiesAccount: SecuritiesAccount;
  aggregatedBalance: AggregatedBalance;
};

export type CashSecuredPutPositionSummary = {
  symbol: string;
  underlyingSymbol: string | null;
  contracts: number;
  strike: number | null;
  reservedCash: number;
};

export type CashSecuredPutSummary = {
  totalReservedCash: number;
  availableCashAfterReserves: number | null;
  positions: CashSecuredPutPositionSummary[];
};

export type AssignmentRiskLevel =
  | "critical"
  | "high"
  | "moderate"
  | "watch"
  | "low";

export type AssignmentRiskPositionEntry = {
  symbol: string;
  underlyingSymbol: string;
  strategy: string;
  putCall: string;
  contracts: number;
  strike: number | null;
  expiration: string;
  daysToExpiration: number;
  underlyingPrice?: number | null;
  moneyness: string;
  riskLevel: AssignmentRiskLevel | string;
  assignmentCashRequired?: number | null;
};

export type AssignmentRiskSummary = {
  asOf: string;
  withinDays: number;
  scopeSymbol?: string | null;
  positions: AssignmentRiskPositionEntry[];
};

export type RecentOrderLegEntry = {
  legId?: number | null;
  instruction: string;
  quantity?: number | null;
  assetType?: string | null;
  optionSymbol?: string | null;
  underlyingSymbol?: string | null;
  strike?: number | null;
  expiration?: string | null;
  putCall?: string | null;
  contractLabel?: string | null;
  averageFillPrice?: number | null;
  premiumPerContract?: number | null;
  totalCash?: number | null;
  positionEffect?: string | null;
};

export type RecentOrderEntry = {
  orderId?: number | null;
  symbol: string;
  fillTime?: string | null;
  side: string;
  quantity?: number | null;
  averageFillPrice?: number | null;
  premiumPerContract?: number | null;
  totalPremium?: number | null;
  totalCash?: number | null;
  orderType?: string | null;
  positionEffect?: string | null;
  taxLotMethod?: string | null;
  assetType?: string | null;
  description?: string | null;
  legCount?: number;
  strategyLabel?: string | null;
  contractLabel?: string | null;
  strike?: number | null;
  expiration?: string | null;
  putCall?: string | null;
  legs?: RecentOrderLegEntry[];
  activityGroupId?: string | null;
  activityGroupKind?: "roll" | "spread" | string | null;
  activityGroupLabel?: string | null;
};

export type SuggestedAnalysisAction = {
  action: string;
  label: string;
  reason: string;
  priority: number;
};

export type RecentActivitySymbolSummary = {
  symbol: string;
  orderCount: number;
  lastFillTime?: string | null;
};

export type RecentActivitySummary = {
  daysBack: number;
  totalOrders: number;
  recentOrderCount: number;
  symbolsTraded: RecentActivitySymbolSummary[];
  latestOrders: RecentOrderEntry[];
  suggestedActions: SuggestedAnalysisAction[];
};

export type RecentOrdersResponse = {
  daysBack: number;
  symbol?: string | null;
  orders: RecentOrderEntry[];
  totalOrders: number;
  recentOrderCount: number;
  limit: number;
  offset: number;
  suggestedActions: SuggestedAnalysisAction[];
  activityBySymbol: Record<string, number>;
};

export type PositionsDataFreshness = {
  positionsSyncedAt: string;
  positionsSource: "schwab";
  briefStatus: "ready" | "cached" | "pending";
};

export type AccountPositionsResponse = {
  schwab_positions: Record<string, Position[]>;
  account: SchwabAccounts;
  cashSecuredPutSummary?: CashSecuredPutSummary;
  assignmentRiskSummary?: AssignmentRiskSummary;
  recentActivity?: RecentActivitySummary | null;
  proactiveAlerts?: ProactiveAlert[];
  portfolioBrief?: PortfolioIntelligence | null;
  portfolioMetrics?: PortfolioMetrics | null;
  dataFreshness?: PositionsDataFreshness | null;
};
