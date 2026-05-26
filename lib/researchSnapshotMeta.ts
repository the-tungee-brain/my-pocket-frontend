import type { EtfHoldingsContext } from "@/app/types/research";
import type { ResearchSnapshot } from "@/lib/researchSnapshot";

const UNKNOWN_VALUES = new Set(["unknown", "n/a", "na", ""]);

export function isUnknownLabel(value: string | null | undefined): boolean {
  if (!value) return true;
  return UNKNOWN_VALUES.has(value.trim().toLowerCase());
}

export function formatStockSnapshotSubtitle(snapshot: ResearchSnapshot): string {
  const parts: string[] = [];
  if (!isUnknownLabel(snapshot.sector)) parts.push(snapshot.sector);
  if (!isUnknownLabel(snapshot.country)) parts.push(snapshot.country);
  return parts.length > 0 ? parts.join(" · ") : "Company research";
}

export function formatEtfSnapshotSubtitle(): string {
  return "Exchange-traded fund (ETF)";
}

export function formatSnapshotSubtitle(
  snapshot: ResearchSnapshot,
  options: {
    isEtf?: boolean;
    etfHoldings?: EtfHoldingsContext | null;
  } = {},
): string {
  if (options.isEtf) {
    return formatEtfSnapshotSubtitle();
  }
  return formatStockSnapshotSubtitle(snapshot);
}

export function formatSnapshotSizeLabel(
  snapshot: ResearchSnapshot,
  options: {
    isEtf?: boolean;
    etfHoldings?: EtfHoldingsContext | null;
  } = {},
): string {
  if (options.isEtf) {
    const aum = holdingsAumLabel(options.etfHoldings) ?? snapshot.marketCap;
    const range = snapshot.range52w ? ` · 52-week: ${snapshot.range52w}` : "";
    return `AUM: ${aum}${range}`;
  }

  const range = snapshot.range52w ? ` · 52-week: ${snapshot.range52w}` : "";
  return `Market cap: ${snapshot.marketCap}${range}`;
}

function holdingsAumLabel(
  holdings: EtfHoldingsContext | null | undefined,
): string | null {
  if (holdings?.aum) return holdings.aum;
  return null;
}
