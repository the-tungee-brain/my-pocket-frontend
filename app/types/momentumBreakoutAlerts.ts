/** API DTOs for Momentum Breakout trade-plan alerts (camelCase JSON). */

export type AlertLifecycleStatus =
  | "PENDING_ENTRY"
  | "ENTRY_TRIGGERED"
  | "OPEN"
  | "TARGET_HIT"
  | "STOP_HIT"
  | "EXPIRED"
  | "CANCELLED";

export type AlertRiskGateAction = "ALLOW" | "WARN" | "SIZE_DOWN" | "BLOCK" | "";

export type NotificationEventType =
  | "AlertCreated"
  | "EntryTriggered"
  | "TargetHit"
  | "StopHit"
  | "Expired"
  | "BlockedByRiskGate"
  | "WarningByRiskGate";

export type NotificationSeverity = "info" | "watch" | "warning" | "critical";

export type AlertLifecycleEventDto = {
  eventId: string;
  eventType: string;
  fromStatus: string | null;
  toStatus: string;
  price: number | null;
  recordedAt: string;
  message: string;
};

export type MomentumBreakoutAlertDto = {
  alertId: string | null;
  symbol: string;
  setupName: string;
  direction: string;
  status: AlertLifecycleStatus;
  createdAt: string;
  signalDate: string;
  entryPrice: number;
  stopPrice: number;
  targetPrice: number;
  riskReward: number;
  entryIsStop: boolean;
  expiresAt: string;
  triggeredAt: string | null;
  exitAt: string | null;
  exitPrice: number | null;
  outcomeReturnPct: number | null;
  riskGateAction: AlertRiskGateAction;
  riskGateReasons: string[];
  priority: string;
  historicalWinRate: number | null;
  historicalProfitFactor: number | null;
  historicalTotalTrades: number | null;
  nextActionMessage: string;
  lifecycleEvents: AlertLifecycleEventDto[];
};

export type MomentumBreakoutAlertListResponse = {
  disclaimer: string;
  alerts: MomentumBreakoutAlertDto[];
};

export type MomentumBreakoutNotificationDto = {
  notificationId: string;
  eventType: NotificationEventType;
  title: string;
  body: string;
  severity: NotificationSeverity;
  nextActionMessage: string;
  symbol: string;
  alertId: string | null;
  read: boolean;
  createdAt: string;
  alert: MomentumBreakoutAlertDto;
};

export type MomentumBreakoutNotificationListResponse = {
  disclaimer: string;
  notifications: MomentumBreakoutNotificationDto[];
};

export type MarkNotificationReadResponse = {
  disclaimer: string;
  notification: MomentumBreakoutNotificationDto;
};

export type MomentumBreakoutAlertRefreshResponse = {
  disclaimer: string;
  processed: number;
  updated: number;
  skippedMarketHours: boolean;
  warnings: string[];
  changes: {
    alertId: string;
    symbol: string;
    priorStatus: string;
    newStatus: string;
  }[];
  alerts: MomentumBreakoutAlertDto[];
};
