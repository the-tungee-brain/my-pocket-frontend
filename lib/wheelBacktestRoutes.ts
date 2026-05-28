import type { ResearchTabId } from "@/components/ResearchTabBar";
import type {
  WheelBacktestCallStrikeMode,
  WheelBacktestYears,
} from "@/app/types/wheelBacktest";
import {
  type WheelBacktestDteDays,
  normalizeWheelBacktestDteDays,
} from "@/lib/wheelBacktestDte";

export const WHEEL_BACKTEST_TAB: ResearchTabId = "wheel-backtest";

export type WheelBacktestUrlOptions = {
  years?: WheelBacktestYears;
  dteDays?: WheelBacktestDteDays;
  maintainOneLot?: boolean;
  callStrikeMode?: WheelBacktestCallStrikeMode;
  /** Run the simulation as soon as the page loads. */
  run?: boolean;
};

export function wheelBacktestPath(
  symbol: string,
  options?: WheelBacktestUrlOptions,
): string {
  const encoded = encodeURIComponent(symbol.trim().toUpperCase());
  const base = `/research/${encoded}/${WHEEL_BACKTEST_TAB}`;
  if (!options) return base;

  const params = new URLSearchParams();
  if (options.years != null) {
    params.set("years", String(options.years));
  }
  if (options.dteDays != null) {
    params.set("dte", String(options.dteDays));
  }
  if (options.maintainOneLot != null) {
    params.set("maintain", options.maintainOneLot ? "1" : "0");
  }
  if (options.callStrikeMode === "at_or_above_assignment") {
    params.set("callFloor", "1");
  }
  if (options.run) {
    params.set("run", "1");
  }
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

export function parseWheelBacktestSearchParams(
  searchParams: URLSearchParams,
): {
  years: WheelBacktestYears | null;
  dteDays: WheelBacktestDteDays | null;
  maintainOneLot: boolean | null;
  callStrikeMode: WheelBacktestCallStrikeMode | null;
  autoRun: boolean;
} {
  const yearsRaw = searchParams.get("years");
  const yearsParsed = yearsRaw ? Number(yearsRaw) : NaN;
  const years: WheelBacktestYears | null =
    yearsParsed === 5 || yearsParsed === 10 || yearsParsed === 15
      ? yearsParsed
      : null;

  const maintainRaw = searchParams.get("maintain");
  const maintainOneLot =
    maintainRaw === "1" ? true : maintainRaw === "0" ? false : null;

  const callStrikeMode: WheelBacktestCallStrikeMode | null =
    searchParams.get("callFloor") === "1" ? "at_or_above_assignment" : null;

  const dteRaw = searchParams.get("dte");
  const dteParsed = dteRaw ? Number(dteRaw) : NaN;
  const dteDays = normalizeWheelBacktestDteDays(
    Number.isFinite(dteParsed) ? dteParsed : null,
  );

  return {
    years,
    dteDays,
    maintainOneLot,
    callStrikeMode,
    autoRun: searchParams.get("run") === "1",
  };
}
