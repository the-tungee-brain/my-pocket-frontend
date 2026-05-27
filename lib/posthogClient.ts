import type { PostHog } from "posthog-js";

let client: PostHog | null = null;
let initPromise: Promise<PostHog | null> | null = null;

function envFlag(name: string, fallback = false): boolean {
  const value = process.env[name];
  if (value == null || value === "") return fallback;
  return value === "true" || value === "1";
}

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

function buildInitConfig() {
  const sessionReplay = envFlag("NEXT_PUBLIC_POSTHOG_SESSION_REPLAY", false);
  const autocapture = envFlag("NEXT_PUBLIC_POSTHOG_AUTOCAPTURE", false);
  const captureExceptions = envFlag("NEXT_PUBLIC_POSTHOG_EXCEPTIONS", false);

  return {
    ...getHostConfig(),
    defaults: "2026-01-30" as const,
    autocapture,
    disable_session_recording: !sessionReplay,
    capture_exceptions: captureExceptions,
    disable_surveys: true,
    disable_product_tours: true,
    advanced_disable_flags: true,
    advanced_disable_feature_flags: true,
    capture_pageview: true,
    capture_pageleave: false,
    persistence: "localStorage" as const,
    debug: process.env.NEXT_PUBLIC_POSTHOG_DEBUG === "true",
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
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[analytics] NEXT_PUBLIC_POSTHOG_KEY is missing — PostHog disabled.",
      );
    }
    return Promise.resolve(null);
  }

  initPromise = import("posthog-js").then(({ default: posthog }) => {
    posthog.init(posthogKey, buildInitConfig());
    client = posthog;
    return posthog;
  });

  return initPromise;
}

export function getPostHogClient(): PostHog | null {
  return client;
}
