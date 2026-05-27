import type { Position } from "@/app/types/schwab";
import type { SymbolIntelligence } from "@/app/types/intelligence";
import { hasSymbolOptionsContent } from "@/lib/intelligence";

export function symbolHasOptionPositions(
  positions: Position[] | null | undefined,
): boolean {
  return (positions ?? []).some(
    (position) => position.instrument.assetType === "OPTION",
  );
}

export function shouldShowOptionsTab(
  positions: Position[] | null | undefined,
  intelligence: SymbolIntelligence | null | undefined,
  activeTab?: string,
): boolean {
  if (activeTab === "options") return true;
  return (
    symbolHasOptionPositions(positions) ||
    hasSymbolOptionsContent(intelligence ?? null)
  );
}
