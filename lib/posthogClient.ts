const POSTHOG_KEY =
  process.env.NEXT_PUBLIC_POSTHOG_KEY ??
  process.env.NEXT_PUBLIC_POSTHOG_TOKEN ??
  process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;

const DISTINCT_ID_STORAGE_KEY = "tomcrest_analytics_distinct_id";

type CaptureProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

export type { CaptureProperties };

type EventProperties = Record<string, unknown>;

function getApiKey(): string | undefined {
  return POSTHOG_KEY?.trim() || undefined;
}

function posthogStorageKey(): string | null {
  const key = getApiKey();
  return key ? `ph_${key}_posthog` : null;
}

function readStoredDistinctId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const phKey = posthogStorageKey();
  if (phKey) {
    try {
      const raw = localStorage.getItem(phKey);
      if (raw) {
        const parsed = JSON.parse(raw) as { distinct_id?: string };
        if (parsed.distinct_id) {
          return parsed.distinct_id;
        }
      }
    } catch {
      // ignore malformed PostHog storage
    }
  }

  return localStorage.getItem(DISTINCT_ID_STORAGE_KEY);
}

function writeStoredDistinctId(distinctId: string) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(DISTINCT_ID_STORAGE_KEY, distinctId);

  const phKey = posthogStorageKey();
  if (!phKey) {
    return;
  }

  try {
    const raw = localStorage.getItem(phKey);
    const parsed = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
    parsed.distinct_id = distinctId;
    localStorage.setItem(phKey, JSON.stringify(parsed));
  } catch {
    localStorage.setItem(
      phKey,
      JSON.stringify({
        distinct_id: distinctId,
      }),
    );
  }
}

export function getDistinctId(): string {
  const existing = readStoredDistinctId();
  if (existing) {
    return existing;
  }

  const distinctId = crypto.randomUUID();
  writeStoredDistinctId(distinctId);
  return distinctId;
}

function sanitizeProperties(
  properties?: CaptureProperties,
): Record<string, string | number | boolean> {
  if (!properties) {
    return {};
  }

  const sanitized: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (value === null || value === undefined) {
      continue;
    }
    sanitized[key] = value;
  }
  return sanitized;
}

async function sendEvent(
  event: string,
  properties: EventProperties,
  distinctId: string,
): Promise<void> {
  const apiKey = getApiKey();
  if (!apiKey || typeof window === "undefined") {
    if (typeof window !== "undefined" && !apiKey) {
      console.warn(
        "[analytics] PostHog disabled — set NEXT_PUBLIC_POSTHOG_KEY in Netlify env vars and redeploy.",
      );
    }
    return;
  }

  const payload = {
    api_key: apiKey,
    event,
    distinct_id: distinctId,
    properties: {
      $lib: "tomcrest-web",
      $lib_version: "1.0.0",
      $current_url: window.location.href,
      $host: window.location.host,
      $pathname: window.location.pathname,
      ...properties,
    },
    timestamp: new Date().toISOString(),
  };

  const url = `${window.location.origin}/ingest/i/v0/e/?ip=0`;

  try {
    if (event === "$pageleave" && navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], {
        type: "application/json",
      });
      navigator.sendBeacon(url, blob);
      return;
    }

    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch (error) {
    if (process.env.NEXT_PUBLIC_POSTHOG_DEBUG === "true") {
      console.warn("[analytics] Failed to send event", event, error);
    }
  }
}

export function initPostHog(): boolean {
  return Boolean(getApiKey() && typeof window !== "undefined" && getDistinctId());
}

export function captureEvent(
  event: string,
  properties?: CaptureProperties,
): void {
  if (typeof window === "undefined") {
    return;
  }

  void sendEvent(event, sanitizeProperties(properties), getDistinctId());
}

export function identifyUser(
  userId: string,
  traits?: CaptureProperties,
): void {
  if (!userId || typeof window === "undefined") {
    return;
  }

  const previousDistinctId = getDistinctId();
  writeStoredDistinctId(userId);

  void sendEvent(
    "$identify",
    {
      $anon_distinct_id: previousDistinctId,
      $set: sanitizeProperties(traits),
    },
    userId,
  );
}

export function capturePageView(url: string): void {
  captureEvent("$pageview", { $current_url: url });
}

export function capturePageLeave(url: string): void {
  if (typeof window === "undefined") {
    return;
  }

  void sendEvent(
    "$pageleave",
    sanitizeProperties({ $current_url: url }),
    getDistinctId(),
  );
}
