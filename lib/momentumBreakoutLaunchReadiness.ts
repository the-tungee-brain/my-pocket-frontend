import { apiFetch } from "@/lib/apiClient";
import type { LaunchReadinessResponse } from "@/app/types/momentumBreakoutLaunchReadiness";

export async function fetchMomentumBreakoutLaunchReadiness(
  accessToken: string,
  options: { adminToken?: string } = {},
): Promise<LaunchReadinessResponse> {
  const headers: Record<string, string> = {};
  if (options.adminToken) {
    headers["X-MB-Admin-Token"] = options.adminToken;
  }
  const res = await apiFetch("/strategy/momentum-breakout/launch-readiness", {
    method: "GET",
    accessToken,
    headers,
  });
  if (!res.ok) {
    let detail = `Failed to load launch readiness (${res.status})`;
    try {
      const body = (await res.json()) as { detail?: string };
      if (body.detail) detail = body.detail;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }
  return res.json() as Promise<LaunchReadinessResponse>;
}

export function showLaunchReadinessPanel(): boolean {
  return process.env.NEXT_PUBLIC_MB_LAUNCH_READINESS === "true";
}
