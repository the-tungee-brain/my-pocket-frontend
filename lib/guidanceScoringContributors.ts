import type {
  PositionGuidanceItem,
  PositionKind,
  ScoringContributor,
  SymbolPositionGuidance,
  SymbolThesis,
} from "@/app/types/positionGuidance";

export const TOP_DRIVERS_MAX = 3;
const CONCENTRATION_MIN_PCT = 20;
const THETA_MAX_DTE = 21;

export type DriverCategory =
  | "concentration"
  | "pnl_assignment"
  | "regime"
  | "technical"
  | "other";

export type DedupedDriver = {
  /** Verbatim scoring-engine label (atomic, score-linked). */
  label: string;
  points: number;
  category: DriverCategory;
  semanticKey: string;
  portfolioLevel: boolean;
};

const THESIS_LABEL: Record<SymbolThesis, string> = {
  BULLISH: "Bullish",
  NEUTRAL: "Neutral",
  BEARISH: "Bearish",
};

const EQUITY_ONLY_BUCKETS = new Set([
  "regime",
  "technical",
  "relative_strength",
  "volume",
  "concentration",
]);

const OPTION_ONLY_BUCKETS = new Set([
  "theta",
  "assignment",
  "moneyness",
]);

export function isEquityKind(kind: PositionKind): boolean {
  return kind === "EQUITY_LONG";
}

export function isOptionKind(kind: PositionKind): boolean {
  return kind !== "EQUITY_LONG";
}

/** Only contributors from scoring output — no inferred primary/secondary drivers. */
export function rankedScoringContributors(
  item: PositionGuidanceItem,
): ScoringContributor[] {
  if (!item.scoringContributors?.length) {
    return [];
  }
  return [...item.scoringContributors].sort((a, b) => b.points - a.points);
}

export function driverCategory(c: ScoringContributor): DriverCategory {
  const code = (c.driverCode ?? "").toUpperCase();
  const bucket = c.bucket.toLowerCase();
  const label = (c.label ?? "").toLowerCase();

  if (
    code === "EXCESSIVE_CONCENTRATION" ||
    bucket === "concentration" ||
    label.includes("concentration") ||
    label.includes("portfolio weight")
  ) {
    return "concentration";
  }
  if (
    bucket === "unrealized_loss" ||
    bucket === "assignment" ||
    code === "LARGE_DRAWDOWN" ||
    code === "ASSIGNMENT_RISK" ||
    label.includes("assignment") ||
    label.includes("unrealized loss")
  ) {
    return "pnl_assignment";
  }
  if (
    bucket === "regime" ||
    code === "UNFAVORABLE_REGIME" ||
    label.includes("regime")
  ) {
    return "regime";
  }
  if (
    bucket === "technical" ||
    bucket === "theta" ||
    bucket === "relative_strength" ||
    bucket === "volume" ||
    bucket === "moneyness" ||
    bucket === "thesis" ||
    code === "TREND_DETERIORATION" ||
    code === "THETA_DECAY" ||
    code === "THESIS_CONFLICT" ||
    label.includes("trade quality") ||
    label.includes("theta") ||
    label.includes("expiration") ||
    label.includes("days to expiration")
  ) {
    return "technical";
  }
  return "other";
}

/** Verbatim scoring-engine label; empty means not displayable. */
export function contributorScoringLabel(c: ScoringContributor): string {
  return c.label?.trim() ?? "";
}

export function isEquityMacroContributor(c: ScoringContributor): boolean {
  const bucket = c.bucket.toLowerCase();
  if (bucket === "relative_strength") return true;
  const cat = driverCategory(c);
  return cat === "regime" || cat === "technical";
}

export function isPortfolioLevelDriver(c: ScoringContributor): boolean {
  if (driverCategory(c) === "concentration") return true;
  const label = contributorScoringLabel(c).toLowerCase();
  return (
    label.includes("overweight") ||
    label.includes("portfolio weight") ||
    label.includes("sizing risk")
  );
}

export function semanticDriverKey(c: ScoringContributor): string {
  if (c.driverCode?.trim()) {
    return c.driverCode.trim().toUpperCase();
  }
  let head = (c.label || c.bucket).trim().toLowerCase();
  head = head.split(/\s*[—–-]\s*/)[0] ?? head;
  head = head
    .replace(/\b\d+(\.\d+)?%?\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return head || c.bucket.toLowerCase();
}

function sortByPointsDesc(drivers: DedupedDriver[]): DedupedDriver[] {
  return [...drivers].sort((a, b) => b.points - a.points);
}

function concentrationPctFromLabel(label: string): number | null {
  const match = label.match(/(\d+(?:\.\d+)?)\s*%/);
  return match ? parseFloat(match[1]!) : null;
}

function daysToExpiration(item: PositionGuidanceItem): number | null {
  if (item.expiration) {
    const iso = item.expiration.includes("T")
      ? item.expiration
      : `${item.expiration}T00:00:00`;
    const exp = new Date(iso);
    if (!Number.isNaN(exp.getTime())) {
      return Math.ceil((exp.getTime() - Date.now()) / 86_400_000);
    }
  }
  const fromLabel = item.displayLabel.match(/^(\d+)d\b/i);
  if (fromLabel) return parseInt(fromLabel[1]!, 10);
  return null;
}

/** Leg-appropriate scoring signals only (equity vs option risk surfaces). */
export function isLegAppropriateContributor(
  item: PositionGuidanceItem,
  c: ScoringContributor,
  allPositions: PositionGuidanceItem[],
): boolean {
  const bucket = c.bucket.toLowerCase();
  const hasEquity = allPositions.some((p) => isEquityKind(p.positionKind));
  const hasOption = allPositions.some((p) => isOptionKind(p.positionKind));

  if (isEquityKind(item.positionKind)) {
    if (OPTION_ONLY_BUCKETS.has(bucket)) return false;
    const label = contributorScoringLabel(c).toLowerCase();
    if (
      label.includes("assignment") ||
      label.includes("theta") ||
      label.includes("expiration") ||
      label.includes("days to expiration")
    ) {
      return false;
    }
  }

  if (isOptionKind(item.positionKind) && hasEquity && hasOption) {
    if (EQUITY_ONLY_BUCKETS.has(bucket)) return false;
    if (driverCategory(c) === "regime") return false;
    if (bucket === "relative_strength" || bucket === "volume") return false;
    const label = contributorScoringLabel(c).toLowerCase();
    if (
      label.includes("regime") ||
      label.includes("trade quality") ||
      label.includes("relative strength") ||
      label.includes("volume/momentum")
    ) {
      return false;
    }
  }

  return true;
}

function passesDisplayFilters(
  item: PositionGuidanceItem,
  c: ScoringContributor,
  allPositions: PositionGuidanceItem[],
): boolean {
  if (!isLegAppropriateContributor(item, c, allPositions)) return false;
  if (c.points <= 0) return false;
  if (!contributorScoringLabel(c)) return false;

  const category = driverCategory(c);
  const label = contributorScoringLabel(c);

  if (category === "concentration" && isEquityKind(item.positionKind)) {
    const pct = concentrationPctFromLabel(label);
    if (pct != null && pct < CONCENTRATION_MIN_PCT) return false;
  }

  if (
    isOptionKind(item.positionKind) &&
    (c.bucket === "theta" || label.toLowerCase().includes("expiration") ||
      label.toLowerCase().includes("days to expiration"))
  ) {
    const dte = daysToExpiration(item);
    if (dte != null && dte > THETA_MAX_DTE) return false;
  }

  return true;
}

function contributorToDeduped(c: ScoringContributor): DedupedDriver {
  return {
    label: contributorScoringLabel(c),
    points: c.points,
    category: driverCategory(c),
    semanticKey: semanticDriverKey(c),
    portfolioLevel: isPortfolioLevelDriver(c),
  };
}

function dedupeScoringContributors(
  contributors: ScoringContributor[],
): DedupedDriver[] {
  const byKey = new Map<string, DedupedDriver>();

  for (const c of contributors) {
    const next = contributorToDeduped(c);
    const existing = byKey.get(next.semanticKey);
    if (!existing) {
      byKey.set(next.semanticKey, next);
      continue;
    }
    if (next.points > existing.points) {
      byKey.set(next.semanticKey, next);
    }
  }

  return sortByPointsDesc([...byKey.values()]);
}

type DriverCandidate = {
  positionKey: string;
  kind: PositionKind;
  driver: DedupedDriver;
};

function pickOwnerPosition(candidates: DriverCandidate[]): string {
  if (candidates.length === 0) return "";
  const maxPoints = Math.max(...candidates.map((c) => c.driver.points));
  const tied = candidates.filter((c) => c.driver.points === maxPoints);
  const equity = tied.find((c) => isEquityKind(c.kind));
  return (equity ?? tied[0]!).positionKey;
}

function buildDriverOwnership(
  positions: PositionGuidanceItem[],
): Map<string, string> {
  const ownerByKey = new Map<string, string>();
  const portfolioCandidates = new Map<string, DriverCandidate[]>();

  for (const item of positions) {
    const ranked = rankedScoringContributors(item).filter((c) =>
      passesDisplayFilters(item, c, positions),
    );
    for (const c of ranked) {
      const driver = contributorToDeduped(c);
      if (!driver.portfolioLevel) continue;
      const key = driver.semanticKey;
      const list = portfolioCandidates.get(key) ?? [];
      list.push({
        positionKey: item.positionKey,
        kind: item.positionKind,
        driver,
      });
      portfolioCandidates.set(key, list);
    }
  }

  for (const [, candidates] of portfolioCandidates) {
    const owner = pickOwnerPosition(candidates);
    for (const c of candidates) {
      ownerByKey.set(c.driver.semanticKey, owner);
    }
  }

  return ownerByKey;
}

function isEquityMacroDriver(d: DedupedDriver): boolean {
  if (d.category === "regime" || d.category === "technical") return true;
  return (
    d.semanticKey.includes("relative strength") ||
    d.label.toLowerCase().includes("relative strength")
  );
}

function enforceEquityCoverage(
  selected: DedupedDriver[],
  pool: DedupedDriver[],
): DedupedDriver[] {
  let out = sortByPointsDesc(selected);
  const onlyConcentration =
    out.length > 0 && out.every((d) => d.category === "concentration");

  if (onlyConcentration) {
    const fill = pool.find((d) => isEquityMacroDriver(d));
    out = fill
      ? sortByPointsDesc([
          ...out.filter((d) => d.category !== "concentration"),
          fill,
        ])
      : out.filter((d) => d.category !== "concentration");
  }

  if (!out.some((d) => isEquityMacroDriver(d))) {
    const fill = pool.find((d) => isEquityMacroDriver(d));
    if (fill && !out.some((d) => d.semanticKey === fill.semanticKey)) {
      out = sortByPointsDesc([...out, fill]);
    }
  }

  return sortByPointsDesc(out).slice(0, TOP_DRIVERS_MAX);
}

function enforceOptionsCoverage(
  selected: DedupedDriver[],
  pool: DedupedDriver[],
): DedupedDriver[] {
  let out = sortByPointsDesc(selected);
  const hasPnl = out.some((d) => d.category === "pnl_assignment");
  if (!hasPnl) {
    const fill = pool.find((d) => d.category === "pnl_assignment");
    if (fill && !out.some((d) => d.semanticKey === fill.semanticKey)) {
      out = sortByPointsDesc([...out, fill]);
    }
  }
  return sortByPointsDesc(out).slice(0, TOP_DRIVERS_MAX);
}

function selectDriversForLeg(
  item: PositionGuidanceItem,
  positions: PositionGuidanceItem[],
  ownerByKey: Map<string, string>,
): DedupedDriver[] {
  const ranked = rankedScoringContributors(item).filter((c) =>
    passesDisplayFilters(item, c, positions),
  );

  const eligible = ranked.filter((c) => {
    const key = semanticDriverKey(c);
    const owner = ownerByKey.get(key);
    return owner === undefined || owner === item.positionKey;
  });

  const pool = dedupeScoringContributors(eligible);
  let selected = sortByPointsDesc(pool).slice(0, TOP_DRIVERS_MAX);

  if (isEquityKind(item.positionKind)) {
    selected = enforceEquityCoverage(selected, pool);
  } else {
    selected = enforceOptionsCoverage(selected, pool);
  }

  return sortByPointsDesc(selected);
}

/** Per-leg drivers: score-ordered, engine labels only, causally traceable. */
export function buildPositionDriverDisplay(
  positions: PositionGuidanceItem[],
): Map<string, DedupedDriver[]> {
  const ownerByKey = buildDriverOwnership(positions);
  const result = new Map<string, DedupedDriver[]>();

  for (const item of positions) {
    result.set(
      item.positionKey,
      selectDriversForLeg(item, positions, ownerByKey),
    );
  }

  return result;
}

export function formatDriverPoints(points: number): string {
  if (Number.isInteger(points)) return String(points);
  const fixed = points.toFixed(2);
  return fixed.replace(/\.?0+$/, "");
}

export function formatProfitLossPct(pct: number): string {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

export function positionKindHeading(kind: PositionKind): string {
  switch (kind) {
    case "EQUITY_LONG":
      return "Equity";
    case "LONG_CALL":
      return "Long call";
    case "LONG_PUT":
      return "Long put";
    case "SHORT_CALL":
      return "Short call";
    case "SHORT_PUT":
      return "Short put";
  }
}

export function positionContractLine(item: PositionGuidanceItem): string {
  if (isEquityKind(item.positionKind)) {
    const q = item.quantity;
    const n = Number.isInteger(q) ? q : q;
    return `${n} ${n === 1 ? "share" : "shares"}`;
  }
  return item.displayLabel.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

export function humanizeRegimeId(regimeId: string): string {
  return regimeId
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function positionHasRegimeContributor(items: PositionGuidanceItem[]): boolean {
  return items.some((item) =>
    rankedScoringContributors(item).some((c) => driverCategory(c) === "regime"),
  );
}

function positionHasTradeQualityContributor(
  items: PositionGuidanceItem[],
): boolean {
  return items.some((item) =>
    rankedScoringContributors(item).some((c) =>
      contributorScoringLabel(c).toLowerCase().includes("trade quality"),
    ),
  );
}

export function formatSymbolThesisLine(
  thesis: NonNullable<SymbolPositionGuidance["thesis"]>,
  positions: PositionGuidanceItem[],
): string {
  const parts: string[] = [THESIS_LABEL[thesis.thesis]];

  if (thesis.regimeId && !positionHasRegimeContributor(positions)) {
    parts.push(humanizeRegimeId(thesis.regimeId));
  }
  if (
    thesis.tradeQualityScore != null &&
    !positionHasTradeQualityContributor(positions)
  ) {
    parts.push(`Trade quality ${thesis.tradeQualityScore}/100`);
  }

  return parts.join(" · ");
}
