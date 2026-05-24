export type SecPeriod = "annual" | "quarterly";

export function buildSecFilingUrl(
  cikInt: number,
  accessionNumber: string,
  primaryDocument?: string | null,
): string {
  const accession = accessionNumber.replace(/-/g, "");
  const base = `https://www.sec.gov/Archives/edgar/data/${cikInt}/${accession}`;
  if (primaryDocument) {
    return `${base}/${primaryDocument}`;
  }
  return `https://www.sec.gov/cgi-bin/browse-edgar?action=getdoc&CIK=${cikInt}&accno=${accessionNumber}&type=`;
}

export function formatSecPeriodLabel(end: string, fiscalPeriod: string): string {
  if (fiscalPeriod === "FY") {
    return `FY ${end.slice(0, 4)}`;
  }
  return `${fiscalPeriod} ${end.slice(0, 4)}`;
}

export function formatLargeUsd(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  const absVal = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (absVal >= 1_000_000_000_000) {
    return `${sign}$${(absVal / 1_000_000_000_000).toFixed(1)}T`;
  }
  if (absVal >= 1_000_000_000) {
    return `${sign}$${(absVal / 1_000_000_000).toFixed(1)}B`;
  }
  if (absVal >= 1_000_000) {
    return `${sign}$${(absVal / 1_000_000).toFixed(1)}M`;
  }
  return `${sign}$${absVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export function formatRatioPct(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

export function formatGrowthPct(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  const pct = value * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}
