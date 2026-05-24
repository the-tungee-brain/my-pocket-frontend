import type { Position } from "@/app/types/schwab";
import { isShortPut } from "@/lib/cspReservedCash";

const SHARES_PER_OPTION_CONTRACT = 100;

export function isShortCall(position: Position): boolean {
  const { instrument } = position;
  return (
    instrument.assetType === "OPTION" &&
    instrument.putCall === "CALL" &&
    position.shortQuantity > 0
  );
}

export function isLongOption(position: Position): boolean {
  return (
    position.instrument.assetType === "OPTION" && position.longQuantity > 0
  );
}

function underlyingShareCount(
  positions: Position[],
  underlyingSymbol: string,
): number {
  return positions
    .filter(
      (position) =>
        position.instrument.assetType === "EQUITY" &&
        position.instrument.symbol === underlyingSymbol,
    )
    .reduce((sum, position) => sum + position.longQuantity, 0);
}

export function isCoveredCall(
  position: Position,
  siblingPositions: Position[],
): boolean {
  if (!isShortCall(position)) return false;

  const underlying = position.instrument.underlyingSymbol;
  if (!underlying) return false;

  const shares = underlyingShareCount(siblingPositions, underlying);
  return shares >= position.shortQuantity * SHARES_PER_OPTION_CONTRACT;
}

export function optionStrategyLabel(
  position: Position,
  siblingPositions: Position[] = [],
): string | null {
  if (position.instrument.assetType !== "OPTION") return null;

  const { putCall } = position.instrument;

  if (position.shortQuantity > 0) {
    if (putCall === "PUT") return "Cash-secured put";
    if (putCall === "CALL") {
      return isCoveredCall(position, siblingPositions)
        ? "Covered call"
        : "Uncovered call";
    }
    return "Option sold";
  }

  if (position.longQuantity > 0) {
    if (putCall === "CALL") return "Call owned";
    if (putCall === "PUT") return "Put owned";
    return "Option owned";
  }

  return null;
}

export function isCashSecuredPut(position: Position): boolean {
  return isShortPut(position);
}

export function isHighlightedOptionStrategy(
  position: Position,
  siblingPositions: Position[] = [],
): boolean {
  return isCashSecuredPut(position) || isCoveredCall(position, siblingPositions);
}
