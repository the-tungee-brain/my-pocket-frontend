import type {
  FinancialStrength,
  FundamentalMetric,
  FundamentalsOverview,
} from "@/app/hooks/useFundamentals";

export const FINANCIAL_KEY_METRIC_SPECS: {
  keys: string[];
  display: string;
}[] = [
  { keys: ["Revenue growth"], display: "Revenue growth" },
  { keys: ["Gross margin"], display: "Gross margin" },
  { keys: ["Profit margin", "Net margin"], display: "Net margin" },
  { keys: ["Free cash flow"], display: "Free cash flow" },
  { keys: ["Debt / equity", "Debt/equity"], display: "Debt / equity" },
  { keys: ["Current ratio"], display: "Current ratio" },
];

function normalizeLabel(label: string): string {
  return label.toLowerCase().replace(/\s+/g, " ").trim();
}

function metricKey(metric: FundamentalMetric): string {
  return normalizeLabel(metric.label);
}

export function pickFinancialKeyMetrics(
  metrics: FundamentalMetric[],
): FundamentalMetric[] {
  if (metrics.length === 0) return [];

  const byKey = new Map<string, FundamentalMetric>();
  for (const metric of metrics) {
    byKey.set(metricKey(metric), metric);
  }

  const picked: FundamentalMetric[] = [];
  const used = new Set<string>();

  for (const spec of FINANCIAL_KEY_METRIC_SPECS) {
    const match = spec.keys
      .map((key) => byKey.get(normalizeLabel(key)))
      .find((metric): metric is FundamentalMetric => metric != null);
    if (!match || used.has(metricKey(match))) continue;
    used.add(metricKey(match));
    picked.push(
      spec.display !== match.label
        ? { ...match, label: spec.display }
        : match,
    );
  }

  return picked;
}

function normalizeBullet(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s%$.-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isSimilarBullet(a: string, b: string): boolean {
  const na = normalizeBullet(a);
  const nb = normalizeBullet(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.length > 24 && nb.length > 24) {
    return na.includes(nb) || nb.includes(na);
  }
  return false;
}

export function mergeUniqueBullets(
  ...lists: (string[] | null | undefined)[]
): string[] {
  const result: string[] = [];
  for (const list of lists) {
    if (!list?.length) continue;
    for (const raw of list) {
      const item = raw.trim();
      if (!item) continue;
      if (result.some((existing) => isSimilarBullet(existing, item))) continue;
      result.push(item);
    }
  }
  return result;
}

export function buildFinancialStrengths(
  strength: FinancialStrength | null | undefined,
  _overview?: FundamentalsOverview | null | undefined,
): string[] {
  return mergeUniqueBullets(strength?.strengths);
}

export function buildFinancialRisks(
  strength: FinancialStrength | null | undefined,
  _overview?: FundamentalsOverview | null | undefined,
): string[] {
  return mergeUniqueBullets(strength?.risks);
}

export type InvestmentThesisContent = {
  bullCase: string[];
  bearCase: string[];
  valuationSummary: string;
};

export function buildInvestmentThesis(
  overview: FundamentalsOverview | null | undefined,
): InvestmentThesisContent | null {
  if (!overview) return null;

  const bullCase = overview.investmentThesis?.bullCase ?? [];
  const bearCase = overview.investmentThesis?.bearCase ?? [];
  const valuationSummary = overview.valuationSummary?.trim() ?? "";

  if (bullCase.length === 0 && bearCase.length === 0 && !valuationSummary) {
    return null;
  }

  return { bullCase, bearCase, valuationSummary };
}

export const SEC_HIGHLIGHT_FORMS = ["10-Q", "10-K", "8-K"] as const;

export function pickHighlightFilings<
  T extends { form: string; filing_date: string },
>(filings: T[]): T[] {
  const sorted = [...filings].sort(
    (a, b) =>
      new Date(b.filing_date).getTime() - new Date(a.filing_date).getTime(),
  );

  return SEC_HIGHLIGHT_FORMS.map((target) => {
    return sorted.find(
      (filing) =>
        filing.form === target || filing.form.startsWith(`${target}/`),
    );
  }).filter((filing): filing is T => filing != null);
}
