import type { EtfHoldingsContext } from "@/app/types/research";
import type { ResearchTabId } from "@/components/ResearchTabBar";
import type { ResearchSnapshot } from "@/lib/researchSnapshot";
import {
  formatSnapshotSizeValue,
  isUnknownLabel,
} from "@/lib/researchSnapshotMeta";

export type TickerKeyStat = {
  label: string;
  value: string;
  hrefTab?: ResearchTabId;
};

export function formatCompactVolume(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toLocaleString("en-US");
}

export function formatSnapshotPercent(
  value: number | null | undefined,
  digits = 2,
): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

function normalizeYieldPct(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) return null;
  if (value > 0 && value < 1) return value * 100;
  return value;
}

function formatDividendYieldPct(value: number | null | undefined): string {
  const normalized = normalizeYieldPct(value);
  if (normalized == null) return "—";
  if (normalized < 0 || normalized > 25) return "Check source";
  return formatSnapshotPercent(normalized);
}

export function formatPeRatio(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toFixed(1);
}

function statValue(value: string | null | undefined): string {
  if (!value || isUnknownLabel(value)) return "—";
  return value;
}

function displayPercentValue(
  numeric: number | null | undefined,
  formatted: string | null | undefined,
  digits = 2,
): string {
  if (numeric != null && Number.isFinite(numeric)) {
    return formatSnapshotPercent(numeric, digits);
  }
  if (formatted?.trim()) return formatted.trim();
  return "—";
}

export function buildTickerKeyStats(
  snapshot: ResearchSnapshot,
  options: {
    isEtf?: boolean;
    etfHoldings?: EtfHoldingsContext | null;
  } = {},
): TickerKeyStat[] {
  const isEtf = options.isEtf ?? false;
  const sizeValue = statValue(formatSnapshotSizeValue(snapshot, options));
  const range52w = statValue(snapshot.range52w);

  if (isEtf) {
    return [
      {
        label: "AUM",
        value: sizeValue,
        hrefTab: "holdings",
      },
      {
        label: "Expense ratio",
        value: displayPercentValue(
          snapshot.expenseRatioPct,
          options.etfHoldings?.expense_ratio,
        ),
        hrefTab: "fundamentals",
      },
      {
        label: "Dividend yield",
        value: formatDividendYieldPct(snapshot.dividendYieldPct),
        hrefTab: "dividends",
      },
      { label: "52-week range", value: range52w },
      { label: "Volume", value: formatCompactVolume(snapshot.volume) },
      {
        label: "Avg volume",
        value: formatCompactVolume(snapshot.avgVolume),
      },
    ];
  }

  return [
    {
      label: "Market cap",
      value: sizeValue,
      hrefTab: "fundamentals",
    },
    {
      label: "P/E ratio",
      value: formatPeRatio(snapshot.peRatio),
      hrefTab: "fundamentals",
    },
    {
      label: "Dividend yield",
      value: formatDividendYieldPct(snapshot.dividendYieldPct),
      hrefTab: "dividends",
    },
    { label: "52-week range", value: range52w },
    { label: "Volume", value: formatCompactVolume(snapshot.volume) },
    {
      label: "Avg volume",
      value: formatCompactVolume(snapshot.avgVolume),
    },
  ];
}
