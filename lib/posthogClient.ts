import type { PostHog } from "posthog-js";

let client: PostHog | null = null;
let initPromise: Promise<PostHog | null> | null = null;

function getHostConfig() {
  const posthogHost =
    process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

  return {
    api_host: posthogHost,
    ui_host: posthogHost.includes("eu.")
      ? "https://eu.posthog.com"
      : "https://us.posthog.com",
  };
}

export function initPostHogClient(): Promise<PostHog | null> {
  if (typeof window === "undefined") {
    return Promise.resolve(null);
  }

  if (client) {
    return Promise.resolve(client);
  }

  if (initPromise) {
    return initPromise;
  }

  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!posthogKey) {
    console.warn(
      "[analytics] NEXT_PUBLIC_POSTHOG_KEY is missing — PostHog disabled. Set it in Netlify env vars and redeploy.",
    );
    return Promise.resolve(null);
  }

  initPromise = import("posthog-js").then(({ default: posthog }) => {
    posthog.init(posthogKey, {
      ...getHostConfig(),
      defaults: "2026-01-30",
      capture_exceptions: true,
      debug: process.env.NEXT_PUBLIC_POSTHOG_DEBUG === "true",
    });
    client = posthog;
    return posthog;
  });

  return initPromise;
}

export function getPostHogClient(): PostHog | null {
  return client;
}
