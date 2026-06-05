import type { MomentumBreakoutAlertDto } from "@/app/types/momentumBreakoutAlerts";
import type { MomentumBreakoutCheckResponse } from "@/app/types/momentumBreakoutCheck";
import type { MomentumBreakoutScanResponse } from "@/app/types/momentumBreakoutScan";
import type { MomentumBreakoutFeatureFlags } from "@/app/types/momentumBreakoutFeatureFlags";

export type MomentumBreakoutFixtureMode =
  | "active"
  | "manual-qualifies"
  | "manual-no-qualify"
  | "empty"
  | "loading"
  | "error";

export type MomentumBreakoutDevFixture = {
  mode: MomentumBreakoutFixtureMode;
  accessToken: string;
  flags: MomentumBreakoutFeatureFlags;
  activeAlerts: MomentumBreakoutAlertDto[];
  historyAlerts: MomentumBreakoutAlertDto[];
  disclaimer: string;
  lastUpdated: number | null;
  refreshWarnings: string[];
  alertsLoading: boolean;
  alertsError: string | null;
  scan: MomentumBreakoutScanResponse | null;
  scanLoading: boolean;
  scanError: string | null;
  manualResult: MomentumBreakoutCheckResponse | null;
  manualError: string | null;
};

const DEV_ACCESS_TOKEN = "dev-momentum-breakout-fixture";

const flags: MomentumBreakoutFeatureFlags = {
  alertsEnabled: true,
  alertCreationEnabled: true,
  alertNotificationsEnabled: true,
  paperAnalyticsEnabled: true,
};

const disclaimer =
  "Educational trade-plan monitoring only. Not investment advice or brokerage execution.";

function alert(
  overrides: Partial<MomentumBreakoutAlertDto> &
    Pick<MomentumBreakoutAlertDto, "alertId" | "symbol" | "status">,
): MomentumBreakoutAlertDto {
  const now = "2026-06-05T14:30:00.000Z";
  const { alertId, symbol, status, ...rest } = overrides;
  return {
    alertId,
    symbol,
    setupName: "momentum_breakout",
    direction: "long",
    status,
    createdAt: now,
    signalDate: "2026-06-05",
    entryPrice: 128.4,
    stopPrice: 121.9,
    targetPrice: 143.2,
    riskReward: 2.28,
    entryIsStop: false,
    expiresAt: "2026-06-20T20:00:00.000Z",
    triggeredAt: null,
    exitAt: null,
    exitPrice: null,
    outcomeReturnPct: null,
    riskGateAction: "ALLOW",
    riskGateReasons: [],
    priority: "normal",
    historicalWinRate: 0.58,
    historicalProfitFactor: 1.74,
    historicalTotalTrades: 62,
    nextActionMessage:
      "Wait for entry to trigger. If it gaps below the setup, leave it alone.",
    lifecycleEvents: [],
    ...rest,
  };
}

const activeAlerts: MomentumBreakoutAlertDto[] = [
  alert({
    alertId: "dev-alert-nvda",
    symbol: "NVDA",
    status: "PENDING_ENTRY",
    entryPrice: 128.4,
    stopPrice: 121.9,
    targetPrice: 143.2,
    riskReward: 2.28,
    priority: "high",
    nextActionMessage:
      "Entry has not triggered. Watch for a clean move through 128.40 with volume support.",
  }),
  alert({
    alertId: "dev-alert-crwd",
    symbol: "CRWD",
    status: "OPEN",
    entryPrice: 392.5,
    stopPrice: 374.1,
    targetPrice: 431.8,
    riskReward: 2.14,
    triggeredAt: "2026-06-05T15:10:00.000Z",
    nextActionMessage:
      "Plan is open. Keep the stop at 374.10 unless the alert lifecycle changes.",
  }),
  alert({
    alertId: "dev-alert-elf",
    symbol: "ELF",
    status: "ENTRY_TRIGGERED",
    entryPrice: 94.25,
    stopPrice: 89.6,
    targetPrice: 104.8,
    riskReward: 2.27,
    historicalWinRate: 0.52,
    historicalProfitFactor: 1.36,
    historicalTotalTrades: 37,
    riskGateAction: "WARN",
    riskGateReasons: ["Consumer momentum exposure is elevated."],
    nextActionMessage:
      "Entry triggered today. Confirm position size stays within your plan risk.",
  }),
];

const historyAlerts: MomentumBreakoutAlertDto[] = [
  alert({
    alertId: "dev-alert-avgo",
    symbol: "AVGO",
    status: "TARGET_HIT",
    entryPrice: 174.8,
    stopPrice: 166.2,
    targetPrice: 191.4,
    exitAt: "2026-06-03T19:40:00.000Z",
    exitPrice: 191.4,
    outcomeReturnPct: 0.095,
    nextActionMessage: "Target reached. Plan is complete.",
  }),
  alert({
    alertId: "dev-alert-shop",
    symbol: "SHOP",
    status: "STOP_HIT",
    entryPrice: 72.15,
    stopPrice: 68.4,
    targetPrice: 80.2,
    exitAt: "2026-06-02T17:20:00.000Z",
    exitPrice: 68.4,
    outcomeReturnPct: -0.052,
    nextActionMessage: "Stop reached. Plan is complete.",
  }),
];

const scan: MomentumBreakoutScanResponse = {
  scanTime: "2026-06-05T16:00:00.000Z",
  totalSymbolsScanned: 482,
  validSetupsFound: 7,
  tradableCandidatesFound: 3,
  blockedCandidatesCount: 4,
  candidatesFound: 7,
  candidates: [
    {
      symbol: "NVDA",
      entryPrice: 128.4,
      stopPrice: 121.9,
      targetPrice: 143.2,
      riskReward: 2.28,
      historicalWinRate: 0.58,
      historicalProfitFactor: 1.74,
      historicalTotalTrades: 62,
      setupScore: 86,
      stopDistancePct: 5.1,
      volumeRatio: 1.7,
      rsPercentile: 91,
      marketRegime: "risk_on",
      riskGate: {
        allowed: true,
        action: "ALLOW",
        reasons: [],
        recommendedPositionRiskPct: 0.5,
        maxNotionalUsd: 4200,
        alertPriority: "high",
        educationalOnly: true,
      },
    },
    {
      symbol: "CRWD",
      entryPrice: 392.5,
      stopPrice: 374.1,
      targetPrice: 431.8,
      riskReward: 2.14,
      historicalWinRate: 0.55,
      historicalProfitFactor: 1.51,
      historicalTotalTrades: 44,
      setupScore: 81,
      stopDistancePct: 4.7,
      volumeRatio: 1.35,
      rsPercentile: 88,
      marketRegime: "risk_on",
      riskGate: {
        allowed: true,
        action: "ALLOW",
        reasons: [],
        recommendedPositionRiskPct: 0.45,
        maxNotionalUsd: 3600,
        alertPriority: "normal",
        educationalOnly: true,
      },
    },
    {
      symbol: "TSLA",
      entryPrice: 188.2,
      stopPrice: 172.8,
      targetPrice: 214.6,
      riskReward: 1.71,
      historicalWinRate: 0.47,
      historicalProfitFactor: 1.03,
      historicalTotalTrades: 28,
      setupScore: 68,
      stopDistancePct: 8.2,
      volumeRatio: 2.4,
      rsPercentile: 72,
      marketRegime: "mixed",
      riskGate: {
        allowed: false,
        action: "BLOCK",
        reasons: ["Stop distance exceeds risk threshold."],
        recommendedPositionRiskPct: 0,
        maxNotionalUsd: null,
        alertPriority: "blocked",
        educationalOnly: true,
      },
    },
    {
      symbol: "META",
      entryPrice: 642.1,
      stopPrice: 615.9,
      targetPrice: 698.4,
      riskReward: 2.15,
      historicalWinRate: 0.5,
      historicalProfitFactor: 1.1,
      historicalTotalTrades: 18,
      setupScore: 70,
      stopDistancePct: 4.1,
      volumeRatio: 1.1,
      rsPercentile: 79,
      marketRegime: "mixed",
      riskGate: {
        allowed: true,
        action: "WARN",
        reasons: ["Historical sample is below preferred threshold."],
        recommendedPositionRiskPct: 0.25,
        maxNotionalUsd: 2200,
        alertPriority: "watch",
        educationalOnly: true,
      },
    },
  ],
};

const emptyScan: MomentumBreakoutScanResponse = {
  scanTime: "2026-06-05T16:00:00.000Z",
  totalSymbolsScanned: 482,
  validSetupsFound: 0,
  tradableCandidatesFound: 0,
  blockedCandidatesCount: 0,
  candidatesFound: 0,
  candidates: [],
};

const manualQualifies: MomentumBreakoutCheckResponse = {
  symbol: "NVDA",
  status: "TRADABLE_BREAKOUT",
  verdictTitle: "Qualifies for a breakout plan",
  verdictMessage:
    "NVDA passes the current setup, historical quality, and risk checks.",
  failedSetupRules: [],
  rejectionReasons: [],
  entryPrice: 128.4,
  stopPrice: 121.9,
  targetPrice: 143.2,
  stopDistancePct: 5.1,
  historicalWinRate: 0.58,
  historicalProfitFactor: 1.74,
  historicalTotalTrades: 62,
  riskGate: scan.candidates[0].riskGate,
  canTrackBreakoutPlan: true,
};

const manualNoQualify: MomentumBreakoutCheckResponse = {
  symbol: "TSLA",
  status: "REJECTED_BREAKOUT",
  verdictTitle: "Setup is too wide today",
  verdictMessage:
    "TSLA has momentum, but the stop is outside the preferred risk range.",
  failedSetupRules: [],
  rejectionReasons: [
    "Stop distance is 8.2%, above the preferred 8.0% cap.",
    "Historical profit factor is below the current quality threshold.",
  ],
  entryPrice: 188.2,
  stopPrice: 172.8,
  targetPrice: 214.6,
  stopDistancePct: 8.2,
  historicalWinRate: 0.47,
  historicalProfitFactor: 1.03,
  historicalTotalTrades: 28,
  riskGate: scan.candidates[2].riskGate,
  canTrackBreakoutPlan: false,
};

const modes = new Set<MomentumBreakoutFixtureMode>([
  "active",
  "manual-qualifies",
  "manual-no-qualify",
  "empty",
  "loading",
  "error",
]);

export function getMomentumBreakoutDevFixture(
  modeParam: string | null,
): MomentumBreakoutDevFixture | null {
  if (process.env.NODE_ENV !== "development" || !modeParam) return null;
  if (!modes.has(modeParam as MomentumBreakoutFixtureMode)) return null;

  const mode = modeParam as MomentumBreakoutFixtureMode;
  const base: MomentumBreakoutDevFixture = {
    mode,
    accessToken: DEV_ACCESS_TOKEN,
    flags,
    activeAlerts,
    historyAlerts,
    disclaimer,
    lastUpdated: Date.now(),
    refreshWarnings: [],
    alertsLoading: false,
    alertsError: null,
    scan,
    scanLoading: false,
    scanError: null,
    manualResult: null,
    manualError: null,
  };

  switch (mode) {
    case "manual-qualifies":
      return { ...base, manualResult: manualQualifies };
    case "manual-no-qualify":
      return { ...base, manualResult: manualNoQualify };
    case "empty":
      return {
        ...base,
        activeAlerts: [],
        historyAlerts: [],
        scan: emptyScan,
        lastUpdated: null,
      };
    case "loading":
      return {
        ...base,
        activeAlerts: [],
        historyAlerts: [],
        scan: null,
        alertsLoading: true,
        scanLoading: true,
        lastUpdated: null,
      };
    case "error":
      return {
        ...base,
        activeAlerts: [],
        historyAlerts: [],
        scan: null,
        alertsError: "Fixture: alert watchlist failed to load.",
        scanError: "Fixture: market scan failed to load.",
        manualError: "Fixture: manual check could not reach the scanner.",
        lastUpdated: null,
      };
    default:
      return base;
  }
}
