import posthog from "posthog-js";

export type AnalyticsProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

function captureWhenReady(
  run: (client: typeof posthog) => void,
) {
  if (typeof window === "undefined" || !posthog.__loaded) {
    return;
  }

  run(posthog);
}

export function identify(userId: string, traits?: AnalyticsProperties) {
  if (!userId) return;
  captureWhenReady((client) => {
    client.identify(userId, traits);
  });
}

export function track(event: string, properties?: AnalyticsProperties) {
  captureWhenReady((client) => {
    client.capture(event, properties);
  });
}
