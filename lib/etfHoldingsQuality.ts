import type { EtfHoldingItem } from "@/app/types/research";

const PIOTROSKI_MAX = 9;
const ALTMAN_DISTRESS = 1.81;
const ALTMAN_SAFE = 2.99;
const DEFAULT_QUALITY_LIMIT = 5;

export function normalizePiotroskiScore(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(value)) return null;
  const clamped = Math.max(0, Math.min(Math.trunc(value), PIOTROSKI_MAX));
  return clamped / PIOTROSKI_MAX;
}

export function normalizeAltmanZScore(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(value)) return null;
  const z = Number(value);
  if (z < ALTMAN_DISTRESS) {
    return Math.max(0, (z / ALTMAN_DISTRESS) * 0.35);
  }
  if (z < ALTMAN_SAFE) {
    const span = ALTMAN_SAFE - ALTMAN_DISTRESS;
    return 0.35 + ((z - ALTMAN_DISTRESS) / span) * 0.35;
  }
  return Math.min(0.7 + ((z - ALTMAN_SAFE) / 10) * 0.3, 1);
}

export function computeQualityScore(
  piotroskiF: number | null | undefined,
  altmanZ: number | null | undefined,
): number | null {
  const parts = [
    normalizePiotroskiScore(piotroskiF),
    normalizeAltmanZScore(altmanZ),
  ].filter((score): score is number => score != null);

  if (parts.length === 0) return null;
  return parts.reduce((sum, score) => sum + score, 0) / parts.length;
}

export function withQualityScore(holding: EtfHoldingItem): EtfHoldingItem {
  if (holding.qualityScore != null) return holding;
  const qualityScore = computeQualityScore(holding.piotroskiF, holding.altmanZ);
  if (qualityScore == null) return holding;
  return { ...holding, qualityScore };
}

export function rankEtfHoldingsByQuality(
  holdings: EtfHoldingItem[],
  limit = DEFAULT_QUALITY_LIMIT,
): { strongest: EtfHoldingItem[]; weakest: EtfHoldingItem[] } {
  const scored = holdings
    .map(withQualityScore)
    .filter((holding) => holding.qualityScore != null);

  if (scored.length === 0) {
    return { strongest: [], weakest: [] };
  }

  const ranked = [...scored].sort((a, b) => {
    const scoreDelta = (b.qualityScore ?? 0) - (a.qualityScore ?? 0);
    if (scoreDelta !== 0) return scoreDelta;
    const piotroskiDelta = (b.piotroskiF ?? 0) - (a.piotroskiF ?? 0);
    if (piotroskiDelta !== 0) return piotroskiDelta;
    const altmanDelta = (b.altmanZ ?? 0) - (a.altmanZ ?? 0);
    if (altmanDelta !== 0) return altmanDelta;
    return b.weight_pct - a.weight_pct;
  });

  const resolvedLimit = Math.max(1, limit);
  return {
    strongest: ranked.slice(0, resolvedLimit),
    weakest: ranked.slice(-resolvedLimit).reverse(),
  };
}
