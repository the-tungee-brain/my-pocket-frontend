import type {
  WheelBacktestAnnualRow,
  WheelBacktestEquityPoint,
  WheelBacktestTrade,
} from "@/app/types/wheelBacktest";

export type WheelChartLinePoint = {
  time: string;
  value: number;
};

export type WheelChartWhitespacePoint = {
  time: string;
  value?: number;
};

export type WheelPhaseSegment = {
  date: string;
  phase: string;
};

export type WheelZoomPreset = "full" | "5y" | "3y" | "1y";

export type WheelChartHoverDetail = {
  date: string;
  equityUsd: number;
  buyAndHoldUsd: number;
  stockCloseUsd: number | null;
  cashUsd: number;
  shares: number;
  phase: string;
  collateralUsd: number;
  drawdownPct: number;
  putStrike: number | null;
  callStrike: number | null;
};

export type WheelChartBundle = {
  wheel: WheelChartLinePoint[];
  buyAndHold: WheelChartLinePoint[];
  stock: WheelChartLinePoint[];
  drawdown: WheelChartLinePoint[];
  putStrike: WheelChartWhitespacePoint[];
  callStrike: WheelChartWhitespacePoint[];
  phaseStrip: WheelPhaseSegment[];
  hoverByTime: Map<string, WheelChartHoverDetail>;
  rangeLabel: string;
};

const MAX_CHART_POINTS = 800;

const PHASE_COLORS: Record<string, string> = {
  cash: "var(--color-muted)",
  short_put: "#f59e0b",
  long_stock: "#3b82f6",
  short_call: "#a855f7",
};

export function phaseColor(phase: string): string {
  return PHASE_COLORS[phase] ?? "var(--color-border)";
}

export function phaseLabel(phase: string): string {
  switch (phase) {
    case "cash":
      return "Cash";
    case "short_put":
      return "Short put";
    case "long_stock":
      return "Long stock";
    case "short_call":
      return "Short call";
    default:
      return phase;
  }
}

export const ZOOM_OPTIONS: { id: WheelZoomPreset; label: string }[] = [
  { id: "full", label: "Full run" },
  { id: "5y", label: "5Y" },
  { id: "3y", label: "3Y" },
  { id: "1y", label: "1Y" },
];

function toChartTime(date: string): string {
  return date.slice(0, 10);
}

function downsampleIndices(length: number, maxPoints: number): number[] {
  if (length <= maxPoints) {
    return Array.from({ length }, (_, i) => i);
  }
  const step = length / maxPoints;
  const indices = new Set<number>();
  indices.add(0);
  indices.add(length - 1);
  for (let i = 0; i < maxPoints; i += 1) {
    indices.add(Math.min(length - 1, Math.floor(i * step)));
  }
  return [...indices].sort((a, b) => a - b);
}

export function filterCurveForZoom(
  equityCurve: WheelBacktestEquityPoint[],
  startDate: string,
  zoom: WheelZoomPreset,
): WheelBacktestEquityPoint[] {
  const fromStart = equityCurve.filter((p) => p.date >= startDate);
  if (fromStart.length === 0 || zoom === "full") {
    return fromStart;
  }

  const endIso = fromStart[fromStart.length - 1].date;
  const years = zoom === "1y" ? 1 : zoom === "3y" ? 3 : 5;
  const cutMs = new Date(endIso).getTime() - years * 365.25 * 24 * 60 * 60 * 1000;

  return fromStart.filter((p) => new Date(p.date).getTime() >= cutMs);
}

type StrikeState = { put: number | null; call: number | null };

function applyTradeToStrikeState(state: StrikeState, trade: WheelBacktestTrade) {
  switch (trade.action) {
    case "sell_csp":
      state.put = trade.strike ?? null;
      state.call = null;
      break;
    case "put_expired":
    case "put_assigned":
      state.put = null;
      break;
    case "sell_cc":
      state.call = trade.strike ?? null;
      break;
    case "call_expired":
    case "call_assigned":
      state.call = null;
      break;
    default:
      break;
  }
}

function buildStrikeStates(
  trades: WheelBacktestTrade[],
  points: WheelBacktestEquityPoint[],
): StrikeState[] {
  const tradesByDate = new Map<string, WheelBacktestTrade[]>();
  for (const trade of trades) {
    const day = toChartTime(trade.date);
    const list = tradesByDate.get(day) ?? [];
    list.push(trade);
    tradesByDate.set(day, list);
  }

  const state: StrikeState = { put: null, call: null };
  return points.map((point) => {
    const day = toChartTime(point.date);
    for (const trade of tradesByDate.get(day) ?? []) {
      applyTradeToStrikeState(state, trade);
    }
    return { put: state.put, call: state.call };
  });
}

function formatRangeLabel(points: WheelBacktestEquityPoint[]): string {
  if (points.length === 0) return "";
  const start = points[0].date.slice(0, 10);
  const end = points[points.length - 1].date.slice(0, 10);
  return `${start} – ${end}`;
}

export function buildWheelChartBundle(
  equityCurve: WheelBacktestEquityPoint[],
  trades: WheelBacktestTrade[],
  startDate: string,
  zoom: WheelZoomPreset,
): WheelChartBundle {
  const filtered = filterCurveForZoom(equityCurve, startDate, zoom);
  if (filtered.length === 0) {
    return {
      wheel: [],
      buyAndHold: [],
      stock: [],
      drawdown: [],
      putStrike: [],
      callStrike: [],
      phaseStrip: [],
      hoverByTime: new Map(),
      rangeLabel: "",
    };
  }

  const strikeStates = buildStrikeStates(trades, filtered);
  const hoverByTime = new Map<string, WheelChartHoverDetail>();
  let peakEquity = 0;

  for (let i = 0; i < filtered.length; i += 1) {
    const point = filtered[i];
    const time = toChartTime(point.date);
    peakEquity = Math.max(peakEquity, point.equityUsd);
    const drawdownPct =
      peakEquity > 0 ? ((point.equityUsd - peakEquity) / peakEquity) * 100 : 0;
    const strikes = strikeStates[i];

    hoverByTime.set(time, {
      date: point.date,
      equityUsd: point.equityUsd,
      buyAndHoldUsd:
        point.buyAndHoldEquityUsd ?? point.equityUsd,
      stockCloseUsd: point.stockCloseUsd ?? null,
      cashUsd: point.cashUsd,
      shares: point.shares,
      phase: point.phase,
      collateralUsd: point.collateralReservedUsd ?? 0,
      drawdownPct,
      putStrike: strikes.put,
      callStrike: strikes.call,
    });
  }

  const indices = downsampleIndices(filtered.length, MAX_CHART_POINTS);
  const wheel: WheelChartLinePoint[] = [];
  const buyAndHold: WheelChartLinePoint[] = [];
  const stock: WheelChartLinePoint[] = [];
  const drawdown: WheelChartLinePoint[] = [];
  const putStrike: WheelChartWhitespacePoint[] = [];
  const callStrike: WheelChartWhitespacePoint[] = [];
  const phaseStrip: WheelPhaseSegment[] = [];

  for (const index of indices) {
    const point = filtered[index];
    const time = toChartTime(point.date);
    const detail = hoverByTime.get(time);
    if (!detail) continue;

    wheel.push({ time, value: detail.equityUsd });
    buyAndHold.push({ time, value: detail.buyAndHoldUsd });
    if (detail.stockCloseUsd != null) {
      stock.push({ time, value: detail.stockCloseUsd });
    }
    drawdown.push({ time, value: detail.drawdownPct });

    const strikes = strikeStates[index];
    putStrike.push(
      strikes.put != null ? { time, value: strikes.put } : { time },
    );
    callStrike.push(
      strikes.call != null ? { time, value: strikes.call } : { time },
    );
    phaseStrip.push({ date: point.date, phase: point.phase });
  }

  return {
    wheel,
    buyAndHold,
    stock,
    drawdown,
    putStrike,
    callStrike,
    phaseStrip,
    hoverByTime,
    rangeLabel: formatRangeLabel(filtered),
  };
}

const MARKER_ACTIONS = new Set([
  "sell_csp",
  "put_assigned",
  "call_assigned",
  "capital_top_up",
]);

export function buildTradeMarkers(trades: WheelBacktestTrade[]) {
  return trades
    .filter((t) => MARKER_ACTIONS.has(t.action) && t.date)
    .map((trade) => {
      const time = toChartTime(trade.date);
      switch (trade.action) {
        case "sell_csp":
          return {
            time,
            position: "belowBar" as const,
            color: "#f59e0b",
            shape: "circle" as const,
            text: "P",
          };
        case "put_assigned":
          return {
            time,
            position: "belowBar" as const,
            color: "#ef4444",
            shape: "arrowUp" as const,
            text: "A",
          };
        case "call_assigned":
          return {
            time,
            position: "aboveBar" as const,
            color: "#22c55e",
            shape: "arrowDown" as const,
            text: "C",
          };
        default:
          return {
            time,
            position: "aboveBar" as const,
            color: "#64748b",
            shape: "circle" as const,
            text: "$",
          };
      }
    });
}

export function maxAnnualReturnMagnitude(rows: WheelBacktestAnnualRow[]): number {
  if (rows.length === 0) return 1;
  return Math.max(...rows.map((r) => Math.abs(r.returnPct)), 1);
}

/** @deprecated use buildWheelChartBundle */
export function buildEquityChartSeries(
  equityCurve: WheelBacktestEquityPoint[],
  startDate: string,
) {
  const bundle = buildWheelChartBundle(equityCurve, [], startDate, "full");
  return {
    wheel: bundle.wheel,
    buyAndHold: bundle.buyAndHold,
    phaseStrip: bundle.phaseStrip,
  };
}
