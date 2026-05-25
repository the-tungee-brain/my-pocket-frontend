import type { Position } from "@/app/types/schwab";

/** Prefer backend-computed open P/L; fall back to raw Schwab fields. */
export function positionOpenProfitLoss(position: Position): number | null {
  if (position.openProfitLoss != null) return position.openProfitLoss;
  if (position.longQuantity > 0 && position.longOpenProfitLoss != null) {
    return position.longOpenProfitLoss;
  }
  if (position.shortQuantity > 0 && position.shortOpenProfitLoss != null) {
    return position.shortOpenProfitLoss;
  }
  return null;
}

/** Prefer backend-computed cost basis; fall back to market value vs open P/L. */
export function positionCostBasis(position: Position): number | null {
  if (position.costBasis != null) return position.costBasis;

  const openPL = positionOpenProfitLoss(position);
  if (openPL == null) return null;

  if (position.longQuantity > 0) {
    const derived = position.marketValue - openPL;
    return derived > 0 ? derived : null;
  }
  if (position.shortQuantity > 0) {
    const derived = Math.abs(position.marketValue) + openPL;
    return derived > 0 ? derived : null;
  }
  return null;
}

/** Prefer backend-computed open P/L %; fall back to derived totals. */
export function positionOpenProfitLossPct(position: Position): number | null {
  if (position.openProfitLossPct != null) return position.openProfitLossPct;
  return openProfitLossPct(
    positionOpenProfitLoss(position),
    positionCostBasis(position),
  );
}

/** Prefer backend-computed weight; fall back when liquidation value is known. */
export function positionPortfolioWeightPct(
  position: Position,
  liquidationValue?: number | null,
): number | null {
  if (position.portfolioWeightPct != null) return position.portfolioWeightPct;
  if (!liquidationValue || liquidationValue <= 0) return null;
  return (Math.abs(position.marketValue) / liquidationValue) * 100;
}

export function sumOpenProfitLoss(positions: Position[]): number | null {
  let total = 0;
  let hasValue = false;

  for (const position of positions) {
    const openPL = positionOpenProfitLoss(position);
    if (openPL == null) continue;
    total += openPL;
    hasValue = true;
  }

  return hasValue ? total : null;
}

export function sumCostBasis(positions: Position[]): number | null {
  let total = 0;
  let hasValue = false;

  for (const position of positions) {
    const costBasis = positionCostBasis(position);
    if (costBasis == null) continue;
    total += costBasis;
    hasValue = true;
  }

  return hasValue ? total : null;
}

export function sumPortfolioWeight(
  positions: Position[],
  liquidationValue?: number | null,
): number | null {
  let total = 0;
  let hasValue = false;

  for (const position of positions) {
    const weight = positionPortfolioWeightPct(position, liquidationValue);
    if (weight == null) continue;
    total += weight;
    hasValue = true;
  }

  return hasValue ? total : null;
}

/** Display helper: percent from already-computed dollar totals. */
export function openProfitLossPct(
  openPL: number | null,
  costBasis: number | null,
): number | null {
  if (openPL == null || costBasis == null || costBasis === 0) {
    return null;
  }
  return (openPL / Math.abs(costBasis)) * 100;
}
