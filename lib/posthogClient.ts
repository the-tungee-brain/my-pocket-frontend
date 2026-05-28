import posthog from "posthog-js";
import type { PostHog } from "posthog-js";

function envFlag(name: string, fallback = false): boolean {
  const value = process.env[name];
  if (value == null || value === "") return fallback;
  return value === "true" || value === "1";
}

export function getPostHogKey(): string | undefined {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  return key || undefined;
}

function getDirectHost(): string {
  return process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
}

function getUiHost(): string {
  return getDirectHost().includes("eu.")
    ? "https://eu.posthog.com"
    : "https://us.posthog.com";
}

export function getPostHogRewriteTargets() {
  const isEu = getDirectHost().includes("eu.");
  return {
    ingest: isEu ? "https://eu.i.posthog.com" : "https://us.i.posthog.com",
    assets: isEu
      ? "https://eu-assets.i.posthog.com"
      : "https://us-assets.i.posthog.com",
  };
}

export function buildInitConfig() {
  const useProxy = envFlag("NEXT_PUBLIC_POSTHOG_USE_PROXY", true);
  const sessionReplay = envFlag("NEXT_PUBLIC_POSTHOG_SESSION_REPLAY", false);
  const autocapture = envFlag("NEXT_PUBLIC_POSTHOG_AUTOCAPTURE", false);
  const captureExceptions = envFlag("NEXT_PUBLIC_POSTHOG_EXCEPTIONS", true);

  return {
    api_host: useProxy ? "/ingest" : getDirectHost(),
    ui_host: getUiHost(),
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

export function initPostHogClient(): PostHog | null {
  if (typeof window === "undefined") {
    return null;
  }

  const posthogKey = getPostHogKey();
  if (!posthogKey) {
    console.warn(
      "[analytics] NEXT_PUBLIC_POSTHOG_KEY is missing — PostHog disabled. Set it in your host env vars and redeploy.",
    );
    return null;
  }

  if (posthog.__loaded) {
    return posthog;
  }

  posthog.init(posthogKey, buildInitConfig());
  return posthog;
}

export function getPostHogClient(): PostHog | null {
  if (typeof window === "undefined" || !getPostHogKey()) {
    return null;
  }

  if (!posthog.__loaded) {
    return initPostHogClient();
  }

  return posthog;
}
