import type {
  AlertLifecycleStatus,
  AlertRiskGateAction,
  NotificationSeverity,
} from "@/app/types/momentumBreakoutAlerts";
import { cn } from "@/lib/utils";

/** Lifecycle status → badge tone for client layout. */
export type StatusBadgeTone = "neutral" | "active" | "success" | "danger" | "muted";

const STATUS_TONE: Record<AlertLifecycleStatus, StatusBadgeTone> = {
  PENDING_ENTRY: "neutral",
  ENTRY_TRIGGERED: "active",
  OPEN: "active",
  TARGET_HIT: "success",
  STOP_HIT: "danger",
  EXPIRED: "muted",
  CANCELLED: "muted",
};

const STATUS_LABEL: Record<AlertLifecycleStatus, string> = {
  PENDING_ENTRY: "Waiting for buy price",
  ENTRY_TRIGGERED: "Buy price reached",
  OPEN: "Plan in progress",
  TARGET_HIT: "Target reached",
  STOP_HIT: "Stop reached",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

export function statusBadgeTone(status: string): StatusBadgeTone {
  return STATUS_TONE[status as AlertLifecycleStatus] ?? "neutral";
}

export function statusBadgeLabel(status: string): string {
  return STATUS_LABEL[status as AlertLifecycleStatus] ?? status.replaceAll("_", " ");
}

const CANCELLABLE_STATUSES: ReadonlySet<AlertLifecycleStatus> = new Set([
  "PENDING_ENTRY",
  "ENTRY_TRIGGERED",
  "OPEN",
]);

export function isAlertCancellable(status: string): boolean {
  return CANCELLABLE_STATUSES.has(status as AlertLifecycleStatus);
}

export function statusBadgeClass(tone: StatusBadgeTone): string {
  switch (tone) {
    case "active":
      return "border-accent/35 bg-accent-muted/30 text-accent-strong";
    case "success":
      return "border-success/35 bg-success/10 text-success";
    case "danger":
      return "border-danger/35 bg-danger/10 text-danger";
    case "muted":
      return "border-border bg-muted-bg/50 text-muted";
    default:
      return "border-border bg-secondary/70 text-muted";
  }
}

export type RiskGateTone = "normal" | "warning" | "caution" | "blocked";

export function riskGateTone(action: string): RiskGateTone {
  switch ((action || "").toUpperCase() as AlertRiskGateAction) {
    case "WARN":
      return "warning";
    case "SIZE_DOWN":
      return "caution";
    case "BLOCK":
      return "blocked";
    default:
      return "normal";
  }
}

export function riskGatePanelClass(tone: RiskGateTone): string {
  return cn(
    "border px-3 py-2 text-xs leading-relaxed",
    tone === "normal" && "border-border/60 bg-muted-bg/30 text-muted",
    tone === "warning" &&
      "border-amber-500/35 bg-amber-500/10 text-amber-900 dark:text-amber-100",
    tone === "caution" &&
      "border-orange-500/35 bg-orange-500/10 text-orange-900 dark:text-orange-100",
    tone === "blocked" && "border-danger/35 bg-danger/10 text-danger",
  );
}

export function riskGateLabel(action: string): string {
  switch ((action || "").toUpperCase()) {
    case "WARN":
      return "Heads up";
    case "SIZE_DOWN":
      return "Consider a smaller position";
    case "BLOCK":
      return "Not recommended right now";
    case "ALLOW":
      return "Passed safety checks";
    default:
      return "Safety check";
  }
}

/** Plain-language reasons for alert risk panels (not scanner blocks). */
export function humanizeAlertRiskReason(reason: string): string {
  const lower = reason.toLowerCase();
  if (lower.includes("neutral")) {
    return "The broad market looks uncertain right now.";
  }
  if (lower.includes("max open positions")) {
    return "You already have several similar plans being tracked.";
  }
  if (lower.includes("consecutive") && lower.includes("loss")) {
    return "Recent similar plans finished with losses.";
  }
  if (lower.includes("drawdown")) {
    return "Recent results for this strategy have been weak.";
  }
  if (lower.includes("volume") || lower.includes("climax")) {
    return "Today's volume looks unusually high, which can be risky.";
  }
  if (lower.includes("mega") || lower.includes("correlation")) {
    return "You may already have enough exposure to big tech names.";
  }
  if (lower.includes("circuit breaker")) {
    return "Safety rules paused new alerts after a string of losses.";
  }
  return reason;
}

export function notificationSeverityClass(severity: NotificationSeverity): string {
  switch (severity) {
    case "critical":
      return "border-danger/40 bg-danger/10 text-danger";
    case "warning":
      return "border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300";
    case "watch":
      return "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200";
    default:
      return "border-border bg-secondary/70 text-muted";
  }
}

const EDUCATIONAL_REASON_MARKERS = [
  "not investment advice",
  "educational",
  "no orders are placed",
];

/** Show actionable risk reasons; hide boilerplate disclaimers. */
export function filterRiskGateReasons(reasons: string[]): string[] {
  return reasons.filter((reason) => {
    const lower = reason.toLowerCase();
    return !EDUCATIONAL_REASON_MARKERS.some((marker) => lower.includes(marker));
  });
}

export function formatSetupName(setupName: string): string {
  if (!setupName) return "Breakout pattern";
  return setupName
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatUsdLevel(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatWinRate(value: number | null): string {
  if (value === null || value === undefined) return "—";
  const pct = value <= 1 ? value * 100 : value;
  return `${pct.toFixed(1)}%`;
}

export function formatProfitFactor(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return value.toFixed(2);
}

export type AlertVerdictKind = "Approved" | "Caution" | "Rejected" | "Completed";

export function alertVerdictPanelClass(kind: AlertVerdictKind): string {
  switch (kind) {
    case "Approved":
      return "border-success/30 bg-success/5";
    case "Caution":
      return "border-amber-500/30 bg-amber-500/10";
    case "Rejected":
      return "border-danger/30 bg-danger/5";
    case "Completed":
      return "border-border/60 bg-muted-bg/30";
  }
}

export function alertVerdictTitleClass(kind: AlertVerdictKind): string {
  switch (kind) {
    case "Approved":
      return "text-success";
    case "Caution":
      return "text-amber-800 dark:text-amber-200";
    case "Rejected":
      return "text-danger";
    case "Completed":
      return "text-muted";
  }
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
