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
};

export type KeySignal = {
  id: string;
  label: string;
  positive: boolean;
};

export type TrendDisplay = {
  label: string;
  symbol: string;
  tone: "positive" | "neutral" | "negative";
};

export type RegimeNarrative = {
  title: string;
  guidance: string;
};

const BREAKDOWN_LABELS: Record<string, string> = {
  relative_strength: "Relative strength",
  trend: "Trend",
  volume: "Volume",
  breakout: "Breakout",
  pattern: "Pattern",
};

export function rankingsHaveMlMetrics(items: RankingItem[]): boolean {
  return items.some(
    (i) => i.ml_probability != null || i.expected_excess_return != null,
  );
}

export function topUniverseLabel(
  rank: number,
  universeSize: number | null | undefined,
  listCount?: number,
): string {
  const universe = universeSize ?? listCount ?? 500;
  if (universe <= 0) return `Rank #${rank}`;
  const topPct = (rank / universe) * 100;
  if (topPct <= 1) return "Top 1% of universe";
  if (topPct <= 5) return "Top 5% of universe";
  if (topPct <= 10) return "Top 10% of universe";
  if (topPct <= 25) return "Top 25% of universe";
  return `Top ${Math.ceil(topPct)}% of universe`;
}

export function signalStrengthLabel(
  scores: PatternIntelligenceScores | null | undefined,
): string | null {
  if (!scores) return null;
  const avg =
    (scores.relativeStrength +
      scores.trendStrength +
      scores.volumeConfirmation +
      scores.modelAlignment +
      scores.patternStrength) /
    5;
  if (avg >= 0.72) return "Strong signal";
  if (avg >= 0.52) return "Moderate signal";
  return "Developing signal";
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
    };
  }
  if (id === "risk_on_chop") {
    return {
      title: "Risk-on · Choppy market",
      guidance:
        "Momentum signals are active, but expect more false breakouts. Be selective and wait for confirmation.",
    };
  }
  if (id === "high_vol_chop") {
    return {
      title: "High volatility · Choppy",
      guidance:
        "Larger swings and whipsaws. Reduce size and require stronger confirmation before acting.",
    };
  }
  if (id === "risk_off") {
    return {
      title: "Risk-off · Defensive",
      guidance:
        "Defensive posture. Prioritize quality and avoid aggressive breakout chasing.",
    };
  }
  return {
    title: formatRegimeLabel(regimeId),
    guidance:
      "Rankings adapt to the current SPY trend and volatility regime.",
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

export function trendDisplayFromIntelligence(
  intel: PatternIntelligence | null | undefined,
): TrendDisplay | null {
  if (!intel) return null;
  const bias = (intel.trendContext.trendBias ?? "").toLowerCase();
  const strength = intel.scores.trendStrength;
  if (
    bias.includes("up") ||
    bias.includes("bull") ||
    strength >= 0.65
  ) {
    return { label: "Strong uptrend", symbol: "↗", tone: "positive" };
  }
  if (
    bias.includes("down") ||
    bias.includes("bear") ||
    strength <= 0.35
  ) {
    return { label: "Weak trend", symbol: "↘", tone: "negative" };
  }
  return { label: "Sideways", symbol: "→", tone: "neutral" };
}

export function trendDisplayFromRank(
  rank: number,
  listCount: number,
): TrendDisplay {
  const ratio = rank / Math.max(listCount, 1);
  if (ratio <= 0.15) {
    return { label: "Leader", symbol: "↗", tone: "positive" };
  }
  if (ratio >= 0.6) {
    return { label: "Mixed", symbol: "→", tone: "neutral" };
  }
  return { label: "Rising", symbol: "↗", tone: "positive" };
}

export function keySignalsFromIntelligence(
  intel: PatternIntelligence | null | undefined,
): KeySignal[] {
  if (!intel) return [];
  const signals: KeySignal[] = [];
  const seen = new Set<string>();
  const add = (id: string, label: string, positive = true) => {
    if (seen.has(id)) return;
    seen.add(id);
    signals.push({ id, label, positive });
  };

  const tc: PatternTrendContextIntel = intel.trendContext;
  if (tc.aboveSma50) add("sma50", "Above SMA50");
  if (tc.aboveSma200) add("sma200", "Above SMA200");

  const vol = tc.volRatio20d;
  if (vol != null && vol >= 1.2) {
    add("vol", `Relative volume ${vol.toFixed(1)}×`);
  }

  const rs = tc.rsVsSpy21d;
  if (rs != null && rs > 0.02) add("rs21", "Strong relative strength");
  else if (intel.scores.relativeStrength >= 0.68) {
    add("rs_score", "Strong relative strength");
  }

  if (intel.scores.trendStrength >= 0.68) add("trend_score", "Strong trend alignment");
  if (intel.scores.volumeConfirmation >= 0.65) {
    add("vol_score", "Volume confirming move");
  }

  const breakouts: ChartIntelligenceBreakoutEvent[] =
    intel.chartIntelligence?.breakoutEvents ?? [];
  for (const event of breakouts) {
    const kind = (event.kind ?? event.label ?? "").toLowerCase();
    if (kind.includes("high") || kind.includes("breakout")) {
      add("high", "Recent breakout / new high");
      break;
    }
  }

  if (intel.primaryPattern?.label) {
    add(
      "pattern",
      `${intel.primaryPattern.label} pattern detected`,
      intel.primaryPattern.direction?.toLowerCase() !== "bearish",
    );
  }

  return signals.slice(0, 6);
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
