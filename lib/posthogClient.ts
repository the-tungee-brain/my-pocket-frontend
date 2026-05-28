import posthog from "posthog-js";
import type { PostHog } from "posthog-js";

/** @deprecated PostHog is initialized in instrumentation-client.ts. Import posthog from posthog-js instead. */
export function getPostHogClient(): PostHog | null {
  if (typeof window === "undefined" || !posthog.__loaded) {
    return null;
  }

  return posthog;
}
