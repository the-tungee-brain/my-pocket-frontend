import { apiFetch } from "@/lib/apiClient";
import type { MomentumBreakoutCheckResponse } from "@/app/types/momentumBreakoutCheck";

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

export async function fetchMomentumBreakoutCheck(
  accessToken: string,
  symbol: string,
): Promise<MomentumBreakoutCheckResponse> {
  const encoded = encodeURIComponent(symbol.trim().toUpperCase());
  const res = await apiFetch(
    `/strategy/momentum-breakout/check/${encoded}`,
    { method: "GET", accessToken },
  );
  if (!res.ok) {
    return parseError(res, `Could not check ${symbol} (${res.status})`);
  }
  return res.json() as Promise<MomentumBreakoutCheckResponse>;
}
