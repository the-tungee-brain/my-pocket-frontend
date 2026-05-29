import type { PositionsContextValue } from "@/app/contexts/positionsContextTypes";

export type PortfolioContextValue = Pick<
  PositionsContextValue,
  | "sessionAccessToken"
  | "loading"
  | "error"
  | "positionMap"
  | "symbols"
  | "allPositions"
  | "selectedSymbol"
  | "setSelectedSymbol"
  | "selectedView"
  | "setSelectedView"
  | "positionsForSelectedSymbol"
  | "account"
  | "cashSecuredPutSummary"
  | "assignmentRiskSummary"
  | "recentActivity"
  | "proactiveAlerts"
  | "portfolioBrief"
  | "portfolioMetrics"
  | "positionsDataFreshness"
  | "positionsLastSyncedAt"
  | "refreshPositions"
  | "clearPortfolioData"
  | "schwabReauth"
  | "clearSchwabReauth"
>;
