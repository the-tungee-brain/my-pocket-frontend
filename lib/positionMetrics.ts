import type { Position } from "@/app/types/schwab";

/** Sum backend-computed open P/L across positions. */
export function sumOpenProfitLoss(positions: Position[]): number | null {
  let total = 0;
  let hasValue = false;

  for (const position of positions) {
    if (position.openProfitLoss == null) continue;
    total += position.openProfitLoss;
    hasValue = true;
  }

  return hasValue ? total : null;
}

/** Sum backend-computed cost basis across positions. */
export function sumCostBasis(positions: Position[]): number | null {
  let total = 0;
  let hasValue = false;

  for (const position of positions) {
    if (position.costBasis == null) continue;
    total += position.costBasis;
    hasValue = true;
  }

  return hasValue ? total : null;
}

/** Sum backend-computed portfolio weights across positions (e.g. per symbol). */
export function sumPortfolioWeight(positions: Position[]): number | null {
  let total = 0;
  let hasValue = false;

  for (const position of positions) {
    if (position.portfolioWeightPct == null) continue;
    total += position.portfolioWeightPct;
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
