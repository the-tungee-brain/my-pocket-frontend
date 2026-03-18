export type Instrument = {
  assetType: "EQUITY" | "OPTION";
  cusip: string;
  symbol: string;
  description?: string | null;
  netChange: number;
  type?: string | null;
  putCall?: "CALL" | "PUT" | null;
  underlyingSymbol?: string | null;
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
