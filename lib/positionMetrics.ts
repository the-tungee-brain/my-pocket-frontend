import type { Position } from "@/app/types/schwab";

export function positionOpenProfitLoss(position: Position): number | null {
  if (position.longQuantity > 0 && position.longOpenProfitLoss != null) {
    return position.longOpenProfitLoss;
  }
  if (position.shortQuantity > 0 && position.shortOpenProfitLoss != null) {
    return position.shortOpenProfitLoss;
  }
  return null;
}

export function positionAverageCost(position: Position): number | null {
  if (position.longQuantity > 0) {
    return (
      position.taxLotAverageLongPrice ??
      position.averageLongPrice ??
      position.averagePrice ??
      null
    );
  }
  if (position.shortQuantity > 0) {
    return (
      position.taxLotAverageShortPrice ??
      position.averageShortPrice ??
      position.averagePrice ??
      null
    );
  }
  return position.averagePrice ?? null;
}

export function positionCostBasis(position: Position): number | null {
  const openPL = positionOpenProfitLoss(position);
  if (openPL != null) {
    return position.marketValue - openPL;
  }

  const avgCost = positionAverageCost(position);
  const qty = Math.abs(position.longQuantity - position.shortQuantity);
  if (avgCost != null && qty > 0) {
    return avgCost * qty;
  }

  return null;
}

export function positionOpenProfitLossPct(
  position: Position,
): number | null {
  const openPL = positionOpenProfitLoss(position);
  const costBasis = positionCostBasis(position);
  if (openPL == null || costBasis == null || costBasis === 0) {
    return null;
  }
  return (openPL / Math.abs(costBasis)) * 100;
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

export function openProfitLossPct(
  openPL: number | null,
  costBasis: number | null,
): number | null {
  if (openPL == null || costBasis == null || costBasis === 0) {
    return null;
  }
  return (openPL / Math.abs(costBasis)) * 100;
}

export function portfolioWeightPct(
  marketValue: number,
  liquidationValue: number | null | undefined,
): number | null {
  if (!liquidationValue || liquidationValue <= 0) {
    return null;
  }
  return (Math.abs(marketValue) / liquidationValue) * 100;
}
