import { getPostHogClient } from "@/lib/posthogClient";

export type AnalyticsProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

function withPostHog(
  run: (client: NonNullable<ReturnType<typeof getPostHogClient>>) => void,
) {
  if (typeof window === "undefined") return;

  const schedule =
    typeof window.requestIdleCallback === "function"
      ? (task: () => void) =>
          window.requestIdleCallback(() => task(), { timeout: 2000 })
      : (task: () => void) => window.setTimeout(task, 0);

  schedule(() => {
    const client = getPostHogClient();
    if (client) run(client);
  });
}

export function identify(userId: string, traits?: AnalyticsProperties) {
  if (!userId) return;
  withPostHog((client) => {
    client.identify(userId, traits);
  });
}

export function track(event: string, properties?: AnalyticsProperties) {
  withPostHog((client) => {
    client.capture(event, properties);
  });
}
