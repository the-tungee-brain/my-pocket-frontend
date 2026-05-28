import posthog from "posthog-js";
import { initPostHog } from "@/lib/posthogClient";

export type AnalyticsProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

function runWhenReady(run: () => void) {
  if (typeof window === "undefined") {
    return;
  }

  if (!initPostHog()) {
    return;
  }

  run();
}

export function identify(userId: string, traits?: AnalyticsProperties) {
  if (!userId) return;
  runWhenReady(() => {
    posthog.identify(userId, traits);
  });
}

export function track(event: string, properties?: AnalyticsProperties) {
  runWhenReady(() => {
    posthog.capture(event, properties);
  });
}
