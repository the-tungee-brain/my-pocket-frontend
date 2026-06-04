import { apiFetch } from "@/lib/apiClient";
import type {
  MomentumBreakoutScanOptions,
  MomentumBreakoutScanResponse,
} from "@/app/types/momentumBreakoutScan";

function buildQuery(
  params: Record<string, string | number | boolean | undefined>,
) {
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

export async function fetchMomentumBreakoutScan(
  accessToken: string,
  options: MomentumBreakoutScanOptions = {},
): Promise<MomentumBreakoutScanResponse> {
  const res = await apiFetch(
    `/strategy/momentum-breakout/scan${buildQuery({
      symbols: options.symbols,
      limit: options.limit,
      tradableOnly: options.tradableOnly,
      minHistoricalProfitFactor: options.minHistoricalProfitFactor,
      minHistoricalTrades: options.minHistoricalTrades,
      maxStopDistancePct: options.maxStopDistancePct,
    })}`,
    { method: "GET", accessToken },
  );
  if (!res.ok) {
    return parseError(res, `Failed to load scanner results (${res.status})`);
  }
  return res.json() as Promise<MomentumBreakoutScanResponse>;
}

export async function fetchMomentumBreakoutTopCandidates(
  accessToken: string,
  options: Omit<MomentumBreakoutScanOptions, "limit" | "symbols"> = {},
): Promise<MomentumBreakoutScanResponse> {
  const res = await apiFetch(
    `/strategy/momentum-breakout/top-candidates${buildQuery({
      tradableOnly: options.tradableOnly,
      minHistoricalProfitFactor: options.minHistoricalProfitFactor,
      minHistoricalTrades: options.minHistoricalTrades,
      maxStopDistancePct: options.maxStopDistancePct,
    })}`,
    { method: "GET", accessToken },
  );
  if (!res.ok) {
    return parseError(res, `Failed to load top candidates (${res.status})`);
  }
  return res.json() as Promise<MomentumBreakoutScanResponse>;
}
