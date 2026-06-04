import type { EmergingLeaderItem, SetupStageId } from "@/app/types/emergingLeaders";

export function rankLabel(rank: number): string {
  return `#${rank}`;
}

export function listRowSubtitle(item: EmergingLeaderItem): string {
  return item.setupStageLabel;
}

export function setupScoreTone(
  score: number,
): "positive" | "warning" | "default" | "negative" {
  if (score >= 80) return "positive";
  if (score >= 60) return "warning";
  if (score >= 40) return "default";
  return "negative";
}

export function compressionVelocityTone(
  score: number,
): "positive" | "warning" | "default" | "negative" {
  if (score >= 66) return "positive";
  if (score >= 42) return "warning";
  return "default";
}

export function stageBadgeVariant(
  stage: SetupStageId,
): "accent" | "muted" | "success" | "danger" {
  switch (stage) {
    case "TIGHTENING":
    case "BREAKOUT_WATCH":
      return "accent";
    case "BREAKOUT_TRIGGERED":
      return "success";
    case "EXTENDED":
      return "danger";
    default:
      return "muted";
  }
}
