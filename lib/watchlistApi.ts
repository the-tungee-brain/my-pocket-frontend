import { apiFetch } from "@/lib/apiClient";
import type {
  WatchlistWorkspaceResponse,
  WatchlistWorkspaceSyncRequest,
} from "@/app/types/watchlist";

type WatchlistConflictDetail = {
  code: "watchlist_version_conflict";
  message?: string;
  currentVersion?: number;
  baseVersion?: number;
};

export class WatchlistConflictError extends Error {
  currentVersion: number | null;
  baseVersion: number | null;

  constructor(detail: WatchlistConflictDetail) {
    super(detail.message || "Watchlist has changed on another device.");
    this.name = "WatchlistConflictError";
    this.currentVersion =
      typeof detail.currentVersion === "number" ? detail.currentVersion : null;
    this.baseVersion =
      typeof detail.baseVersion === "number" ? detail.baseVersion : null;
  }
}

export function isWatchlistConflictError(
  err: unknown,
): err is WatchlistConflictError {
  return err instanceof WatchlistConflictError;
}

async function parseError(res: Response, fallback: string): Promise<never> {
  let detail = fallback;
  let body: { detail?: string | WatchlistConflictDetail } | null = null;
  try {
    body = (await res.json()) as { detail?: string | WatchlistConflictDetail };
  } catch {
    // ignore
  }
  if (
    res.status === 409 &&
    typeof body?.detail === "object" &&
    body.detail?.code === "watchlist_version_conflict"
  ) {
    throw new WatchlistConflictError(body.detail);
  }
  if (typeof body?.detail === "string") detail = body.detail;
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
