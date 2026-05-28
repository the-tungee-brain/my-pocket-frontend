import type { InvestmentStrategy, StrategyScreenerFilters } from "@/app/types/strategy";

export const SCREENER_SECTOR_OPTIONS = [
  "Technology",
  "Consumer Defensive",
  "Healthcare",
  "Utilities",
  "Financial Services",
  "Industrials",
  "Communication Services",
  "Energy",
  "Basic Materials",
  "Real Estate",
  "Consumer Cyclical",
] as const;

export const MARKET_CAP_PRESETS = [
  { label: "$1B+", value: 1_000_000_000 },
  { label: "$2B+", value: 2_000_000_000 },
  { label: "$5B+", value: 5_000_000_000 },
  { label: "$10B+", value: 10_000_000_000 },
  { label: "$50B+", value: 50_000_000_000 },
] as const;

const SUPPORTED_STRATEGIES: InvestmentStrategy[] = [
  "wheel",
  "csp-income",
  "covered-call",
  "dividend",
  "etf-core",
];

export function supportsStrategyStockScreener(
  strategy: InvestmentStrategy | null,
): strategy is InvestmentStrategy {
  return strategy !== null && SUPPORTED_STRATEGIES.includes(strategy);
}

export function screenerTitle(strategy: InvestmentStrategy): string {
  switch (strategy) {
    case "wheel":
      return "Wheel strategy screener";
    case "csp-income":
      return "CSP income screener";
    case "covered-call":
      return "Covered call screener";
    case "dividend":
      return "Dividend screener";
    case "etf-core":
      return "Core ETF screener";
    default:
      return "Strategy screener";
  }
}

export function defaultWheelScreenerFilters(): StrategyScreenerFilters {
  return {
    minMarketCap: 5_000_000_000,
    maxPe: 50,
    requireDividend: true,
    minDividendYield: null,
    sectors: [
      "Technology",
      "Consumer Defensive",
      "Healthcare",
      "Utilities",
      "Financial Services",
    ],
    exchanges: ["NMS", "NYQ"],
  };
}

export function formatMarketCap(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  if (value >= 1_000_000_000_000) {
    return `$${(value / 1_000_000_000_000).toFixed(1)}T`;
  }
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(0)}M`;
  }
  return `$${value.toFixed(0)}`;
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  const pct = value > 1 ? value : value * 100;
  return `${pct.toFixed(1)}%`;
}

export function formatPrice(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `$${value.toFixed(2)}`;
}

export function filterSummaryChips(filters: StrategyScreenerFilters): string[] {
  const chips: string[] = [`≥ ${formatMarketCap(filters.minMarketCap)}`];
  if (filters.requireDividend) {
    chips.push(
      filters.minDividendYield
        ? `Yield ≥ ${formatPercent(filters.minDividendYield)}`
        : "Dividend payers",
    );
  }
  if (filters.maxPe != null) {
    chips.push(`P/E ≤ ${filters.maxPe.toFixed(0)}`);
  }
  if (filters.sectors?.length) {
    chips.push(`${filters.sectors.length} sectors`);
  }
  return chips;
}

export function screenerFiltersFingerprint(filters: StrategyScreenerFilters): string {
  return JSON.stringify(filters);
}
