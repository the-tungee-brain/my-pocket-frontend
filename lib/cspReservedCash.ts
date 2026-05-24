import type { Position } from "@/app/types/schwab";
import type { CashSecuredPutSummary } from "@/app/types/schwab";

const SHARES_PER_OPTION_CONTRACT = 100;

const OCC_STRIKE_RE = /[CP](\d{8})$/i;
const COMPACT_STRIKE_RE = /[CP](\d+)$/i;

export function parseStrikeFromOptionSymbol(symbol: string): number | null {
  if (!symbol) return null;

  const normalized = symbol.replace(/\s/g, "").toUpperCase();
  const occMatch = normalized.match(OCC_STRIKE_RE);
  if (occMatch) return Number.parseInt(occMatch[1], 10) / 1000;

  const compactMatch = normalized.match(COMPACT_STRIKE_RE);
  if (compactMatch) return Number.parseFloat(compactMatch[1]);

  return null;
}

export function isShortPut(position: Position): boolean {
  const { instrument } = position;
  return (
    instrument.assetType === "OPTION" &&
    instrument.putCall === "PUT" &&
    position.shortQuantity > 0
  );
}

export function positionStrikePrice(position: Position): number | null {
  const { strikePrice, symbol } = position.instrument;
  if (strikePrice != null && strikePrice > 0) return strikePrice;
  return parseStrikeFromOptionSymbol(symbol ?? "");
}

export function cspReservedCash(position: Position): number | null {
  if (!isShortPut(position)) return null;

  const strike = positionStrikePrice(position);
  if (strike == null) return null;

  return strike * SHARES_PER_OPTION_CONTRACT * position.shortQuantity;
}

export function summarizeCspCashReserves(
  positions: Position[],
  cashBalance?: number | null,
): CashSecuredPutSummary {
  const byPosition = positions.flatMap((position) => {
    const reserved = cspReservedCash(position);
    if (reserved == null) return [];

    return [
      {
        symbol: position.instrument.symbol,
        underlyingSymbol: position.instrument.underlyingSymbol ?? null,
        contracts: position.shortQuantity,
        strike: positionStrikePrice(position),
        reservedCash: Math.round(reserved * 100) / 100,
      },
    ];
  });

  const totalReservedCash =
    Math.round(
      byPosition.reduce((sum, item) => sum + item.reservedCash, 0) * 100,
    ) / 100;

  const availableCashAfterReserves =
    cashBalance == null
      ? null
      : Math.round(Math.max(cashBalance - totalReservedCash, 0) * 100) / 100;

  return {
    totalReservedCash,
    availableCashAfterReserves,
    positions: byPosition,
  };
}
