import type { PatternIntelligence } from "@/app/types/intelligence";

export function hasPatternIntelligence(
  payload: PatternIntelligence | null | undefined,
): payload is PatternIntelligence {
  return payload != null && Boolean(payload.symbol);
}

export function formatPatternPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

export function setupOutcomeHasStats(
  outcome: PatternIntelligence["setupOutcome"],
): boolean {
  return (
    outcome != null &&
    outcome.occurrenceCount >= 3 &&
    outcome.avgReturn5d != null
  );
}

export function verdictBulletIcon(tone: string): string {
  switch (tone) {
    case "positive":
      return "✅";
    case "warning":
      return "⚠️";
    case "negative":
      return "❌";
    default:
      return "•";
  }
}

export function interpretationTone(
  verdict: string | undefined,
  alignmentState: string,
): "positive" | "negative" | "neutral" | "warning" {
  const text = (verdict ?? "").toLowerCase();
  if (text.includes("override") || text.includes("conflict")) return "warning";
  if (text.includes("confirm") && !text.includes("weak")) return "positive";
  if (alignmentState === "model_only" || text.includes("model-only")) return "neutral";
  if (text.includes("neutral")) return "neutral";
  if (text.includes("bearish") || text.includes("conflict")) return "warning";
  return "neutral";
}
