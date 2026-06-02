import type {
  ChartIntelligence,
  ChartIntelligenceTrendline,
  ChartIntelligenceZone,
} from "@/app/types/intelligence";
import type {
  IChartApi,
  ISeriesApi,
  SeriesMarker,
  SeriesType,
  Time,
} from "lightweight-charts";
import {
  BaselineSeries,
  createSeriesMarkers,
  LineSeries,
  LineStyle,
} from "lightweight-charts";

type StockBar = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
};

type TrendlineLike = ChartIntelligenceTrendline & {
  start_date?: string;
  end_date?: string;
  start_price?: number;
  end_price?: number;
  ratio?: number;
};

type ZoneLike = ChartIntelligenceZone & {
  price_low?: number;
  price_high?: number;
};

function toChartTime(date: string): number {
  return Math.floor(new Date(date).getTime() / 1000);
}

function dateIndexMap(data: StockBar[]): Map<string, number> {
  const map = new Map<string, number>();
  data.forEach((bar, index) => {
    map.set(bar.date.slice(0, 10), index);
  });
  return map;
}

function isFinitePrice(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function normalizeTrendline(line: TrendlineLike): ChartIntelligenceTrendline | null {
  const startDate = line.startDate ?? line.start_date;
  const endDate = line.endDate ?? line.end_date;
  const startPrice = line.startPrice ?? line.start_price;
  const endPrice = line.endPrice ?? line.end_price;

  const points = (line.points ?? [])
    .map((point) => ({
      date: point.date,
      price: point.price,
    }))
    .filter((point) => Boolean(point.date) && isFinitePrice(point.price));

  if (points.length >= 2) {
    return {
      label: line.label,
      style: line.style,
      points,
    };
  }

  if (!startDate || !endDate) {
    return null;
  }

  const start = isFinitePrice(startPrice)
    ? startPrice
    : isFinitePrice(endPrice)
      ? endPrice
      : null;
  const end = isFinitePrice(endPrice)
    ? endPrice
    : isFinitePrice(startPrice)
      ? startPrice
      : null;

  if (start == null || end == null) {
    return null;
  }

  return {
    label: line.label,
    style: line.style,
    startDate,
    endDate,
    startPrice: start,
    endPrice: end,
  };
}

function normalizeZone(zone: ZoneLike): ChartIntelligenceZone | null {
  const priceLow = zone.priceLow ?? zone.price_low;
  const priceHigh = zone.priceHigh ?? zone.price_high;
  if (!isFinitePrice(priceLow) || !isFinitePrice(priceHigh)) {
    return null;
  }
  return {
    ...zone,
    priceLow,
    priceHigh,
    label: zone.label,
  };
}

const SMA_COLORS: Record<string, string> = {
  sma20: "#38bdf8",
  sma50: "#a78bfa",
  sma200: "#f59e0b",
};

const SMA_LABELS: Record<string, string> = {
  sma20: "SMA 20",
  sma50: "SMA 50",
  sma200: "SMA 200",
};

const MAX_ZONES_PER_SIDE = 2;

export type ChartOverlayLegendKind = "line" | "band" | "marker";

export type ChartOverlayLegendItem = {
  id: string;
  label: string;
  subtitle?: string;
  kind: ChartOverlayLegendKind;
  color: string;
  dashed?: boolean;
};

function formatZoneRange(low: number, high: number): string {
  return `$${low.toFixed(2)}–$${high.toFixed(2)}`;
}

function trendlineTitle(line: ChartIntelligenceTrendline, style: string): string {
  if (line.label) return line.label;
  if (style.startsWith("sma")) return SMA_LABELS[style] ?? style.toUpperCase();
  return "Trendline";
}

export function buildChartIntelligenceLegendItems(
  intelligence: ChartIntelligence | null | undefined,
): ChartOverlayLegendItem[] {
  if (!intelligence) return [];

  const items: ChartOverlayLegendItem[] = [];
  const seenSma = new Set<string>();
  let structureTrendlineCount = 0;

  for (const rawLine of intelligence.trendlines ?? []) {
    const line = normalizeTrendline(rawLine);
    if (!line) continue;

    const style = typeof line.style === "string" ? line.style : "sma50";
    if (style.startsWith("sma")) {
      if (seenSma.has(style)) continue;
      seenSma.add(style);
      items.push({
        id: `sma-${style}`,
        label: trendlineTitle(line, style),
        kind: "line",
        color: SMA_COLORS[style] ?? "#64748b",
      });
      continue;
    }

    if (
      (line.points && line.points.length >= 2) ||
      (line.startDate && line.endDate)
    ) {
      structureTrendlineCount += 1;
    }
  }

  if (structureTrendlineCount > 0) {
    items.push({
      id: "trendline",
      label:
        structureTrendlineCount > 1
          ? `Trendlines (${structureTrendlineCount})`
          : "Trendline",
      kind: "line",
      color: "#94a3b8",
      dashed: true,
    });
  }

  const supportZones = (intelligence.supportZones ?? [])
    .slice(0, MAX_ZONES_PER_SIDE)
    .map(normalizeZone)
    .filter((zone): zone is ChartIntelligenceZone => zone != null);

  supportZones.forEach((zone, index) => {
    items.push({
      id: `support-${index}`,
      label: supportZones.length > 1 ? `Support ${index + 1}` : "Support",
      subtitle: formatZoneRange(zone.priceLow, zone.priceHigh),
      kind: "band",
      color: "#22c55e",
    });
  });

  const resistanceZones = (intelligence.resistanceZones ?? [])
    .slice(0, MAX_ZONES_PER_SIDE)
    .map(normalizeZone)
    .filter((zone): zone is ChartIntelligenceZone => zone != null);

  resistanceZones.forEach((zone, index) => {
    items.push({
      id: `resistance-${index}`,
      label: resistanceZones.length > 1 ? `Resistance ${index + 1}` : "Resistance",
      subtitle: formatZoneRange(zone.priceLow, zone.priceHigh),
      kind: "band",
      color: "#ef4444",
    });
  });

  if ((intelligence.highlightedCandles ?? []).length > 0) {
    items.push({
      id: "pattern-marker",
      label: "Pattern candle",
      kind: "marker",
      color: "#facc15",
    });
  }

  if ((intelligence.fibChannel?.lines ?? []).length > 0) {
    items.push({
      id: "fib-channel",
      label: "Fib channel",
      subtitle: intelligence.fibChannel?.summary,
      kind: "line",
      color: "#f59e0b",
      dashed: true,
    });
  }

  for (const event of intelligence.breakoutEvents ?? []) {
    const kind = event.kind ?? "";
    if (!kind.includes("failed") && !kind.includes("confirmed")) continue;
    items.push({
      id: `breakout-${kind}-${event.date ?? event.barIndex ?? items.length}`,
      label: event.label ?? kind.replace(/_/g, " "),
      kind: "marker",
      color: kind.includes("failed") ? "#ef4444" : "#22c55e",
    });
  }

  return items;
}

const ZONE_BAND_COLORS = {
  support: {
    top: "rgba(34, 197, 94, 0.10)",
    bottom: "rgba(34, 197, 94, 0.04)",
  },
  resistance: {
    top: "rgba(239, 68, 68, 0.10)",
    bottom: "rgba(239, 68, 68, 0.04)",
  },
} as const;

function fibChannelColor(ratio: number): string {
  if (ratio === 0 || ratio >= 1) return "rgba(245, 158, 11, 0.85)";
  if (ratio === 0.5) return "rgba(245, 158, 11, 0.65)";
  return "rgba(245, 158, 11, 0.35)";
}

export function applyChartIntelligenceOverlays(
  chart: IChartApi,
  priceSeries: ISeriesApi<SeriesType>,
  data: StockBar[],
  intelligence: ChartIntelligence | null | undefined,
) {
  if (!intelligence || !data.length) return;

  const byDate = dateIndexMap(data);
  const firstTime = toChartTime(data[0].date) as Time;
  const lastTime = toChartTime(data[data.length - 1].date) as Time;

  for (const rawLine of intelligence.trendlines ?? []) {
    const line = normalizeTrendline(rawLine);
    if (!line) continue;

    const style = typeof line.style === "string" ? line.style : "sma50";
    const color = SMA_COLORS[style] ?? "#64748b";
    const isSma = style.startsWith("sma");
    const isFibChannel = style === "fib_channel";
    const fibRatio =
      isFibChannel && typeof rawLine.ratio === "number" ? rawLine.ratio : 0.5;

    if (line.points && line.points.length >= 2) {
      const overlay = chart.addSeries(LineSeries, {
        color: isFibChannel ? fibChannelColor(fibRatio) : color,
        lineWidth: isFibChannel ? (fibRatio === 0.5 ? 2 : 1) : isSma ? 1 : 2,
        lineStyle:
          isFibChannel && fibRatio !== 0 && fibRatio !== 1
            ? LineStyle.Dotted
            : isSma
              ? LineStyle.Solid
              : LineStyle.Dashed,
        priceLineVisible: false,
        lastValueVisible: false,
        title: "",
        crosshairMarkerVisible: false,
      });
      overlay.setData(
        line.points.map((point) => ({
          time: toChartTime(point.date) as Time,
          value: point.price,
        })),
      );
      continue;
    }

    if (line.startDate && line.endDate && isFinitePrice(line.startPrice) && isFinitePrice(line.endPrice)) {
      const overlay = chart.addSeries(LineSeries, {
        color: "#94a3b8",
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false,
        lastValueVisible: false,
        title: "",
        crosshairMarkerVisible: false,
      });
      overlay.setData([
        {
          time: toChartTime(line.startDate) as Time,
          value: line.startPrice,
        },
        {
          time: toChartTime(line.endDate) as Time,
          value: line.endPrice,
        },
      ]);
    }
  }

  const renderZoneBand = (
    zoneInput: ChartIntelligenceZone,
    kind: keyof typeof ZONE_BAND_COLORS,
  ) => {
    const zone = normalizeZone(zoneInput);
    if (!zone) return;

    const colors = ZONE_BAND_COLORS[kind];
    const band = chart.addSeries(BaselineSeries, {
      baseValue: { type: "price", price: zone.priceLow },
      topFillColor1: colors.top,
      topFillColor2: colors.top,
      bottomFillColor1: colors.bottom,
      bottomFillColor2: colors.bottom,
      topLineColor: kind === "support" ? "rgba(34, 197, 94, 0.45)" : "rgba(239, 68, 68, 0.45)",
      bottomLineColor: kind === "support" ? "rgba(34, 197, 94, 0.45)" : "rgba(239, 68, 68, 0.45)",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    band.setData([
      { time: firstTime, value: zone.priceHigh },
      { time: lastTime, value: zone.priceHigh },
    ]);
  };

  for (const zone of (intelligence.supportZones ?? []).slice(0, MAX_ZONES_PER_SIDE)) {
    renderZoneBand(zone, "support");
  }

  for (const zone of (intelligence.resistanceZones ?? []).slice(0, MAX_ZONES_PER_SIDE)) {
    renderZoneBand(zone, "resistance");
  }

  const markers: SeriesMarker<Time>[] = (intelligence.annotations ?? [])
    .map((annotation): SeriesMarker<Time> | null => {
      const date =
        annotation.date ??
        (annotation.barIndex != null ? data[annotation.barIndex]?.date : null);
      if (!date) return null;
      const time = toChartTime(String(date).slice(0, 10));

      if (annotation.type === "breakout") {
        const breakoutKind =
          annotation.breakoutKind ??
          (annotation as { breakout_kind?: string }).breakout_kind ??
          "";
        const failed = breakoutKind.includes("failed");
        const bullishBreak =
          breakoutKind === "confirmed_breakout" ||
          breakoutKind === "failed_breakdown";
        return {
          time: time as Time,
          position:
            breakoutKind.includes("breakout") || breakoutKind.includes("breakdown")
              ? breakoutKind.includes("breakout")
                ? ("aboveBar" as const)
                : ("belowBar" as const)
              : ("aboveBar" as const),
          shape: bullishBreak ? ("arrowUp" as const) : ("arrowDown" as const),
          color: failed ? "#ef4444" : "#22c55e",
          text: annotation.label ?? (failed ? "Failed" : "Break"),
        };
      }

      const position =
        annotation.position === "belowBar"
          ? ("belowBar" as const)
          : annotation.position === "inBar"
            ? ("inBar" as const)
            : ("aboveBar" as const);
      const shape =
        annotation.type === "arrow"
          ? annotation.direction === "bullish"
            ? ("arrowUp" as const)
            : ("arrowDown" as const)
          : ("circle" as const);
      const color =
        annotation.direction === "bullish"
          ? "#22c55e"
          : annotation.direction === "bearish"
            ? "#ef4444"
            : "#64748b";
      return {
        time: time as Time,
        position,
        shape,
        color,
        text: annotation.label ?? "",
      };
    })
    .filter((marker): marker is SeriesMarker<Time> => marker != null);

  const highlightDates = new Set(
    (intelligence.highlightedCandles ?? []).map((item) =>
      String(item.date ?? data[item.barIndex ?? -1]?.date ?? "").slice(0, 10),
    ),
  );

  for (const [dateKey, index] of byDate.entries()) {
    if (!highlightDates.has(dateKey)) continue;
    const bar = data[index];
    if (!bar) continue;
    markers.push({
      time: toChartTime(bar.date) as Time,
      position: "inBar" as const,
      shape: "circle" as const,
      color: "rgba(250, 204, 21, 0.9)",
      text: "Pattern",
    });
  }

  if (markers.length > 0) {
    createSeriesMarkers(priceSeries, markers);
  }
}

export function hasChartIntelligence(
  intelligence: ChartIntelligence | null | undefined,
): intelligence is ChartIntelligence {
  if (!intelligence) return false;
  if (intelligence.summary?.outlook?.label) return true;
  return Boolean(
    (intelligence.supportZones?.length ?? 0) > 0 ||
      (intelligence.resistanceZones?.length ?? 0) > 0 ||
      (intelligence.trendlines?.length ?? 0) > 0 ||
      (intelligence.breakoutEvents?.length ?? 0) > 0 ||
      (intelligence.fibChannel?.lines?.length ?? 0) > 0,
  );
}
