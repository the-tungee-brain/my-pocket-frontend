import type { FundamentalMetric } from "@/app/hooks/useFundamentals";

export type FundamentalMetricGroup = {
  id: string;
  title: string;
  metrics: FundamentalMetric[];
};

const STOCK_METRIC_GROUPS: { id: string; title: string; labels: string[] }[] = [
  {
    id: "valuation",
    title: "Valuation",
    labels: [
      "P/E (trailing)",
      "P/E (forward)",
      "Price / book",
      "EPS (trailing)",
      "EPS (forward)",
      "Beta",
    ],
  },
  {
    id: "profitability",
    title: "Profitability",
    labels: [
      "Gross margin",
      "Operating margin",
      "Profit margin",
      "Return on equity",
      "Return on assets",
    ],
  },
  {
    id: "growth",
    title: "Growth",
    labels: ["Revenue growth", "Earnings growth"],
  },
  {
    id: "balance-sheet",
    title: "Balance sheet & cash",
    labels: ["Debt / equity", "Current ratio", "Free cash flow"],
  },
  {
    id: "income",
    title: "Income",
    labels: ["Dividend yield", "Annual dividend per share", "Payout ratio"],
  },
];

export function groupFundamentalMetrics(
  metrics: FundamentalMetric[],
): FundamentalMetricGroup[] {
  if (metrics.length === 0) return [];

  const byLabel = new Map(metrics.map((metric) => [metric.label, metric]));
  const assigned = new Set<string>();
  const groups: FundamentalMetricGroup[] = [];

  for (const group of STOCK_METRIC_GROUPS) {
    const groupMetrics = group.labels
      .map((label) => byLabel.get(label))
      .filter((metric): metric is FundamentalMetric => {
        if (!metric || assigned.has(metric.label)) return false;
        assigned.add(metric.label);
        return true;
      });

    if (groupMetrics.length > 0) {
      groups.push({
        id: group.id,
        title: group.title,
        metrics: groupMetrics,
      });
    }
  }

  const remaining = metrics.filter((metric) => !assigned.has(metric.label));
  if (remaining.length > 0) {
    groups.push({
      id: "other",
      title: "Other",
      metrics: remaining,
    });
  }

  return groups;
}
