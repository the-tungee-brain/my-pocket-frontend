import posthog from "posthog-js";

const POSTHOG_KEY =
  process.env.NEXT_PUBLIC_POSTHOG_KEY ??
  process.env.NEXT_PUBLIC_POSTHOG_TOKEN ??
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

let initAttempted = false;

export function initPostHog(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  if (posthog.__loaded) {
    return true;
  }

  const key = POSTHOG_KEY?.trim();
  if (!key) {
    console.warn(
      "[analytics] PostHog disabled — set NEXT_PUBLIC_POSTHOG_KEY in Netlify env vars and redeploy.",
    );
    return false;
  }

  if (!initAttempted) {
    initAttempted = true;
    posthog.init(key, {
    api_host: `${window.location.origin}/ingest`,
    ui_host: "https://us.posthog.com",
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
    debug: process.env.NEXT_PUBLIC_POSTHOG_DEBUG === "true",
    loaded: () => {
      if (process.env.NEXT_PUBLIC_POSTHOG_DEBUG === "true") {
        console.info("[analytics] PostHog initialized");
      }
    },
    });
  }

  return posthog.__loaded;
}

export function capturePageView(url: string) {
  if (!initPostHog()) {
    return;
  }

  posthog.capture("$pageview", { $current_url: url });
}
