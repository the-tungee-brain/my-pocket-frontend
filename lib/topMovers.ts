import type {
  ChartIntelligenceBreakoutEvent,
  PatternIntelligence,
  PatternIntelligenceScores,
  PatternTrendContextIntel,
} from "@/app/types/intelligence";
import type { RankingItem } from "@/app/types/rankings";

export type ScoreBreakdownSegment = {
  key: string;
  label: string;
  value: number;
  tier: ContributionTier;
  tierLabel: string;
};

export type ContributionTier = "strong" | "moderate" | "weak" | "missing";

export type ConvictionTier = "elite" | "strong" | "rising" | "mixed";

export type ConvictionDisplay = {
  tier: ConvictionTier;
  label: string;
  accessibilityLabel: string;
};

export type RankContext = {
  rankLabel: string;
  subtitle: string;
};

export type KeySignal = {
  id: string;
  label: string;
  positive: boolean;
};

export type InsightLine = {
  id: string;
  label: string;
};

export type TrendDisplay = {
  label: string;
  symbol: string;
  tone: "positive" | "neutral" | "negative";
};

export type RegimeNarrative = {
  title: string;
  guidance: string;
  signalImpact: string;
  confidenceNote: string;
};

const BREAKDOWN_LABELS: Record<string, string> = {
  relative_strength: "Relative strength",
  trend: "Trend",
  volume: "Volume",
  breakout: "Breakout",
  pattern: "Pattern",
};

const GAP_LABELS: Record<string, string> = {
  relative_strength: "Relative strength could be stronger",
  trend: "Trend alignment is only moderate",
  volume: "Volume not fully confirming",
  breakout: "Weak breakout component",
  pattern: "No pattern confirmation",
};

const STRENGTH_LABELS: Record<string, string> = {
  relative_strength: "Strong relative strength",
  trend: "Trend alignment",
  volume: "Volume confirmation",
  breakout: "Breakout strength",
  pattern: "Pattern confirmation",
};

export const CONVICTION_LABELS: Record<ConvictionTier, string> = {
  elite: "Elite",
  strong: "Strong",
  rising: "Rising",
  mixed: "Mixed",
};

export function rankingsHaveMlMetrics(items: RankingItem[]): boolean {
  return items.some(
    (i) => i.ml_probability != null || i.expected_excess_return != null,
  );
}

function averageScore(scores: PatternIntelligenceScores): number {
  return (
    scores.relativeStrength +
    scores.trendStrength +
    scores.volumeConfirmation +
    scores.modelAlignment +
    scores.patternStrength
  ) / 5;
}

import {
  buildMoverResearchInsight,
  CONVICTION_FRAMEWORK,
  convictionFromListPercentile,
  convictionTierFromListRank,
  convictionTierFromSignalAverage,
  listRankPercentile,
  portfolioRole,
  rankContext,
  regimeCompactInsight,
  type DecisionSummary,
  type MoverResearchInsight,
  type RegimeCompact,
} from "@/lib/topMoversInsight";

export {
  buildMoverResearchInsight,
  CONVICTION_FRAMEWORK,
  convictionFromListPercentile,
  convictionTierFromListRank,
  convictionTierFromSignalAverage,
  listRankPercentile,
  portfolioRole,
  rankContext,
  regimeCompactInsight,
  type DecisionSummary,
  type MoverResearchInsight,
  type RegimeCompact,
};

export function convictionFromScores(
  scores: PatternIntelligenceScores,
): ConvictionTier {
  return convictionTierFromSignalAverage(averageScore(scores));
}

/** List rows — list-percentile framework; stable when intel loads. */
export function convictionForRow(
  rank: number,
  listCount: number,
): ConvictionDisplay {
  const tier = convictionTierFromListRank(rank, listCount);
  const label = CONVICTION_LABELS[tier];
  return {
    tier,
    label,
    accessibilityLabel: `List conviction ${label}`,
  };
}

/** Detail panel — pattern scores when available. */
export function convictionForDetail(
  rank: number,
  listCount: number,
  scores?: PatternIntelligenceScores | null,
): ConvictionDisplay {
  const tier = scores
    ? convictionTierFromSignalAverage(averageScore(scores))
    : convictionTierFromListRank(rank, listCount);
  const label = CONVICTION_LABELS[tier];
  return {
    tier,
    label,
    accessibilityLabel: `Signal conviction ${label}`,
  };
}

export function contributionTier(value: number): ContributionTier {
  if (value >= 0.68) return "strong";
  if (value >= 0.45) return "moderate";
  if (value >= 0.2) return "weak";
  return "missing";
}

export function contributionTierLabel(tier: ContributionTier): string {
  switch (tier) {
    case "strong":
      return "Strong";
    case "moderate":
      return "Moderate";
    case "weak":
      return "Weak";
    default:
      return "Missing";
  }
}

/** Whether to draw a fill (missing / near-zero = empty track only). */
export function showsContributionFill(
  tier: ContributionTier,
  value: number,
): boolean {
  if (tier === "missing" || value < 0.08) return false;
  return true;
}

/** Bar width % — weak/moderate get a visible minimum; missing returns 0. */
export function contributionBarWidth(
  tier: ContributionTier,
  value: number,
): number {
  if (!showsContributionFill(tier, value)) return 0;
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  switch (tier) {
    case "strong":
      return pct;
    case "moderate":
      return Math.max(pct, 10);
    case "weak":
      return Math.max(pct, 14);
    default:
      return 0;
  }
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
  return Object.entries(raw).map(([key, value]) => {
    const clamped = Math.max(0, Math.min(1, value));
    const tier = contributionTier(clamped);
    return {
      key,
      label: BREAKDOWN_LABELS[key] ?? key,
      value: clamped,
      tier,
      tierLabel: contributionTierLabel(tier),
    };
  });
}

const SPARKLINE_HEIGHT_PX = 22;

/** Mini bar in the ranked list — weak uses warning + minimum height. */
export function sparklineBarSpec(value: number): {
  heightPx: number;
  tone: "strong" | "moderate" | "weak" | "missing";
} {
  const clamped = Math.max(0, Math.min(1, value));
  const tier = contributionTier(clamped);
  if (!showsContributionFill(tier, clamped)) {
    return { heightPx: 4, tone: "missing" };
  }
  const fromValue = Math.round(clamped * SPARKLINE_HEIGHT_PX);
  switch (tier) {
    case "strong":
      return { heightPx: Math.max(fromValue, 12), tone: "strong" };
    case "moderate":
      return { heightPx: Math.max(fromValue, 10), tone: "moderate" };
    case "weak":
      return { heightPx: Math.max(fromValue, 9), tone: "weak" };
    default:
      return { heightPx: 4, tone: "missing" };
  }
}

export function sparklineFromSegments(
  segments: ScoreBreakdownSegment[],
): number[] {
  const order = [
    "relative_strength",
    "trend",
    "volume",
    "breakout",
    "pattern",
  ];
  return order.map((key) => segments.find((s) => s.key === key)?.value ?? 0);
}

export function strengthsAndGaps(
  intel: PatternIntelligence | null | undefined,
  segments: ScoreBreakdownSegment[],
): { strengths: InsightLine[]; gaps: InsightLine[] } {
  const strengths: InsightLine[] = [];
  const gaps: InsightLine[] = [];
  const seenS = new Set<string>();
  const seenG = new Set<string>();
  const seenStrengthLabels = new Set<string>();
  const seenGapLabels = new Set<string>();

  const addStrength = (id: string, label: string) => {
    if (seenS.has(id) || seenStrengthLabels.has(label)) return;
    seenS.add(id);
    seenStrengthLabels.add(label);
    strengths.push({ id, label });
  };
  const addGap = (id: string, label: string) => {
    if (seenG.has(id) || seenGapLabels.has(label)) return;
    seenG.add(id);
    seenGapLabels.add(label);
    gaps.push({ id, label });
  };

  for (const seg of segments) {
    if (seg.tier === "strong") {
      addStrength(seg.key, STRENGTH_LABELS[seg.key] ?? seg.label);
    } else if (seg.tier === "missing" || seg.tier === "weak") {
      addGap(seg.key, GAP_LABELS[seg.key] ?? `Weak ${seg.label.toLowerCase()}`);
    }
  }

  if (!intel) {
    return { strengths: strengths.slice(0, 5), gaps: gaps.slice(0, 4) };
  }

  const tc = intel.trendContext;
  if (tc.aboveSma50) addStrength("sma50", "Above SMA50");
  if (tc.aboveSma200) addStrength("sma200", "Above SMA200");

  const hasBreakout = (intel.chartIntelligence?.breakoutEvents ?? []).some(
    (e) => {
      const k = (e.kind ?? e.label ?? "").toLowerCase();
      return k.includes("high") || k.includes("breakout");
    },
  );
  if (!hasBreakout) {
    addGap("high", "Not near a recent high / breakout");
  }

  return { strengths: strengths.slice(0, 5), gaps: gaps.slice(0, 4) };
}

export function regimeNarrative(
  regimeId: string | null | undefined,
): RegimeNarrative {
  const id = (regimeId ?? "").toLowerCase();
  if (id === "risk_on_trend") {
    return {
      title: "Risk-on · Trending market",
      guidance:
        "Momentum signals are active. Favor leaders with strong relative strength and volume confirmation.",
      signalImpact: "Momentum signals historically perform well in this regime.",
      confidenceNote: "Signal confidence is generally elevated for trend leaders.",
    };
  }
  if (id === "risk_on_chop") {
    return {
      title: "Risk-on · Choppy market",
      guidance:
        "Momentum signals are active, but expect more false breakouts. Be selective and wait for confirmation.",
      signalImpact: "False breakouts are more common; confirmation matters more.",
      confidenceNote: "Treat conviction as one notch lower unless volume confirms.",
    };
  }
  if (id === "high_vol_chop") {
    return {
      title: "High volatility · Choppy",
      guidance:
        "Larger swings and whipsaws. Reduce size and require stronger confirmation before acting.",
      signalImpact: "Whipsaws can invalidate short-term momentum reads quickly.",
      confidenceNote: "Signal confidence is reduced — favor Elite/Strong only.",
    };
  }
  if (id === "risk_off") {
    return {
      title: "Risk-off · Defensive",
      guidance:
        "Defensive posture. Prioritize quality and avoid aggressive breakout chasing.",
      signalImpact: "Breakout and momentum signals underperform more often.",
      confidenceNote: "Downgrade discretionary conviction; focus on quality factors.",
    };
  }
  return {
    title: formatRegimeLabel(regimeId),
    guidance: "Rankings adapt to the current SPY trend and volatility regime.",
    signalImpact: "Signal quality depends on the active regime.",
    confidenceNote: "Compare conviction and missing signals before acting.",
  };
}

export function formatRegimeLabel(regimeId: string | null | undefined): string {
  if (!regimeId) return "Regime unknown";
  return regimeId
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function regimeRiskTone(
  regimeId: string | null | undefined,
): "risk-on" | "risk-off" | "neutral" {
  const id = (regimeId ?? "").toLowerCase();
  if (id.includes("risk_off") || id.includes("defensive")) {
    return "risk-off";
  }
  if (id.includes("risk_on") || id.includes("trend") || id.includes("chop")) {
    return "risk-on";
  }
  return "neutral";
}

export function formatProbability(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  const pct = value > 1 && value <= 100 ? value : value * 100;
  return `${Math.round(pct)}%`;
}

export function formatExcessReturn(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  const pct = Math.abs(value) > 1 && Math.abs(value) <= 100 ? value : value * 100;
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

/** Short price-trend label (not conviction). */
export function priceTrendLabel(
  intel: PatternIntelligence | null | undefined,
): string | null {
  if (!intel) return null;
  const bias = (intel.trendContext.trendBias ?? "").toLowerCase();
  switch (bias) {
    case "uptrend":
      return "Uptrend";
    case "downtrend":
      return "Downtrend";
    case "mixed":
      return "Sideways";
    default:
      return "Unclear";
  }
}

export function sparklineFromScores(
  scores: PatternIntelligenceScores | null | undefined,
): number[] {
  return sparklineFromSegments(segmentsFromPatternScores(scores));
}

export function keySignalsFromIntelligence(
  intel: PatternIntelligence | null | undefined,
): KeySignal[] {
  if (!intel) return [];
  const { strengths } = strengthsAndGaps(
    intel,
    segmentsFromPatternScores(intel.scores),
  );
  return strengths.map((line) => ({
    id: line.id,
    label: line.label,
    positive: true,
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
