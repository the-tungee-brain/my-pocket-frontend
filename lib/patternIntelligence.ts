import type {
  ChartIntelligencePatternMetadata,
  PatternAlignmentBlock,
  PatternIntelligence,
  PatternSignalState,
  PrimaryCandlestickPattern,
} from "@/app/types/intelligence";

export function hasPatternIntelligence(
  payload: PatternIntelligence | null | undefined,
): payload is PatternIntelligence {
  return payload != null && Boolean(payload.symbol);
}

type PatternMetadataLike = Partial<ChartIntelligencePatternMetadata> & {
  pattern_id?: string;
  quality_score?: number;
  candle_indexes?: number[];
  start_date?: string;
  end_date?: string;
  qualification_checks?: { label: string; passed: boolean }[];
};

export function normalizeChartPatternMetadata(
  meta: PatternMetadataLike | null | undefined,
): ChartIntelligencePatternMetadata | null {
  if (!meta) return null;
  return {
    patternId: meta.patternId ?? meta.pattern_id ?? "",
    label: meta.label ?? "",
    direction: meta.direction ?? "",
    confidence: meta.confidence ?? 0,
    qualityScore: meta.qualityScore ?? meta.quality_score ?? 0,
    candleIndexes: meta.candleIndexes ?? meta.candle_indexes ?? [],
    startDate: meta.startDate ?? meta.start_date,
    endDate: meta.endDate ?? meta.end_date,
    qualificationChecks:
      meta.qualificationChecks ?? meta.qualification_checks ?? [],
    explanation: meta.explanation ?? "",
  };
}

export function patternIntelligencePrimaryPattern(
  intelligence: PatternIntelligence,
): PrimaryCandlestickPattern | null {
  return (
    intelligence.primaryPattern ??
    intelligence.activePatterns?.[0] ??
    null
  );
}

export function formatPatternDirectionLabel(direction: string): string {
  if (direction === "bullish") return "Bullish";
  if (direction === "bearish") return "Bearish";
  return "Neutral";
}

export function patternQualityLabel(strength: number): string {
  if (strength >= 0.7) return "High quality";
  if (strength >= 0.45) return "Moderate weight";
  return "Low weight";
}

export function patternIntelligencePatternSubtitle(
  pattern: PrimaryCandlestickPattern,
): string {
  return `${formatPatternDirectionLabel(pattern.direction)} · ${patternQualityLabel(pattern.strength)}`;
}

export function formatPatternPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

export type SignalTone =
  | "strong_bullish"
  | "bullish"
  | "slight_bullish"
  | "neutral"
  | "slight_bearish"
  | "bearish"
  | "strong_bearish"
  | "unavailable"
  | "warning";

export function signalStateTone(
  signalState: PatternSignalState | null | undefined,
  alignmentState?: string,
): SignalTone {
  if (signalState?.tone) {
    return signalState.tone as SignalTone;
  }
  return alignmentState === "conflict" ? "warning" : "neutral";
}

export function verdictTone(
  verdict: string,
  alignmentState: string,
  signalState?: PatternSignalState | null,
  alignment?: PatternAlignmentBlock | null,
): SignalTone {
  if (signalState?.tone && signalState.tone !== "unavailable") {
    return signalState.tone as SignalTone;
  }
  if (alignment?.state === "conflict") return "warning";

  const text = verdict.toLowerCase();
  if (text.includes("bullish continuation") || text.includes("rebound")) {
    return "bullish";
  }
  if (text.includes("bearish trend") || text.includes("weakness")) {
    return "bearish";
  }
  if (text.includes("mixed") || text.includes("inconclusive")) {
    return "neutral";
  }
  if (alignmentState === "conflict") return "warning";
  return "neutral";
}

export const signalToneClass = {
  strong_bullish: "text-success",
  bullish: "text-success",
  slight_bullish: "text-success/80",
  neutral: "text-foreground",
  slight_bearish: "text-danger/80",
  bearish: "text-danger",
  strong_bearish: "text-danger",
  unavailable: "text-muted",
  warning: "text-warning",
} as const;

export const signalToneBorderClass = {
  strong_bullish: "border-success/30 bg-success/10",
  bullish: "border-success/25 bg-success/5",
  slight_bullish: "border-success/20 bg-success/5",
  neutral: "border-border bg-background/40",
  slight_bearish: "border-danger/20 bg-danger/5",
  bearish: "border-danger/25 bg-danger/5",
  strong_bearish: "border-danger/30 bg-danger/10",
  unavailable: "border-border bg-background/40",
  warning: "border-warning/25 bg-warning/5",
} as const;
