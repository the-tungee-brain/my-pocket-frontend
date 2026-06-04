import { apiFetch } from "@/lib/apiClient";
import type { CustomTradePlanResponse } from "@/app/types/customTradePlan";

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

export async function postCustomTradePlan(
  accessToken: string,
  symbol: string,
): Promise<CustomTradePlanResponse> {
  const res = await apiFetch("/strategy/custom-trade-plan", {
    method: "POST",
    accessToken,
    body: JSON.stringify({
      symbol: symbol.trim().toUpperCase(),
      direction: "LONG",
    }),
  });
  if (!res.ok) {
    return parseError(res, `Could not generate custom plan (${res.status})`);
  }
  return res.json() as Promise<CustomTradePlanResponse>;
}
