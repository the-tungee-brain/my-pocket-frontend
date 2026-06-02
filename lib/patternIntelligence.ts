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

export function verdictTone(
  verdict: string,
  alignmentState: string,
): "positive" | "negative" | "neutral" | "warning" {
  const text = verdict.toLowerCase();
  if (text.includes("dominates") || text.includes("confirms")) return "positive";
  if (text.includes("reduce exposure") || text.includes("confirmed by weak")) {
    return "warning";
  }
  if (text.includes("conflict") || text.includes("defer")) return "warning";
  if (alignmentState === "model_only") return "neutral";
  return "neutral";
}
