import type { AccountPlan } from "@/app/types/account";

/** Premium tools gated behind Pro. */
export type ProFeatureId =
  | "wheelBacktest"
  | "dividendSnowball"
  | "newsAi"
  | "financialStrength"
  | "earningsAi"
  | "business"
  | "bigPicture";

const API_FEATURE_KEYS: Record<ProFeatureId, string> = {
  wheelBacktest: "wheel_backtest",
  dividendSnowball: "dividend_snowball",
  newsAi: "news_ai",
  financialStrength: "financial_strength",
  earningsAi: "earnings_ai",
  business: "business",
  bigPicture: "big_picture",
};

export const PRO_FEATURE_LABELS: Record<
  ProFeatureId,
  { title: string; description: string }
> = {
  wheelBacktest: {
    title: "Wheel backtest",
    description:
      "Historical CSP → assignment → covered-call simulation with trade log and charts.",
  },
  dividendSnowball: {
    title: "Income snowball",
    description:
      "Forward DRIP projections, new-cash contributions, and multi-year income scenarios.",
  },
  newsAi: {
    title: "AI news research",
    description:
      "News brief, per-headline sentiment and summaries, market context, and coverage analysis in Research.",
  },
  financialStrength: {
    title: "Financial strength analysis",
    description:
      "Pro strength score, strengths and risks, and AI fundamental overview on Research Financials and Fundamentals.",
  },
  earningsAi: {
    title: "AI earnings analysis",
    description:
      "Quarterly earnings summaries, highlights, guidance takeaways, and investor-oriented analysis on Research Earnings.",
  },
  business: {
    title: "AI business overview",
    description:
      "How the company works, competes, and grows — segments, moat, revenue model, and business risks on Research Business.",
  },
  bigPicture: {
    title: "Big picture AI",
    description:
      "AI investment thesis, valuation context, key strengths, risks, and what to watch on Research Overview.",
  },
};

export function hasProFeature(
  isPaid: boolean,
  feature: ProFeatureId,
  plan?: AccountPlan | null,
): boolean {
  if (isPaid) return true;
  const key = API_FEATURE_KEYS[feature];
  const features = plan?.features;
  if (features && key in features) {
    return Boolean(features[key]);
  }
  return false;
}
