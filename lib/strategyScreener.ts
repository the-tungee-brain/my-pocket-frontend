import type { InvestmentStrategy, StrategyScreenerFilters } from "@/app/types/strategy";

export const ALL_SCREENER_SECTORS = [
  "Basic Materials",
  "Communication Services",
  "Consumer Cyclical",
  "Consumer Defensive",
  "Energy",
  "Financial Services",
  "Healthcare",
  "Industrials",
  "Real Estate",
  "Technology",
  "Utilities",
] as const;

export const SECTOR_DISPLAY_LABELS: Record<string, string> = {
  "Consumer Defensive": "Consumer Staples",
};

export const PRESET_SECTOR_ALLOWLISTS: Record<string, readonly string[]> = {
  wheel_stock: [
    "Technology",
    "Consumer Defensive",
    "Consumer Cyclical",
    "Healthcare",
    "Financial Services",
    "Industrials",
    "Communication Services",
  ],
  csp_stock: [
    "Technology",
    "Consumer Defensive",
    "Consumer Cyclical",
    "Healthcare",
    "Financial Services",
    "Industrials",
    "Communication Services",
  ],
  covered_call_stock: [
    "Consumer Defensive",
    "Healthcare",
    "Utilities",
    "Financial Services",
    "Industrials",
    "Technology",
    "Communication Services",
  ],
  dividend_stock: [
    "Consumer Defensive",
    "Utilities",
    "Healthcare",
    "Financial Services",
    "Real Estate",
    "Energy",
    "Industrials",
  ],
};

export const MARKET_CAP_PRESETS = [
  { label: "$1B+", value: 1_000_000_000 },
  { label: "$2B+", value: 2_000_000_000 },
  { label: "$5B+", value: 5_000_000_000 },
  { label: "$10B+", value: 10_000_000_000 },
  { label: "$50B+", value: 50_000_000_000 },
] as const;

export const PAGE_SIZE_OPTIONS = [5, 10, 15, 20, 25] as const;

export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

export const DEFAULT_PAGE_SIZE: PageSizeOption = 10;

export function normalizePageSize(value: number): PageSizeOption {
  if (PAGE_SIZE_OPTIONS.includes(value as PageSizeOption)) {
    return value as PageSizeOption;
  }
  return DEFAULT_PAGE_SIZE;
}

export function expectedRowsForPage(
  page: number,
  pageSize: number,
  totalCount: number,
): number {
  if (totalCount <= 0) return pageSize;
  const remaining = totalCount - (page - 1) * pageSize;
  return Math.min(pageSize, Math.max(0, remaining));
}

const SUPPORTED_STRATEGIES: InvestmentStrategy[] = [
  "wheel",
  "csp-income",
  "covered-call",
  "dividend",
  "etf-core",
];

const STRATEGY_PRESET_KEY: Record<InvestmentStrategy, string> = {
  wheel: "wheel_stock",
  "csp-income": "csp_stock",
  "covered-call": "covered_call_stock",
  dividend: "dividend_stock",
  "etf-core": "core_etf",
};

export function supportsStrategyStockScreener(
  strategy: InvestmentStrategy | null,
): strategy is InvestmentStrategy {
  return strategy !== null && SUPPORTED_STRATEGIES.includes(strategy);
}

export function formatSectorLabel(sector: string): string {
  return SECTOR_DISPLAY_LABELS[sector] ?? sector;
}

export function allScreenerSectors(): readonly string[] {
  return ALL_SCREENER_SECTORS;
}

export function recommendedSectorsForStrategy(
  strategy: InvestmentStrategy,
): readonly string[] {
  const key = STRATEGY_PRESET_KEY[strategy];
  return PRESET_SECTOR_ALLOWLISTS[key] ?? PRESET_SECTOR_ALLOWLISTS.wheel_stock;
}

/** @deprecated Use recommendedSectorsForStrategy or allScreenerSectors */
export function sectorsForStrategy(strategy: InvestmentStrategy): readonly string[] {
  return recommendedSectorsForStrategy(strategy);
}

export function screenerTitle(strategy: InvestmentStrategy): string {
  switch (strategy) {
    case "wheel":
      return "Pick wheel candidates";
    case "csp-income":
      return "Pick CSP candidates";
    case "covered-call":
      return "Pick covered call candidates";
    case "dividend":
      return "Pick dividend names";
    case "etf-core":
      return "Pick core ETFs";
    default:
      return "Pick symbols";
  }
}

export function defaultScreenerFiltersForStrategy(
  strategy: InvestmentStrategy,
): StrategyScreenerFilters {
  const sectors = [...recommendedSectorsForStrategy(strategy)];

  if (strategy === "dividend") {
    return {
      minMarketCap: 2_000_000_000,
      maxPe: 25,
      requireDividend: true,
      minDividendYield: 0.02,
      sectors,
      exchanges: ["NMS", "NYQ"],
    };
  }

  if (strategy === "covered-call") {
    return {
      minMarketCap: 5_000_000_000,
      maxPe: 40,
      requireDividend: false,
      minDividendYield: null,
      sectors,
      exchanges: ["NMS", "NYQ"],
    };
  }

  if (strategy === "etf-core") {
    return {
      minMarketCap: 5_000_000_000,
      maxPe: null,
      requireDividend: false,
      minDividendYield: null,
      sectors: null,
      exchanges: ["NMS", "NYQ"],
    };
  }

  return {
    minMarketCap: 5_000_000_000,
    maxPe: 40,
    requireDividend: false,
    minDividendYield: null,
    sectors,
    exchanges: ["NMS", "NYQ"],
  };
}

export function defaultWheelScreenerFilters(): StrategyScreenerFilters {
  return defaultScreenerFiltersForStrategy("wheel");
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
  if (filters.sectors != null) {
    if (filters.sectors.length === 0) {
      chips.push("All sectors");
    } else if (filters.sectors.length === ALL_SCREENER_SECTORS.length) {
      chips.push("All sectors");
    } else {
      chips.push(`${filters.sectors.length} sectors`);
    }
  }
  return chips;
}

export function screenerFiltersEqual(
  a: StrategyScreenerFilters,
  b: StrategyScreenerFilters,
): boolean {
  const normalizeSectors = (sectors: string[] | null | undefined) =>
    sectors == null ? null : [...sectors].sort().join("|");

  return (
    a.minMarketCap === b.minMarketCap &&
    a.maxPe === b.maxPe &&
    a.requireDividend === b.requireDividend &&
    a.minDividendYield === b.minDividendYield &&
    normalizeSectors(a.sectors) === normalizeSectors(b.sectors)
  );
}

export function isDefaultScreenerFilters(
  strategy: InvestmentStrategy,
  filters: StrategyScreenerFilters,
): boolean {
  return screenerFiltersEqual(filters, defaultScreenerFiltersForStrategy(strategy));
}

export function screenerFiltersFingerprint(
  filters: StrategyScreenerFilters,
  page = 1,
): string {
  return JSON.stringify({ filters, page });
}
