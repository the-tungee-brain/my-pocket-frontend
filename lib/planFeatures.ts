import type { AccountPlan } from "@/app/types/account";

/** Premium tools gated behind Pro. */
export type ProFeatureId =
  | "wheelBacktest"
  | "dividendSnowball"
  | "newsAi"
  | "financialStrength"
  | "earningsAi"
  | "business"
  | "bigPicture"
  | "patternTrend";

const API_FEATURE_KEYS: Record<ProFeatureId, string> = {
  wheelBacktest: "wheel_backtest",
  dividendSnowball: "dividend_snowball",
  newsAi: "news_ai",
  financialStrength: "financial_strength",
  earningsAi: "earnings_ai",
  business: "business",
  bigPicture: "big_picture",
  patternTrend: "pattern_trend",
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
  patternTrend: {
    title: "5-day pattern trend",
    description:
      "ML direction forecast for the next five sessions with probabilities, indicators, and trade signal on Research.",
  },
};

/** Read Pro access from backend `/account/plan` (features map preferred). */
export function hasProFeature(
  plan: AccountPlan | null | undefined,
  feature: ProFeatureId,
): boolean {
  if (!plan) return false;

  const key = API_FEATURE_KEYS[feature];
  if (plan.features && key in plan.features) {
    return Boolean(plan.features[key]);
  }

  return Boolean(plan.isPaid);
}

export type ProFeatureAccess = {
  allowed: boolean;
  resolved: boolean;
  loading: boolean;
  plan: AccountPlan | null;
};

/** Gate UI only after backend plan has loaded — avoids flashing the wrong tier. */
export function resolveProFeatureAccess(
  plan: AccountPlan | null,
  loading: boolean,
  feature: ProFeatureId,
): ProFeatureAccess {
  const resolved = !loading && plan != null;
  return {
    plan,
    loading,
    resolved,
    allowed: resolved && hasProFeature(plan, feature),
  };
}
