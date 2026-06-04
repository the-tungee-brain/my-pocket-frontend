import { apiFetch } from "@/lib/apiClient";
import type {
  MarkNotificationReadResponse,
  MomentumBreakoutAlertDto,
  MomentumBreakoutAlertListResponse,
  MomentumBreakoutAlertRefreshResponse,
  MomentumBreakoutNotificationListResponse,
} from "@/app/types/momentumBreakoutAlerts";

function buildQuery(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

async function parseError(res: Response, fallback: string): Promise<never> {
  let detail = fallback;
  try {
    const body = (await res.json()) as { detail?: string };
    if (body.detail) detail = body.detail;
  } catch {
    // ignore
  }
  throw new Error(detail);
}

export async function fetchMomentumBreakoutActiveAlerts(
  accessToken: string,
): Promise<MomentumBreakoutAlertListResponse> {
  const res = await apiFetch("/strategy/momentum-breakout/alerts/active", {
    method: "GET",
    accessToken,
  });
  if (!res.ok) {
    return parseError(res, `Failed to load active alerts (${res.status})`);
  }
  return res.json() as Promise<MomentumBreakoutAlertListResponse>;
}

export async function fetchMomentumBreakoutAlertHistory(
  accessToken: string,
  limit = 100,
): Promise<MomentumBreakoutAlertListResponse> {
  const res = await apiFetch(
    `/strategy/momentum-breakout/alerts/history${buildQuery({ limit })}`,
    { method: "GET", accessToken },
  );
  if (!res.ok) {
    return parseError(res, `Failed to load alert history (${res.status})`);
  }
  return res.json() as Promise<MomentumBreakoutAlertListResponse>;
}

export async function cancelMomentumBreakoutAlert(
  accessToken: string,
  alertId: string,
): Promise<MomentumBreakoutAlertDto> {
  const res = await apiFetch(
    `/strategy/momentum-breakout/alerts/${encodeURIComponent(alertId)}/cancel`,
    { method: "POST", accessToken },
  );
  if (!res.ok) {
    return parseError(res, `Failed to cancel alert (${res.status})`);
  }
  return res.json() as Promise<MomentumBreakoutAlertDto>;
}

export async function refreshMomentumBreakoutAlerts(
  accessToken: string,
): Promise<MomentumBreakoutAlertRefreshResponse> {
  const res = await apiFetch("/strategy/momentum-breakout/alerts/refresh", {
    method: "POST",
    accessToken,
  });
  if (!res.ok) {
    return parseError(res, `Failed to refresh alerts (${res.status})`);
  }
  return res.json() as Promise<MomentumBreakoutAlertRefreshResponse>;
}

export async function fetchMomentumBreakoutNotifications(
  accessToken: string,
  options: { unreadOnly?: boolean; limit?: number } = {},
): Promise<MomentumBreakoutNotificationListResponse> {
  const res = await apiFetch(
    `/strategy/momentum-breakout/notifications${buildQuery({
      unreadOnly: options.unreadOnly,
      limit: options.limit,
    })}`,
    { method: "GET", accessToken },
  );
  if (!res.ok) {
    return parseError(res, `Failed to load notifications (${res.status})`);
  }
  return res.json() as Promise<MomentumBreakoutNotificationListResponse>;
}

export async function markMomentumBreakoutNotificationRead(
  accessToken: string,
  notificationId: string,
): Promise<MarkNotificationReadResponse> {
  const res = await apiFetch(
    `/strategy/momentum-breakout/notifications/${encodeURIComponent(notificationId)}/read`,
    { method: "POST", accessToken },
  );
  if (!res.ok) {
    return parseError(res, `Failed to mark notification read (${res.status})`);
  }
  return res.json() as Promise<MarkNotificationReadResponse>;
}
