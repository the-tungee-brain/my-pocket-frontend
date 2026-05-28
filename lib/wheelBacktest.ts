import { apiFetch } from "@/lib/apiClient";
import type { WheelBacktestResult, WheelBacktestYears } from "@/app/types/wheelBacktest";

export type FetchWheelBacktestOptions = {
  symbol: string;
  years: WheelBacktestYears;
  targetDeltaMin?: number;
  targetDeltaMax?: number;
  dteDays?: number;
  contracts?: number;
};

export async function fetchWheelBacktest(
  accessToken: string,
  options: FetchWheelBacktestOptions,
): Promise<WheelBacktestResult> {
  const params = new URLSearchParams({
    symbol: options.symbol.trim().toUpperCase(),
    years: String(options.years),
  });
  if (options.targetDeltaMin !== undefined) {
    params.set("targetDeltaMin", String(options.targetDeltaMin));
  }
  if (options.targetDeltaMax !== undefined) {
    params.set("targetDeltaMax", String(options.targetDeltaMax));
  }
  if (options.dteDays !== undefined) {
    params.set("dteDays", String(options.dteDays));
  }
  if (options.contracts !== undefined) {
    params.set("contracts", String(options.contracts));
  }

  const res = await apiFetch(`/strategy/wheel-backtest?${params.toString()}`, {
    method: "GET",
    accessToken,
  });

  if (!res.ok) {
    let detail = `Backtest failed (${res.status})`;
    try {
      const body = (await res.json()) as { detail?: string };
      if (body.detail) detail = body.detail;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }

  return res.json() as Promise<WheelBacktestResult>;
}
