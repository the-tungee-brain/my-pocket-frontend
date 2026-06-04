/** Operational launch readiness (not performance marketing). */

export type LaunchReadinessHealthCheck = {
  name: string;
  ok: boolean;
  detail: string;
};

export type LaunchReadinessResponse = {
  disclaimer: string;
  adminDiagnostics: boolean;
  ready: boolean;
  alertStoreType: string;
  paperTradeStoreType: string;
  schedulerEnabled: boolean;
  refreshIntervalSec: number;
  rawRefreshIntervalSec: number;
  oracleAlertDdlRequired: boolean;
  oracleAlertDdlApplied: boolean | null;
  oraclePaperDdlRequired: boolean;
  oraclePaperDdlApplied: boolean | null;
  ddlDetailAlert: string;
  ddlDetailPaper: string;
  activeAlertsCount: number;
  paperTradeRowsCount: number;
  totalAlertsCount: number;
  alertsMissingPaperRows: number;
  latestLifecycleUpdateAt: string | null;
  latestPaperTradeUpdateAt: string | null;
  quoteProviderAvailable: boolean;
  healthChecks: LaunchReadinessHealthCheck[];
  warnings: string[];
};
