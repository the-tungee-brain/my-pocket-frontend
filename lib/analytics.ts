import posthog from "posthog-js";

export type AnalyticsProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

export function identify(userId: string, traits?: AnalyticsProperties) {
  if (typeof window === "undefined" || !userId) return;
  posthog.identify(userId, traits);
}

export function track(event: string, properties?: AnalyticsProperties) {
  if (typeof window === "undefined") return;
  posthog.capture(event, properties);
}
