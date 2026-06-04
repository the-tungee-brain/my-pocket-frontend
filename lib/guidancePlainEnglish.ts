import type { PositionGuidanceItem, SymbolThesis } from "@/app/types/positionGuidance";
import type { DedupedDriver, DriverCategory } from "@/lib/guidanceScoringContributors";
import {
  humanizeRegimeId,
  isOptionKind,
} from "@/lib/guidanceScoringContributors";

/** Future: set true to show raw scoring labels/points (engineers only). */
export const SHOW_RAW_SCORES = false;

const THESIS_PHRASE: Record<SymbolThesis, string> = {
  BULLISH: "Overall outlook is bullish",
  NEUTRAL: "Overall outlook is neutral",
  BEARISH: "Overall outlook is bearish",
};

const MAX_SUPPORTING_POINTS = 2;

export type UrgencyLevel = "low" | "moderate" | "high" | "very_high";

export type PositionPlainEnglish = {
  mainReason: string | null;
  supportingPoints: string[];
};

/** Presentation-only mapping from engine urgency score (0–100). */
export function urgencyQualitativeLabel(urgency: number): string {
  const level = urgencyLevel(urgency);
  switch (level) {
    case "low":
      return "Low urgency";
    case "moderate":
      return "Moderate urgency";
    case "high":
      return "High urgency";
    case "very_high":
      return "Very high urgency";
  }
}

export function urgencyLevel(urgency: number): UrgencyLevel {
  if (urgency >= 80) return "very_high";
  if (urgency >= 55) return "high";
  if (urgency >= 30) return "moderate";
  return "low";
}

function profitLossMainReason(item: PositionGuidanceItem): string | null {
  const pct = item.openProfitLossPct;
  if (pct == null) return null;

  const subject = isOptionKind(item.positionKind) ? "option" : "stock";
  const absPct = Math.abs(pct);
  const amount =
    absPct >= 10 ? String(Math.round(absPct)) : absPct.toFixed(1);

  if (pct <= -5) {
    return `The ${subject} is down ~${amount}% from entry`;
  }
  if (pct >= 5) {
    return `The ${subject} is up ~${amount}% from entry`;
  }
  return `The ${subject} is near breakeven`;
}

function tradeQualityPhrase(score: number): string {
  if (score >= 60) return "Trade setup looks favorable";
  if (score >= 40) return "Trade setup is mixed";
  return "Trade setup looks weak";
}

function regimePhrase(regimeId: string): string {
  const id = regimeId.toLowerCase();
  if (id.includes("chop")) {
    return "Market is choppy with no clear trend";
  }
  if (id.includes("risk_on") || id.includes("risk on")) {
    return "Market regime supports risk-taking";
  }
  if (id.includes("risk_off") || id.includes("risk off")) {
    return "Market regime favors caution";
  }
  return `Market regime is ${humanizeRegimeId(regimeId).toLowerCase()}`;
}

function normalizeForDedupe(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function dedupeSentences(sentences: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of sentences) {
    const key = normalizeForDedupe(s);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

function plainEnglishFromLabel(
  rawLabel: string,
  category: DriverCategory,
  semanticKey: string,
): string | null {
  const label = rawLabel.toLowerCase();
  const key = semanticKey.toUpperCase();

  if (label.includes("trade quality") || key === "TREND_DETERIORATION") {
    if (label.includes("pressure") || label.includes("weak")) {
      return "Technical conditions have weakened";
    }
    return "Technical and trade-quality signals are soft";
  }

  if (category === "regime" || label.includes("regime") || key === "UNFAVORABLE_REGIME") {
    if (label.includes("neutral") || label.includes("chop")) {
      return "Market regime is neutral";
    }
    if (label.includes("bear") || label.includes("risk off")) {
      return "Market backdrop is cautious";
    }
    if (label.includes("bull") || label.includes("risk on")) {
      return "Market backdrop is supportive";
    }
    return "Market regime is working against this position";
  }

  if (
    label.includes("relative strength") ||
    key === "WEAKENING_RELATIVE_STRENGTH"
  ) {
    return "The stock is lagging the broader market";
  }

  if (label.includes("volume") || label.includes("momentum")) {
    return "Momentum and volume trends have weakened";
  }

  if (
    category === "concentration" ||
    label.includes("portfolio weight") ||
    key === "EXCESSIVE_CONCENTRATION"
  ) {
    if (label.includes("very high") || label.includes("elevated")) {
      return "This position is a large part of your portfolio";
    }
    return "Position size adds portfolio risk";
  }

  if (
    label.includes("unrealized loss") ||
    label.includes("drawdown") ||
    key === "LARGE_DRAWDOWN"
  ) {
    return null;
  }

  if (label.includes("assignment") || key === "ASSIGNMENT_RISK") {
    return "Assignment risk is elevated";
  }

  if (
    label.includes("expiration") ||
    label.includes("days to expiration") ||
    label.includes("theta") ||
    key === "THETA_DECAY"
  ) {
    return "Time decay will continue to reduce option value";
  }

  if (label.includes("thesis conflict") || key === "THESIS_CONFLICT") {
    return "Position conflicts with the symbol outlook";
  }

  if (label.includes("earnings") || key === "EARNINGS_RISK") {
    return "Earnings timing adds uncertainty";
  }

  if (label.includes("alert")) {
    return "Recent alerts flag added risk";
  }

  if (label.includes("moneyness")) {
    return "Strike distance affects outcome risk";
  }

  return null;
}

/** Maps one scoring driver to retail-friendly language (no scores/IDs). */
export function plainEnglishFromDriver(driver: DedupedDriver): string | null {
  return plainEnglishFromLabel(driver.label, driver.category, driver.semanticKey);
}

function fallbackFromPrimaryDriver(item: PositionGuidanceItem): string | null {
  const label = item.primaryDriver?.label?.trim();
  if (!label) return null;
  const mapped = plainEnglishFromLabel(
    label,
    driverCategoryFromCode(item.primaryDriver?.code),
    (item.primaryDriver?.code ?? "").toUpperCase(),
  );
  return mapped ?? sanitizePrimaryReason(item.primaryReason);
}

function driverCategoryFromCode(code?: string): DriverCategory {
  if (!code) return "other";
  const c = code.toUpperCase();
  if (c === "EXCESSIVE_CONCENTRATION") return "concentration";
  if (c === "UNFAVORABLE_REGIME" || c === "THESIS_CONFLICT") return "regime";
  if (c === "LARGE_DRAWDOWN" || c === "ASSIGNMENT_RISK") {
    return "pnl_assignment";
  }
  if (c === "THETA_DECAY") {
    return "technical";
  }
  if (
    c === "TREND_DETERIORATION" ||
    c === "WEAKENING_RELATIVE_STRENGTH" ||
    c === "EARNINGS_RISK"
  ) {
    return "technical";
  }
  return "other";
}

/** Strip engine-style prefixes and numbers from primaryReason. */
function sanitizePrimaryReason(reason: string): string | null {
  const text = reason
    .replace(/^[^:]+:\s*/i, "")
    .replace(/\d+(\.\d+)?%?/g, "")
    .replace(/\s*\/\s*100/g, "")
    .replace(/risk_on_chop/gi, "choppy market")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!text || text.length < 8) return null;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function pickMainReason(
  item: PositionGuidanceItem,
  drivers: DedupedDriver[],
  mapped: string[],
): string | null {
  const top = drivers[0];
  const pnlPhrase = profitLossMainReason(item);

  if (top?.category === "pnl_assignment" && pnlPhrase) {
    return pnlPhrase;
  }

  if (pnlPhrase && top && drivers.every((d) => d.category === "pnl_assignment")) {
    return pnlPhrase;
  }

  if (mapped[0]) return mapped[0];

  if (pnlPhrase && (top?.category === "pnl_assignment" || !top)) {
    return pnlPhrase;
  }

  return fallbackFromPrimaryDriver(item) ?? sanitizePrimaryReason(item.primaryReason);
}

export function buildPositionPlainEnglish(
  item: PositionGuidanceItem,
  drivers: DedupedDriver[],
): PositionPlainEnglish {
  const mapped = dedupeSentences(
    drivers
      .map(plainEnglishFromDriver)
      .filter((s): s is string => !!s),
  );

  const mainReason = pickMainReason(item, drivers, mapped);

  if (!mainReason) {
    return { mainReason: null, supportingPoints: [] };
  }

  const mainNorm = normalizeForDedupe(mainReason);
  const supportingPoints = dedupeSentences(mapped)
    .filter((p) => normalizeForDedupe(p) !== mainNorm)
    .slice(0, MAX_SUPPORTING_POINTS);

  return { mainReason, supportingPoints };
}

export function formatSymbolThesisPlainEnglish(
  thesis: {
    thesis: SymbolThesis;
    regimeId?: string | null;
    tradeQualityScore?: number | null;
  },
  options: {
    hasRegimeInPositions: boolean;
    hasTradeQualityInPositions: boolean;
  },
): string {
  const parts: string[] = [THESIS_PHRASE[thesis.thesis]];

  if (thesis.regimeId && !options.hasRegimeInPositions) {
    parts.push(regimePhrase(thesis.regimeId));
  }
  if (
    thesis.tradeQualityScore != null &&
    !options.hasTradeQualityInPositions
  ) {
    parts.push(tradeQualityPhrase(thesis.tradeQualityScore));
  }

  return parts.join(" · ");
}
