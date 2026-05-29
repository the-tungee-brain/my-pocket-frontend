import type { AccountPositionsResponse } from "@/app/types/schwab";
import type { ApiError } from "@/lib/apiClient";
import { fetchAccountPositions } from "@/lib/apiClient";
import type { SchwabReauthDetail } from "@/lib/schwabReauth";

export const accountPositionsQueryKey = (accessToken: string) =>
  ["account-positions", accessToken] as const;

export async function loadAccountPositions(
  accessToken: string,
  refresh = false,
): Promise<AccountPositionsResponse> {
  try {
    return await fetchAccountPositions(accessToken, { refresh });
  } catch (err) {
    const apiError = err as ApiError;
    if (apiError.reauth?.reauthRequired) {
      const wrapped = new Error(apiError.message) as Error & {
        reauth?: SchwabReauthDetail | null;
      };
      wrapped.reauth = apiError.reauth;
      throw wrapped;
    }
    throw err;
  }
}

export function readInitialPositionsRefresh(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  const schwabConnected =
    params.get("status") === "success" || params.get("schwab") === "connected";
  return params.get("refresh") === "1" || schwabConnected;
}

export function clearPositionsRefreshQueryParams(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("refresh");
  url.searchParams.delete("status");
  url.searchParams.delete("schwab");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

export function schwabConnectPendingFromUrl(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return (
    params.get("status") === "success" || params.get("schwab") === "connected"
  );
}
