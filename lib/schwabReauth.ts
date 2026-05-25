export type SchwabReauthDetail = {
  message: string;
  reauthRequired: boolean;
  authorizationUrl?: string | null;
};

export async function parseApiErrorDetail(
  res: Response,
): Promise<Record<string, unknown> | null> {
  try {
    const data = await res.json();
    if (data && typeof data === "object" && "detail" in data) {
      const detail = (data as { detail?: unknown }).detail;
      if (typeof detail === "string") {
        return { message: detail };
      }
      if (detail && typeof detail === "object") {
        return detail as Record<string, unknown>;
      }
    }
    if (data && typeof data === "object") {
      return data as Record<string, unknown>;
    }
  } catch {
    // ignore parse failures
  }
  return null;
}

export function parseSchwabReauthDetail(
  detail: Record<string, unknown> | null,
): SchwabReauthDetail | null {
  if (!detail) return null;

  const reauthRequired =
    detail.reauth_required === true || detail.reauthRequired === true;
  if (!reauthRequired) return null;

  const message =
    typeof detail.message === "string"
      ? detail.message
      : "Schwab re-authorization required.";

  const authorizationUrl =
    typeof detail.authorization_url === "string"
      ? detail.authorization_url
      : typeof detail.authorizationUrl === "string"
        ? detail.authorizationUrl
        : null;

  return {
    message,
    reauthRequired: true,
    authorizationUrl,
  };
}

export async function readSchwabReauthFromResponse(
  res: Response,
): Promise<SchwabReauthDetail | null> {
  if (res.status !== 401) return null;
  const detail = await parseApiErrorDetail(res);
  return parseSchwabReauthDetail(detail);
}

export function redirectToSchwabReauth(url: string) {
  window.location.assign(url);
}
