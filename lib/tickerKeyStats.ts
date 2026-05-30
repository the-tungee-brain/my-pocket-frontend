import type { EtfHoldingsContext } from "@/app/types/research";
import type { ResearchTabId } from "@/components/ResearchTabBar";
import type { ResearchSnapshot } from "@/lib/researchSnapshot";
import {
  formatSnapshotSizeLabel,
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

export function formatPeRatio(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value.toFixed(1);
}

function statValue(value: string | null | undefined): string {
  if (!value || isUnknownLabel(value)) return "—";
  return value;
}

export function buildTickerKeyStats(
  snapshot: ResearchSnapshot,
  options: {
    isEtf?: boolean;
    etfHoldings?: EtfHoldingsContext | null;
  } = {},
): TickerKeyStat[] {
  const isEtf = options.isEtf ?? false;
  const sizeLabel = formatSnapshotSizeLabel(snapshot, options);
  const range52w = statValue(snapshot.range52w);

  if (isEtf) {
    return [
      {
        label: "AUM",
        value: statValue(sizeLabel.replace(/^AUM:\s*/, "")),
        hrefTab: "holdings",
      },
      {
        label: "Expense ratio",
        value: formatSnapshotPercent(snapshot.expenseRatioPct),
        hrefTab: "fundamentals",
      },
      {
        label: "Dividend yield",
        value: formatSnapshotPercent(snapshot.dividendYieldPct),
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
      value: statValue(sizeLabel.replace(/^Market cap:\s*/, "").split(" · ")[0]),
      hrefTab: "fundamentals",
    },
    {
      label: "P/E ratio",
      value: formatPeRatio(snapshot.peRatio),
      hrefTab: "fundamentals",
    },
    {
      label: "Dividend yield",
      value: formatSnapshotPercent(snapshot.dividendYieldPct),
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
