import type { MomentumBreakoutAlertDto } from "@/app/types/momentumBreakoutAlerts";
import type { MomentumBreakoutScanCandidateDto } from "@/app/types/momentumBreakoutScan";
import type { MomentumBreakoutScanResponse } from "@/app/types/momentumBreakoutScan";
import type { PaperTradeSummary } from "@/app/types/momentumBreakoutPaperPerformance";
import {
  filterRiskGateReasons,
  formatProfitFactor,
  formatWinRate,
  humanizeAlertRiskReason,
  riskGateTone,
} from "@/lib/momentumBreakoutAlertUi";

export const MB_WATCHLIST_SECTION_ID = "mb-watchlist-section";

export function mbAlertElementId(symbol: string): string {
  return `mb-alert-${symbol.toUpperCase()}`;
}

/** Matches server defaults in momentum_breakout_scan_models.py */
export const TRADABLE_THRESHOLDS = {
  minHistoricalProfitFactor: 1.2,
  minHistoricalTrades: 20,
  maxStopDistancePct: 8,
} as const;

export type MarketStatusTone = "favorable" | "mixed" | "cautious" | "unknown";

export type StrategyTrackRecord = {
  winRate: number | null;
  profitFactor: number | null;
  tradesStudied: number | null;
};

export type HeroVerdict = {
  title: string;
  body: string;
  stocksScanned: number;
  opportunitiesReviewed: number;
  opportunitiesRejected: number;
  opportunitiesApproved: number;
  lastScanLabel: string | null;
  tone: MarketStatusTone;
};

export type AlertVerdictKind = "Approved" | "Caution" | "Rejected" | "Completed";

export type AlertVerdict = {
  kind: AlertVerdictKind;
  explanation: string;
};

export function isTradableScanCandidate(
  candidate: MomentumBreakoutScanCandidateDto,
): boolean {
  if (!candidate.riskGate.allowed) return false;
  const pf = candidate.historicalProfitFactor;
  if (pf === null || pf < TRADABLE_THRESHOLDS.minHistoricalProfitFactor) {
    return false;
  }
  const trades = candidate.historicalTotalTrades;
  if (trades === null || trades < TRADABLE_THRESHOLDS.minHistoricalTrades) {
    return false;
  }
  if (candidate.stopDistancePct > TRADABLE_THRESHOLDS.maxStopDistancePct) {
    return false;
  }
  return true;
}

export function partitionScanCandidates(scan: MomentumBreakoutScanResponse | null): {
  tradable: MomentumBreakoutScanCandidateDto[];
  blocked: MomentumBreakoutScanCandidateDto[];
} {
  if (!scan) return { tradable: [], blocked: [] };
  const tradable: MomentumBreakoutScanCandidateDto[] = [];
  const blocked: MomentumBreakoutScanCandidateDto[] = [];
  for (const candidate of scan.candidates) {
    if (isTradableScanCandidate(candidate)) {
      tradable.push(candidate);
    } else {
      blocked.push(candidate);
    }
  }
  return { tradable, blocked };
}

function humanizeRiskReason(reason: string): string | null {
  const lower = reason.toLowerCase();
  if (lower.includes("neutral")) {
    return "The broad market looks uncertain right now.";
  }
  if (lower.includes("max open positions")) {
    return "You already have several similar plans being tracked.";
  }
  if (lower.includes("consecutive") && lower.includes("loss")) {
    return "Recent similar plans finished with losses.";
  }
  if (lower.includes("drawdown")) {
    return "Recent results for this strategy have been weak.";
  }
  if (lower.includes("volume") || lower.includes("climax")) {
    return "Today's volume looks unusually high, which can be risky.";
  }
  if (lower.includes("mega") || lower.includes("correlation")) {
    return "You may already have enough exposure to big tech names.";
  }
  if (lower.includes("circuit breaker")) {
    return "Safety rules paused new alerts after a string of losses.";
  }
  return null;
}

export function explainRejectedOpportunity(
  candidate: MomentumBreakoutScanCandidateDto,
): string[] {
  const reasons: string[] = [];

  if (!candidate.riskGate.allowed) {
    for (const raw of filterRiskGateReasons(candidate.riskGate.reasons)) {
      const plain = humanizeRiskReason(raw);
      if (plain) reasons.push(plain);
    }
    if (reasons.length === 0) {
      reasons.push("Did not pass our safety checks.");
    }
  }

  const pf = candidate.historicalProfitFactor;
  if (pf === null || pf < TRADABLE_THRESHOLDS.minHistoricalProfitFactor) {
    const label =
      pf === null
        ? "Historical performance was weak (insufficient data)"
        : `Historical performance was weak (PF ${pf.toFixed(2)})`;
    reasons.push(label);
  }

  const trades = candidate.historicalTotalTrades;
  if (trades === null || trades < TRADABLE_THRESHOLDS.minHistoricalTrades) {
    reasons.push(
      `Not enough past examples on this stock (${trades ?? 0} studied, ${TRADABLE_THRESHOLDS.minHistoricalTrades} required)`,
    );
  }

  if (candidate.stopDistancePct > TRADABLE_THRESHOLDS.maxStopDistancePct) {
    reasons.push(
      `Stop distance was too wide (${candidate.stopDistancePct.toFixed(0)}%)`,
    );
  }

  return [...new Set(reasons)];
}

export function marketConditionsPhrase(tone: MarketStatusTone): string {
  switch (tone) {
    case "favorable":
      return "supportive";
    case "cautious":
      return "cautious";
    case "mixed":
      return "mixed";
    default:
      return "unclear";
  }
}

export function deriveMarketTone(
  scan: MomentumBreakoutScanResponse | null,
): MarketStatusTone {
  if (!scan || scan.candidates.length === 0) return "unknown";

  const counts = new Map<string, number>();
  for (const c of scan.candidates) {
    const key = (c.marketRegime ?? "UNKNOWN").toUpperCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const regime = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "UNKNOWN";

  switch (regime) {
    case "RISK_ON":
    case "BULL":
      return "favorable";
    case "RISK_OFF":
    case "BEAR":
      return "cautious";
    default:
      return "mixed";
  }
}

export function formatScanTimestamp(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function buildHeroVerdict(
  scan: MomentumBreakoutScanResponse | null,
  tradable: MomentumBreakoutScanCandidateDto[],
  blocked: MomentumBreakoutScanCandidateDto[],
  loading: boolean,
): HeroVerdict {
  const tone = deriveMarketTone(scan);
  const conditions = marketConditionsPhrase(tone);

  if (loading && !scan) {
    return {
      title: "Loading today's scan…",
      body: "We're checking the market for breakout opportunities.",
      stocksScanned: 0,
      opportunitiesReviewed: 0,
      opportunitiesRejected: 0,
      opportunitiesApproved: 0,
      lastScanLabel: null,
      tone: "unknown",
    };
  }

  if (!scan) {
    return {
      title: "Today's scan unavailable",
      body: "We couldn't load the latest market scan. Try refreshing in a moment.",
      stocksScanned: 0,
      opportunitiesReviewed: 0,
      opportunitiesRejected: 0,
      opportunitiesApproved: 0,
      lastScanLabel: null,
      tone: "unknown",
    };
  }

  const reviewed = scan.validSetupsFound;
  const rejectedCount =
    scan.blockedCandidatesCount > 0
      ? scan.blockedCandidatesCount
      : blocked.length;
  const approved = tradable.length;

  if (approved > 0) {
    const noun = approved === 1 ? "Opportunity" : "Opportunities";
    return {
      title: `${approved} Trade ${noun} Today`,
      body: `Market conditions are ${conditions}. ${approved} breakout ${approved === 1 ? "opportunity passed" : "opportunities passed"} our quality and risk requirements.`,
      stocksScanned: scan.totalSymbolsScanned,
      opportunitiesReviewed: reviewed,
      opportunitiesRejected: rejectedCount,
      opportunitiesApproved: approved,
      lastScanLabel: formatScanTimestamp(scan.scanTime),
      tone,
    };
  }

  return {
    title: "No Trade Opportunities Today",
    body: `Market conditions are ${conditions}, but none of today's breakout opportunities passed our quality and risk requirements.`,
    stocksScanned: scan.totalSymbolsScanned,
    opportunitiesReviewed: reviewed,
    opportunitiesRejected: rejectedCount,
    opportunitiesApproved: 0,
    lastScanLabel: formatScanTimestamp(scan.scanTime),
    tone,
  };
}

export function deriveStrategyTrackRecordFromScan(
  scan: MomentumBreakoutScanResponse | null,
): StrategyTrackRecord | null {
  if (!scan || scan.candidates.length === 0) return null;

  let tradeWeight = 0;
  let winSum = 0;
  let pfSum = 0;
  let pfWeight = 0;

  for (const c of scan.candidates) {
    const t = c.historicalTotalTrades ?? 0;
    if (t <= 0) continue;
    tradeWeight += t;
    if (c.historicalWinRate != null) {
      const wr =
        c.historicalWinRate <= 1
          ? c.historicalWinRate
          : c.historicalWinRate / 100;
      winSum += wr * t;
    }
    if (c.historicalProfitFactor != null) {
      pfSum += c.historicalProfitFactor * t;
      pfWeight += t;
    }
  }

  if (tradeWeight === 0) return null;
  return {
    winRate: winSum > 0 ? winSum / tradeWeight : null,
    profitFactor: pfWeight > 0 ? pfSum / pfWeight : null,
    tradesStudied: tradeWeight,
  };
}

export function deriveStrategyTrackRecord(
  paperSummary: PaperTradeSummary | null | undefined,
  scan: MomentumBreakoutScanResponse | null,
): StrategyTrackRecord | null {
  if (paperSummary && paperSummary.totalAlerts > 0) {
    return {
      winRate: paperSummary.winRate,
      profitFactor: paperSummary.profitFactor,
      tradesStudied: paperSummary.totalAlerts,
    };
  }
  return deriveStrategyTrackRecordFromScan(scan);
}

export function formatRegimeForInvestors(regime: string | null | undefined): string {
  switch ((regime ?? "").toUpperCase()) {
    case "RISK_ON":
    case "BULL":
      return "Supportive trend";
    case "RISK_OFF":
    case "BEAR":
      return "Cautious trend";
    case "NEUTRAL":
      return "Mixed trend";
    default:
      return "Trend unclear";
  }
}

export function deriveAlertVerdict(alert: MomentumBreakoutAlertDto): AlertVerdict {
  switch (alert.status) {
    case "TARGET_HIT":
      return {
        kind: "Completed",
        explanation: "Target price was reached.",
      };
    case "STOP_HIT":
      return {
        kind: "Completed",
        explanation: "Stop price was reached.",
      };
    case "EXPIRED":
      return {
        kind: "Completed",
        explanation: "This plan expired before completing.",
      };
    case "CANCELLED":
      return {
        kind: "Completed",
        explanation: "You stopped tracking this plan.",
      };
    default:
      break;
  }

  const tone = riskGateTone(alert.riskGateAction);
  const reasons = filterRiskGateReasons(alert.riskGateReasons).map(
    humanizeAlertRiskReason,
  );

  if (tone === "blocked") {
    return {
      kind: "Rejected",
      explanation:
        reasons[0] ?? "Did not pass our quality and safety requirements.",
    };
  }

  if (tone === "warning" || tone === "caution") {
    return {
      kind: "Caution",
      explanation:
        reasons[0] ?? "Passed core checks, but proceed carefully.",
    };
  }

  return {
    kind: "Approved",
    explanation: "Passed quality and risk checks.",
  };
}

export function formatTrackRecordDisplay(
  record: StrategyTrackRecord,
): { winRate: string; profitFactor: string; tradesStudied: string } {
  return {
    winRate: formatWinRate(record.winRate),
    profitFactor: formatProfitFactor(record.profitFactor),
    tradesStudied:
      record.tradesStudied != null ? String(record.tradesStudied) : "—",
  };
}

/** @deprecated Use explainRejectedOpportunity */
export function explainWhyBlocked(
  candidate: MomentumBreakoutScanCandidateDto,
): string[] {
  return explainRejectedOpportunity(candidate);
}
