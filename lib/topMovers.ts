import type { PatternIntelligenceScores } from "@/app/types/intelligence";

export type ScoreBreakdownSegment = {
  key: string;
  label: string;
  value: number;
};

const BREAKDOWN_LABELS: Record<string, string> = {
  relative_strength: "Relative strength",
  trend: "Trend",
  volume: "Volume",
  breakout: "Breakout",
  pattern: "Pattern",
};

export function formatRegimeLabel(regimeId: string | null | undefined): string {
  if (!regimeId) return "Regime unknown";
  return regimeId
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" · ");
}

export function regimeRiskTone(
  regimeId: string | null | undefined,
): "risk-on" | "risk-off" | "neutral" {
  const id = (regimeId ?? "").toLowerCase();
  if (id.includes("risk_off") || id.includes("risk-off") || id.includes("defensive")) {
    return "risk-off";
  }
  if (id.includes("risk_on") || id.includes("risk-on") || id.includes("trend")) {
    return "risk-on";
  }
  return "neutral";
}

/** Accept 0–1 fraction or already-percent value (e.g. 72 → 72%). */
export function formatProbability(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  const pct = value > 1 && value <= 100 ? value : value * 100;
  return `${Math.round(pct)}%`;
}

/** Accept decimal excess (0.021 → +2.1%) or percent (2.1 → +2.1%). */
export function formatExcessReturn(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  const pct = Math.abs(value) > 1 && Math.abs(value) <= 100 ? value : value * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

export function trendIndicatorFromProbability(
  mlProbability: number | null | undefined,
): { label: string; tone: "positive" | "neutral" | "negative" } {
  if (mlProbability == null) {
    return { label: "—", tone: "neutral" };
  }
  if (mlProbability >= 0.6) return { label: "Strong", tone: "positive" };
  if (mlProbability >= 0.45) return { label: "Neutral", tone: "neutral" };
  return { label: "Cautious", tone: "negative" };
}

export function segmentsFromPatternScores(
  scores: PatternIntelligenceScores | null | undefined,
): ScoreBreakdownSegment[] {
  if (!scores) return [];
  const raw: Record<string, number> = {
    relative_strength: scores.relativeStrength,
    trend: scores.trendStrength,
    volume: scores.volumeConfirmation,
    breakout: scores.modelAlignment,
    pattern: scores.patternStrength,
  };
  return Object.entries(raw).map(([key, value]) => ({
    key,
    label: BREAKDOWN_LABELS[key] ?? key,
    value: Math.max(0, Math.min(1, value)),
  }));
}

export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return "Update time unknown";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Update time unknown";
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "Updated just now";
  if (diffMin < 60) return `Updated ${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 48) return `Updated ${diffH}h ago`;
  return `Updated ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}
