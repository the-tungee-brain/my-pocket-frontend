import type {
  PatternIntelligence,
  PatternIntelligenceScores,
  PatternSetupOutcome,
} from "@/app/types/intelligence";

export type PatternAlignmentState = "confirmed" | "conflict" | "model_only";

export function hasPatternIntelligence(
  payload: PatternIntelligence | null | undefined,
): payload is PatternIntelligence {
  return payload != null && Boolean(payload.symbol);
}

export function patternAlignmentState(
  scores: PatternIntelligenceScores,
): PatternAlignmentState {
  const state = scores.alignmentState;
  if (state === "confirmed" || state === "conflict" || state === "model_only") {
    return state;
  }
  if (scores.confidence === "conflicting") return "conflict";
  if (scores.confidence === "model_only") return "model_only";
  return "model_only";
}

export function patternAlignmentLabel(state: PatternAlignmentState): string {
  switch (state) {
    case "confirmed":
      return "Confirmed";
    case "conflict":
      return "Conflict";
    default:
      return "Model only";
  }
}

export function patternAlignmentTone(
  state: PatternAlignmentState,
): "positive" | "negative" | "neutral" | "warning" {
  switch (state) {
    case "confirmed":
      return "positive";
    case "conflict":
      return "warning";
    default:
      return "neutral";
  }
}

export function patternAlignmentDescription(
  state: PatternAlignmentState,
): string {
  switch (state) {
    case "confirmed":
      return "Candlestick direction aligns with the core RS + trend model.";
    case "conflict":
      return "Pattern disagrees with the model — defer to the ranking signal.";
    default:
      return "No recent pattern — the RS + trend model is the sole signal.";
  }
}

export function patternConfidenceLabel(confidence: string): string {
  switch (confidence) {
    case "high":
      return "High confirmation";
    case "moderate":
      return "Moderate confirmation";
    case "low":
      return "Low confirmation";
    case "conflicting":
      return "Conflicting context";
    case "model_only":
      return "Model only";
    default:
      return confidence.replace(/_/g, " ");
  }
}

export function patternConfidenceTone(
  confidence: string,
): "positive" | "negative" | "neutral" | "warning" {
  switch (confidence) {
    case "high":
      return "positive";
    case "moderate":
      return "neutral";
    case "low":
      return "warning";
    case "conflicting":
      return "warning";
    default:
      return "neutral";
  }
}

export function formatPatternPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

export function formatPatternScore(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${Math.round(value * 100)}%`;
}

export function setupOutcomeHasStats(
  outcome: PatternSetupOutcome | null | undefined,
): boolean {
  return (
    outcome != null &&
    outcome.occurrenceCount >= 3 &&
    outcome.avgReturn5d != null
  );
}

export function scoreBreakdownRows(scores: PatternIntelligenceScores) {
  return [
    { key: "trend", label: "Trend", value: scores.trendStrength },
    { key: "rs", label: "Relative strength", value: scores.relativeStrength },
    { key: "pattern", label: "Pattern", value: scores.patternStrength },
    { key: "volume", label: "Volume", value: scores.volumeConfirmation },
    { key: "alignment", label: "Model alignment", value: scores.modelAlignment },
  ];
}
