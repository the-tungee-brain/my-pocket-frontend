import {
  getPostHogClient,
  initPostHogClient,
} from "@/lib/posthogClient";

export type AnalyticsProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

function withPostHog(run: (client: NonNullable<ReturnType<typeof getPostHogClient>>) => void) {
  if (typeof window === "undefined") return;

  const existing = getPostHogClient();
  if (existing) {
    run(existing);
    return;
  }

  void initPostHogClient().then((client) => {
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
