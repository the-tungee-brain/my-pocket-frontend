import type { ChartIntelligence } from "@/app/types/intelligence";
import type { IChartApi, ISeriesApi, SeriesType, Time } from "lightweight-charts";
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

function toChartTime(date: string): number {
  return Math.floor(new Date(date).getTime() / 1000);
}

function dateKey(date: string) {
  return date.slice(0, 10);
}

const SMA_COLORS: Record<string, string> = {
  sma20: "#38bdf8",
  sma50: "#a78bfa",
  sma200: "#f59e0b",
};

export function applyChartIntelligenceOverlays(
  chart: IChartApi,
  priceSeries: ISeriesApi<SeriesType>,
  data: StockBar[],
  intelligence: ChartIntelligence | null | undefined,
) {
  if (!intelligence || !data.length) return;

  const firstTime = toChartTime(data[0].date) as Time;
  const lastTime = toChartTime(data[data.length - 1].date) as Time;

  for (const line of intelligence.trendlines ?? []) {
    if (line.points && Array.isArray(line.points) && line.points.length >= 2) {
      const style = typeof line.style === "string" ? line.style : "sma50";
      const color = SMA_COLORS[style] ?? "#64748b";
      const isTrendline = style === "trendline";
      const overlay = chart.addSeries(LineSeries, {
        color: isTrendline ? "#94a3b8" : color,
        lineWidth: isTrendline ? 2 : 1,
        lineStyle: isTrendline ? LineStyle.Dashed : LineStyle.Solid,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      overlay.setData(
        line.points
          .filter((point) => point.date && point.price != null)
          .map((point) => ({
            time: toChartTime(point.date) as Time,
            value: point.price,
          })),
      );
      if (isTrendline && line.confidence != null) {
        priceSeries.createPriceLine({
          price: line.endPrice ?? line.startPrice ?? 0,
          color: "rgba(148, 163, 184, 0.6)",
          lineWidth: 1,
          lineStyle: LineStyle.Dotted,
          axisLabelVisible: true,
          title: `Trendline · ${line.touches ?? 0} touches · ${line.confidence}%`,
        });
      }
      continue;
    }

    if (line.startDate && line.endDate) {
      const overlay = chart.addSeries(LineSeries, {
        color: "#94a3b8",
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      overlay.setData([
        {
          time: toChartTime(line.startDate) as Time,
          value: line.startPrice ?? line.endPrice ?? 0,
        },
        {
          time: toChartTime(line.endDate) as Time,
          value: line.endPrice ?? line.startPrice ?? 0,
        },
      ]);
    }
  }

  const renderZoneBand = (
    zone: ChartIntelligence["supportZones"][number],
    topColor: string,
    bottomColor: string,
  ) => {
    const start = zone.startDate ? toChartTime(zone.startDate) : firstTime;
    const end = zone.endDate ? toChartTime(zone.endDate) : lastTime;
    const band = chart.addSeries(BaselineSeries, {
      baseValue: { type: "price", price: zone.priceLow },
      topFillColor1: topColor,
      topFillColor2: topColor,
      bottomFillColor1: bottomColor,
      bottomFillColor2: bottomColor,
      topLineColor: "transparent",
      bottomLineColor: "transparent",
      lineWidth: 0,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });
    band.setData([
      { time: start as Time, value: zone.priceHigh },
      { time: end as Time, value: zone.priceHigh },
    ]);
    priceSeries.createPriceLine({
      price: zone.priceLow,
      color: topColor.replace("0.22", "0.55"),
      lineWidth: 1,
      lineStyle: LineStyle.Solid,
      axisLabelVisible: true,
      title: `${zone.label ?? "Zone"} · ${zone.touches ?? 0} touches · ${zone.strengthScore ?? 0}/100`,
    });
  };

  for (const zone of intelligence.supportZones ?? []) {
    renderZoneBand(zone, "rgba(34, 197, 94, 0.22)", "rgba(34, 197, 94, 0.08)");
  }
  for (const zone of intelligence.resistanceZones ?? []) {
    renderZoneBand(zone, "rgba(239, 68, 68, 0.22)", "rgba(239, 68, 68, 0.08)");
  }

  type MarkerEntry = {
    time: Time;
    position: "aboveBar" | "belowBar" | "inBar";
    shape: "arrowUp" | "arrowDown" | "circle" | "square";
    color: string;
    text: string;
  };

  const markers: MarkerEntry[] = [];

  for (const annotation of intelligence.annotations ?? []) {
    const date =
      annotation.date ??
      (annotation.barIndex != null ? data[annotation.barIndex]?.date : null);
    if (!date) continue;

    if (annotation.type === "structure_label") {
      markers.push({
        time: toChartTime(String(date).slice(0, 10)) as Time,
        position: annotation.kind === "high" ? "aboveBar" : "belowBar",
        shape: "circle",
        color: "#e2e8f0",
        text: annotation.label ?? "",
      });
      continue;
    }

    if (annotation.type === "breakout") {
      markers.push({
        time: toChartTime(String(date).slice(0, 10)) as Time,
        position: "aboveBar",
        shape: annotation.eventType?.includes("failed") ? "arrowDown" : "arrowUp",
        color: annotation.volumeConfirmed ? "#f59e0b" : "#64748b",
        text: annotation.label ?? "Breakout",
      });
      continue;
    }

    const position =
      annotation.position === "belowBar"
        ? "belowBar"
        : annotation.position === "inBar"
          ? "inBar"
          : "aboveBar";
    const shape =
      annotation.shape === "arrowUp"
        ? "arrowUp"
        : annotation.shape === "arrowDown"
          ? "arrowDown"
          : annotation.type === "arrow"
            ? annotation.direction === "bullish"
              ? "arrowUp"
              : "arrowDown"
            : "circle";
    const color =
      annotation.direction === "bullish"
        ? "#22c55e"
        : annotation.direction === "bearish"
          ? "#ef4444"
          : "#64748b";
    markers.push({
      time: toChartTime(String(date).slice(0, 10)) as Time,
      position,
      shape,
      color,
      text: annotation.label ?? "",
    });
  }

  const highlightDates = new Set(
    (intelligence.highlightedCandles ?? []).map((item) =>
      dateKey(String(item.date ?? data[item.barIndex ?? -1]?.date ?? "")),
    ),
  );

  for (const bar of data) {
    if (!highlightDates.has(dateKey(bar.date))) continue;
    markers.push({
      time: toChartTime(bar.date) as Time,
      position: "inBar",
      shape: "square",
      color: "rgba(250, 204, 21, 0.95)",
      text: "Pattern",
    });
  }

  for (const marker of intelligence.volumeMarkers ?? []) {
    const bar = marker.barIndex != null ? data[marker.barIndex] : data[data.length - 1];
    if (!bar) continue;
    markers.push({
      time: toChartTime(bar.date) as Time,
      position: "belowBar",
      shape: "circle",
      color:
        marker.type === "pattern_volume_absent"
          ? "#f97316"
          : marker.type === "pattern_volume_confirmed"
            ? "#22c55e"
            : "#3b82f6",
      text: "Vol",
    });
  }

  if (markers.length > 0) {
    createSeriesMarkers(priceSeries, markers);
  }
}

export function hasChartIntelligence(
  intelligence: ChartIntelligence | null | undefined,
): intelligence is ChartIntelligence {
  return Boolean(intelligence?.narrative?.summary);
}

export function patternProofTooltip(
  metadata: ChartIntelligence["patternMetadata"][number] | undefined,
): string[] {
  return metadata?.proofMode?.tooltipLines ?? [];
}
