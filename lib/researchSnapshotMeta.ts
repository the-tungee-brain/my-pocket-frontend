import type { EtfHoldingsContext } from "@/app/types/research";
import type { ResearchSnapshot } from "@/lib/researchSnapshot";

const UNKNOWN_VALUES = new Set(["unknown", "n/a", "na", ""]);

export function isUnknownLabel(value: string | null | undefined): boolean {
  if (!value) return true;
  return UNKNOWN_VALUES.has(value.trim().toLowerCase());
}

export function getTopSectorLabel(
  breakdown: Record<string, number> | undefined,
): string | null {
  if (!breakdown) return null;
  const entries = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
  const [sector, weight] = entries[0] ?? [];
  if (!sector || weight == null) return null;
  return `${sector} (${weight.toFixed(1)}%)`;
}

export function formatStockSnapshotSubtitle(snapshot: ResearchSnapshot): string {
  const parts: string[] = [];
  if (!isUnknownLabel(snapshot.sector)) parts.push(snapshot.sector);
  if (!isUnknownLabel(snapshot.country)) parts.push(snapshot.country);
  return parts.length > 0 ? parts.join(" · ") : "Company research";
}

export function formatEtfSnapshotSubtitle(
  snapshot: ResearchSnapshot,
  holdings: EtfHoldingsContext | null | undefined,
): string {
  const parts: string[] = ["Exchange-traded fund"];

  const category =
    !isUnknownLabel(snapshot.sector) &&
    snapshot.sector !== "Exchange-traded fund"
      ? snapshot.sector
      : null;
  if (category) parts.push(category);

  const topSector = getTopSectorLabel(holdings?.sector_breakdown);
  if (topSector) parts.push(`Largest sector: ${topSector}`);

  if (holdings?.total_holdings) {
    parts.push(`${holdings.total_holdings.toLocaleString()} holdings`);
  }

  if (!isUnknownLabel(snapshot.country)) {
    parts.push(snapshot.country);
  }

  return parts.join(" · ");
}

export function formatSnapshotSubtitle(
  snapshot: ResearchSnapshot,
  options: {
    isEtf?: boolean;
    etfHoldings?: EtfHoldingsContext | null;
  } = {},
): string {
  if (options.isEtf) {
    return formatEtfSnapshotSubtitle(snapshot, options.etfHoldings);
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
