import posthog from "posthog-js";

const posthogKey =
  process.env.NEXT_PUBLIC_POSTHOG_KEY ??
  process.env.NEXT_PUBLIC_POSTHOG_TOKEN ??
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

if (posthogKey?.trim()) {
  posthog.init(posthogKey.trim(), {
    api_host: `${window.location.origin}/ingest`,
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST?.includes("eu.")
      ? "https://eu.posthog.com"
      : "https://us.posthog.com",
    defaults: "2026-01-30",
    person_profiles: "identified_only",
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: true,
    disable_session_recording: true,
    capture_exceptions: true,
    disable_surveys: true,
    disable_product_tours: true,
    advanced_disable_flags: true,
    advanced_disable_feature_flags: true,
    persistence: "localStorage",
    debug:
      process.env.NODE_ENV === "development" ||
      process.env.NEXT_PUBLIC_POSTHOG_DEBUG === "true",
    loaded: () => {
      if (process.env.NEXT_PUBLIC_POSTHOG_DEBUG === "true") {
        console.info("[analytics] PostHog initialized");
      }
    },
  });
} else {
  console.warn(
    "[analytics] PostHog disabled — set NEXT_PUBLIC_POSTHOG_KEY in Netlify env vars and redeploy.",
  );
}
