import type { AccountPlan } from "@/app/types/account";

/** Premium tools gated behind Pro. */
export type ProFeatureId = "wheelBacktest" | "dividendSnowball";

const API_FEATURE_KEYS: Record<ProFeatureId, string> = {
  wheelBacktest: "wheel_backtest",
  dividendSnowball: "dividend_snowball",
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
