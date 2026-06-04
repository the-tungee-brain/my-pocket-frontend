import { apiFetch } from "@/lib/apiClient";
import type { MomentumBreakoutFeatureStatusResponse } from "@/app/types/momentumBreakoutFeatureFlags";

let cached: MomentumBreakoutFeatureStatusResponse | null = null;

export async function fetchMomentumBreakoutFeatureStatus(
  accessToken: string,
): Promise<MomentumBreakoutFeatureStatusResponse> {
  const res = await apiFetch("/strategy/momentum-breakout/feature-status", {
    method: "GET",
    accessToken,
  });
  if (!res.ok) {
    throw new Error(`Failed to load feature status (${res.status})`);
  }
  const body = (await res.json()) as MomentumBreakoutFeatureStatusResponse;
  cached = body;
  return body;
}

export function getCachedMomentumBreakoutFeatureFlags():
  | MomentumBreakoutFeatureStatusResponse["flags"]
  | null {
  return cached?.flags ?? null;
}
