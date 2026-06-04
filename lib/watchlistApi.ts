import { apiFetch } from "@/lib/apiClient";
import type {
  WatchlistWorkspaceResponse,
  WatchlistWorkspaceSyncRequest,
} from "@/app/types/watchlist";

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

export async function fetchWatchlistWorkspace(
  accessToken: string,
  includeQuotes = false,
): Promise<WatchlistWorkspaceResponse> {
  const query = includeQuotes ? "?includeQuotes=true" : "?includeQuotes=false";
  const res = await apiFetch(`/watchlist/workspace${query}`, {
    method: "GET",
    accessToken,
  });
  if (!res.ok) {
    return parseError(res, `Could not load watchlist (${res.status})`);
  }
  return (await res.json()) as WatchlistWorkspaceResponse;
}

export async function syncWatchlistWorkspace(
  accessToken: string,
  payload: WatchlistWorkspaceSyncRequest,
): Promise<WatchlistWorkspaceResponse> {
  const res = await apiFetch("/watchlist/workspace", {
    method: "PUT",
    accessToken,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    return parseError(res, `Could not save watchlist (${res.status})`);
  }
  return (await res.json()) as WatchlistWorkspaceResponse;
}
