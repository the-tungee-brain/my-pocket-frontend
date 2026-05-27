import posthog from "posthog-js";

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
const posthogUiHost = posthogHost.includes("eu.")
  ? "https://eu.posthog.com"
  : "https://us.posthog.com";

if (!posthogKey) {
  console.warn(
    "[analytics] NEXT_PUBLIC_POSTHOG_KEY is missing — PostHog disabled. Set it in Netlify env vars and redeploy.",
  );
} else {
  posthog.init(posthogKey, {
    api_host: posthogHost,
    ui_host: posthogUiHost,
    defaults: "2026-01-30",
    capture_exceptions: true,
    debug: process.env.NODE_ENV === "development",
  });
}
