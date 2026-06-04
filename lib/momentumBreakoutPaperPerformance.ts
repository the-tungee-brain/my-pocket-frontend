import { apiFetch } from "@/lib/apiClient";
import type {
  PaperTradePerformanceBucketsResponse,
  PaperTradePerformanceSummaryResponse,
  PaperTradePerformanceTradesResponse,
} from "@/app/types/momentumBreakoutPaperPerformance";

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

export async function fetchMomentumBreakoutPaperSummary(
  accessToken: string,
): Promise<PaperTradePerformanceSummaryResponse> {
  const res = await apiFetch(
    "/strategy/momentum-breakout/performance/summary",
    { method: "GET", accessToken },
  );
  if (!res.ok) {
    return parseError(res, `Failed to load paper performance (${res.status})`);
  }
  return res.json() as Promise<PaperTradePerformanceSummaryResponse>;
}

export async function fetchMomentumBreakoutPaperTrades(
  accessToken: string,
  limit = 20,
): Promise<PaperTradePerformanceTradesResponse> {
  const res = await apiFetch(
    `/strategy/momentum-breakout/performance/trades?limit=${limit}`,
    { method: "GET", accessToken },
  );
  if (!res.ok) {
    return parseError(res, `Failed to load paper trades (${res.status})`);
  }
  return res.json() as Promise<PaperTradePerformanceTradesResponse>;
}

export async function fetchMomentumBreakoutPaperBySymbol(
  accessToken: string,
): Promise<PaperTradePerformanceBucketsResponse> {
  const res = await apiFetch(
    "/strategy/momentum-breakout/performance/by-symbol",
    { method: "GET", accessToken },
  );
  if (!res.ok) {
    return parseError(res, `Failed to load by-symbol stats (${res.status})`);
  }
  return res.json() as Promise<PaperTradePerformanceBucketsResponse>;
}

export async function fetchMomentumBreakoutPaperByRegime(
  accessToken: string,
): Promise<PaperTradePerformanceBucketsResponse> {
  const res = await apiFetch(
    "/strategy/momentum-breakout/performance/by-regime",
    { method: "GET", accessToken },
  );
  if (!res.ok) {
    return parseError(res, `Failed to load by-regime stats (${res.status})`);
  }
  return res.json() as Promise<PaperTradePerformanceBucketsResponse>;
}

export function formatPct(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `${(value * 100).toFixed(1)}%`;
}

export function formatRatio(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  if (!Number.isFinite(value)) return "∞";
  return value.toFixed(2);
}
