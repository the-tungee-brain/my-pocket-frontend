import type { PatternIntelligence } from "@/app/types/intelligence";
import type { RankingItem } from "@/app/types/rankings";
import type {
  ConvictionTier,
  InsightLine,
  ScoreBreakdownSegment,
} from "@/lib/topMovers";
import {
  contributionTier,
  regimeNarrative,
  strengthsAndGaps,
} from "@/lib/topMovers";

/** Documented badge thresholds (list position + signal composite). */
export const CONVICTION_FRAMEWORK = {
  listPercentile: {
    elite: "≥ 90th percentile in today's list (top ~10%)",
    strong: "≥ 70th percentile",
    rising: "≥ 45th percentile",
    mixed: "Below 45th percentile",
  },
  signalComposite: {
    elite: "Average contribution score ≥ 78%",
    strong: "≥ 62%",
    rising: "≥ 48%",
    mixed: "Below 48%",
  },
} as const;

export type RegimeCompact = {
  title: string;
  impact: string;
};

export type DecisionSummary = {
  headline: string;
  reasons: string[];
};

export type MoverResearchInsight = {
  thesis: string;
  supports: InsightLine[];
  missing: InsightLine[];
  confirmations: InsightLine[];
  decisionSummary: DecisionSummary;
  regimeCompact: RegimeCompact;
  portfolioRole: string | null;
};

export function listRankPercentile(rank: number, listCount: number): number {
  const count = Math.max(listCount, 1);
  return Math.round((1 - (rank - 1) / count) * 100);
}

export function convictionFromListPercentile(
  percentile: number,
): ConvictionTier {
  if (percentile >= 90) return "elite";
  if (percentile >= 70) return "strong";
  if (percentile >= 45) return "rising";
  return "mixed";
}

export function convictionTierFromListRank(
  rank: number,
  listCount: number,
): ConvictionTier {
  return convictionFromListPercentile(listRankPercentile(rank, listCount));
}

export function convictionTierFromSignalAverage(avg: number): ConvictionTier {
  const pct = avg * 100;
  if (pct >= 78) return "elite";
  if (pct >= 62) return "strong";
  if (pct >= 48) return "rising";
  return "mixed";
}

export function rankContext(
  item: RankingItem,
  items: RankingItem[],
): { rankLabel: string; subtitle: string } {
  const rank = item.rank;
  if (rank === 1) {
    return { rankLabel: "#1", subtitle: "Top pick today" };
  }
  const leader = items.find((i) => i.rank === 1) ?? items[0];
  if (!leader?.final_score || leader.final_score <= 0) {
    return { rankLabel: `#${rank}`, subtitle: "In today's leaders" };
  }
  const ratio = Math.min(1, item.final_score / leader.final_score);
  const pct = Math.round(ratio * 100);
  let label: string;
  if (ratio >= 0.97) label = "Close contender";
  else if (ratio >= 0.88) label = "Competitive";
  else if (ratio >= 0.75) label = "Trailing leader";
  else label = "Building vs leader";

  return {
    rankLabel: `#${rank}`,
    subtitle: `${label} · ${pct}% of leader strength`,
  };
}

export function regimeCompactInsight(
  regimeId: string | null | undefined,
): RegimeCompact {
  const narrative = regimeNarrative(regimeId);
  const id = (regimeId ?? "").toLowerCase();
  let impact = narrative.signalImpact;
  if (id.includes("chop")) {
    impact = "Confirmation matters more than usual.";
  } else if (id.includes("risk_off")) {
    impact = "Momentum signals are less reliable.";
  } else if (id.includes("high_vol")) {
    impact = "Whipsaw risk is elevated — require strong confirmation.";
  } else if (id === "risk_on_trend") {
    impact = "Momentum signals historically perform well.";
  }
  return { title: narrative.title, impact };
}

export function portfolioRole(
  rank: number,
  listCount: number,
  inPortfolio: boolean,
  listTier: ConvictionTier,
  regimeId: string | null | undefined,
): string | null {
  const regime = (regimeId ?? "").toLowerCase();
  if (inPortfolio && rank <= 3) return "Core momentum holding";
  if (inPortfolio) return "Held in model portfolio";
  if (rank <= 3 && (listTier === "elite" || listTier === "strong")) {
    return "Prime portfolio candidate";
  }
  if (rank <= 8 && listTier !== "mixed") return "Watchlist candidate";
  if (regime.includes("risk_off")) return "Defensive research only";
  if (regime.includes("chop") && rank > 5) {
    return "Satellite opportunity — confirm first";
  }
  if (rank <= listCount / 2) return "Research candidate";
  return null;
}

function confirmationsToWatch(
  intel: PatternIntelligence | null | undefined,
  segments: ScoreBreakdownSegment[],
  gaps: InsightLine[],
): InsightLine[] {
  const items: InsightLine[] = [];
  const seen = new Set<string>();

  const add = (id: string, label: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    items.push({ id, label });
  };

  for (const gap of gaps) {
    if (gap.id.includes("breakout") || gap.id === "high") {
      add("breakout", "Break above recent high");
      add("high20", "New 20-day high");
    }
    if (gap.id.includes("vol")) {
      add("vol15", "Relative volume above 1.5×");
    }
    if (gap.id.includes("pattern")) {
      add("pattern", "Pattern confirmation on next session");
    }
    if (gap.id.includes("trend")) {
      add("trend", "Hold trend alignment vs SPY");
    }
    if (gap.id.includes("relative") || gap.id.includes("rs")) {
      add("rs", "Sustain relative strength vs SPY");
    }
  }

  const tc = intel?.trendContext;
  if (tc?.aboveSma50 === false) {
    add("sma50", "Reclaim and hold above SMA50");
  }
  if (tc?.volRatio20d != null && tc.volRatio20d < 1.5) {
    add("vol15b", "Relative volume above 1.5×");
  }

  const breakoutSeg = segments.find((s) => s.key === "breakout");
  if (breakoutSeg && contributionTier(breakoutSeg.value) !== "strong") {
    add("breakout2", "Break above recent high");
  }

  return items.slice(0, 4);
}

function regimeMissingLine(regimeId: string | null | undefined): string | null {
  const id = (regimeId ?? "").toLowerCase();
  if (id.includes("chop")) return "Choppy market regime";
  if (id.includes("risk_off")) return "Risk-off market regime";
  if (id.includes("high_vol")) return "High-volatility regime";
  return null;
}

function joinNatural(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
}

function rankPositionPhrase(rank: number, listCount: number): string {
  if (rank === 1) return "at the top of today's universe";
  const pct = listRankPercentile(rank, listCount);
  if (pct >= 90) return "near the top of the universe";
  if (pct >= 70) return "among today's leading setups";
  if (pct >= 45) return "in the upper tier of today's list";
  return `at #${rank} on today's list`;
}

function supportVerb(count: number): string {
  if (count >= 3) return "are all strong";
  if (count === 2) return "are both supportive";
  return "is the stand-out input";
}

function factorPhrasesForThesis(
  strengths: InsightLine[],
  segments: ScoreBreakdownSegment[],
  patternLabel: string | undefined,
  intel: PatternIntelligence | null | undefined,
): string[] {
  const phrases = strengths.slice(0, 3).map((s) => softenForReason(s.label));

  if (phrases.length === 0) {
    const ordered = [...segments].sort((a, b) => b.value - a.value);
    for (const seg of ordered) {
      if (seg.tier === "strong" || seg.tier === "moderate") {
        phrases.push(softenForReason(seg.label));
        if (phrases.length >= 3) break;
      }
    }
  }

  if (
    patternLabel &&
    (intel?.scores.patternStrength ?? 0) >= 0.55 &&
    !phrases.some((p) => p.includes("pattern"))
  ) {
    phrases.push(`${patternLabel.toLowerCase()} pattern support`);
  }

  return phrases.slice(0, 3);
}

function missingPiecePhrase(gap: InsightLine): string {
  const id = gap.id;
  if (id.includes("pattern")) return "pattern confirmation";
  if (id.includes("breakout") || id === "high") return "breakout confirmation";
  if (id.includes("vol")) return "volume confirmation";
  if (id.includes("trend")) return "trend alignment";
  if (id.includes("relative")) return "relative strength versus the market";
  if (id === "sma50") return "a sustained hold above SMA50";
  return softenForReason(gap.label).replace(/^no /i, "");
}

function weakestFactorPhrase(
  segments: ScoreBreakdownSegment[],
): string | null {
  const weak = [...segments]
    .filter((s) => s.tier === "weak" || s.tier === "missing")
    .sort((a, b) => a.value - b.value);
  const seg = weak[0];
  if (!seg) return null;

  const byKey: Record<string, string> = {
    pattern: "pattern confirmation",
    breakout: "breakout confirmation",
    volume: "volume confirmation",
    trend: "trend alignment",
    relative_strength: "relative strength versus the market",
  };
  return byKey[seg.key] ?? `confirmation on ${seg.label.toLowerCase()}`;
}

function strengthenFurtherNeeds(
  gaps: InsightLine[],
  confirmations: InsightLine[],
  segments: ScoreBreakdownSegment[],
): string[] {
  const needs: string[] = [];
  const seen = new Set<string>();
  const add = (phrase: string) => {
    if (seen.has(phrase)) return;
    seen.add(phrase);
    needs.push(phrase);
  };

  for (const g of gaps.filter((x) => x.id !== "regime")) {
    if (g.id.includes("pattern")) add("bullish pattern signal");
    else if (g.id.includes("breakout") || g.id === "high") add("confirmed breakout");
    else if (g.id.includes("vol")) add("stronger volume confirmation");
    else if (g.id.includes("trend")) add("sustained trend alignment");
    else if (g.id === "sma50") add("hold above SMA50");
  }

  if (needs.length === 0) {
    for (const c of confirmations.slice(0, 2)) {
      const l = c.label.toLowerCase();
      if (l.includes("breakout") || l.includes("high")) add("confirmed breakout");
      else if (l.includes("pattern")) add("bullish pattern signal");
      else if (l.includes("volume")) add("stronger volume confirmation");
      else if (l.includes("sma50")) add("hold above SMA50");
    }
  }

  if (needs.length === 0) {
    const weak = weakestFactorPhrase(segments);
    if (weak === "pattern confirmation") add("bullish pattern signal");
    else if (weak === "breakout confirmation") add("confirmed breakout");
    else if (weak?.includes("volume")) add("stronger volume confirmation");
    else if (weak?.includes("trend")) add("sustained trend alignment");
  }

  return needs.slice(0, 2);
}

function formatStrengthenNeeds(needs: string[]): string {
  const withArticle = needs.map((n) => (n.startsWith("a ") ? n : `a ${n}`));
  if (withArticle.length >= 2) {
    const second = withArticle[1].replace(/^a /, "");
    return `${withArticle[0]} or ${second}`;
  }
  if (withArticle.length === 1) return withArticle[0];
  return "follow-through on the next session";
}

function buildStrengthenSentence(
  rank: number,
  listCount: number,
  factors: string[],
  gaps: InsightLine[],
  confirmations: InsightLine[],
  segments: ScoreBreakdownSegment[],
): string {
  const needs = strengthenFurtherNeeds(gaps, confirmations, segments);
  const formatted = formatStrengthenNeeds(needs);
  const favorable =
    listRankPercentile(rank, listCount) >= 70 && factors.length >= 2;

  if (favorable) {
    return `Momentum remains favorable, but the setup would strengthen further with ${formatted}.`;
  }
  return `The setup would strengthen further with ${formatted}.`;
}

function buildThesis(params: {
  sym: string;
  rank: number;
  listCount: number;
  strengths: InsightLine[];
  gaps: InsightLine[];
  segments: ScoreBreakdownSegment[];
  patternLabel: string | undefined;
  intel: PatternIntelligence | null | undefined;
}): string {
  const { sym, rank, listCount, strengths, gaps, segments, patternLabel, intel } =
    params;

  const factors = factorPhrasesForThesis(
    strengths,
    segments,
    patternLabel,
    intel,
  );
  const position = rankPositionPhrase(rank, listCount);
  const sentences: string[] = [];

  if (factors.length > 0) {
    sentences.push(
      `${sym} ranks ${position} because ${joinNatural(factors)} ${supportVerb(factors.length)}.`,
    );
  } else {
    sentences.push(
      `${sym} ranks ${position} on today's composite momentum screen.`,
    );
  }

  const signalGaps = gaps.filter((g) => g.id !== "regime");
  const missing =
    signalGaps.length > 0
      ? missingPiecePhrase(signalGaps[0])
      : weakestFactorPhrase(segments);

  if (missing) {
    sentences.push(`The primary missing piece is ${missing}.`);
  }

  const confirmations = confirmationsToWatch(intel, segments, gaps);
  sentences.push(
    buildStrengthenSentence(
      rank,
      listCount,
      factors,
      gaps,
      confirmations,
      segments,
    ),
  );

  return sentences.slice(0, 4).join(" ");
}

function softenForReason(label: string): string {
  return label
    .replace(/^Strong /i, "")
    .replace(/^Trend alignment$/i, "trend alignment")
    .replace(/^Volume confirmation$/i, "volume confirmation")
    .replace(/^Pattern confirmation$/i, "pattern confirmation")
    .toLowerCase();
}

function capitalizeReason(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function buildDecisionSummary(
  listTier: ConvictionTier,
  supports: InsightLine[],
  confirmations: InsightLine[],
  gaps: InsightLine[],
): DecisionSummary {
  const headline =
    listTier === "elite" || listTier === "strong"
      ? "Worth investigating today"
      : listTier === "rising"
        ? "Worth a look if confirmations develop"
        : "Lower priority today";

  const reasons: string[] = [];
  if (supports.length >= 2) {
    reasons.push(
      `${softenForReason(supports[0].label)} and ${softenForReason(supports[1].label)}.`,
    );
  } else if (supports.length === 1) {
    reasons.push(`${softenForReason(supports[0].label)}.`);
  }

  if (confirmations.length > 0) {
    const watch = confirmations[0].label.toLowerCase();
    reasons.push(
      watch.startsWith("await") ? watch : `Await ${watch}.`,
    );
  } else if (gaps.length > 0) {
    reasons.push(`${gaps[0].label.replace(/\.$/, "")}.`);
  }

  if (reasons.length === 0) {
    reasons.push("Review contribution bars before acting.");
  }

  return {
    headline,
    reasons: reasons.slice(0, 2).map(capitalizeReason),
  };
}

export function buildMoverResearchInsight(params: {
  symbol: string;
  intel: PatternIntelligence | null | undefined;
  segments: ScoreBreakdownSegment[];
  regimeId: string | null | undefined;
  rank: number;
  listCount: number;
  inPortfolio: boolean;
}): MoverResearchInsight {
  const { symbol, intel, segments, regimeId, rank, listCount, inPortfolio } =
    params;
  const sym = symbol.toUpperCase();
  const { strengths, gaps } = strengthsAndGaps(intel, segments);
  const listTier = convictionTierFromListRank(rank, listCount);
  const patternLabel = intel?.primaryPattern?.label;

  const supports = strengths.slice(0, 5);
  const missing: InsightLine[] = gaps.slice(0, 4).map((g) => ({
    id: g.id,
    label: g.label,
  }));
  const regimeLine = regimeMissingLine(regimeId);
  if (regimeLine) {
    missing.push({ id: "regime", label: regimeLine });
  }

  const confirmations = confirmationsToWatch(intel, segments, gaps);

  return {
    thesis: buildThesis({
      sym,
      rank,
      listCount,
      strengths,
      gaps,
      segments,
      patternLabel,
      intel,
    }),
    supports,
    missing: missing.slice(0, 5),
    confirmations,
    decisionSummary: buildDecisionSummary(
      listTier,
      supports,
      confirmations,
      gaps,
    ),
    regimeCompact: regimeCompactInsight(regimeId),
    portfolioRole: portfolioRole(
      rank,
      listCount,
      inPortfolio,
      listTier,
      regimeId,
    ),
  };
}
