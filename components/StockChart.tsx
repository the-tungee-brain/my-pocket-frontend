"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
} from "lightweight-charts";
import type { ChartIntelligence } from "@/app/types/intelligence";
import {
  applyChartIntelligenceOverlays,
  buildChartIntelligenceLegendItems,
  hasChartIntelligence,
  type ChartOverlayLegendItem,
} from "@/lib/chartIntelligenceOverlays";
import { ChevronDown, LineChart, CandlestickChart } from "lucide-react";
import { iconButtonClass } from "@/components/ui/IconButton";
import { cn } from "@/lib/utils";
import { formatUsd } from "@/lib/formatCurrency";
import { Button } from "@/components/ui/Button";
import { ThinkingSpinner } from "@/components/ui/ThinkingSpinner";

type StockData = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type ChartMode = "line" | "candle";

type Props = {
  data: StockData[];
  symbol: string;
  period?: string;
  interval?: string;
  onPeriodChange?: (period: string) => void;
  onIntervalChange?: (interval: string) => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  chartIntelligence?: ChartIntelligence | null;
  enableChartIntelligence?: boolean;
  autoSwitchToChartIntelligence?: boolean;
  className?: string;
};

const PRESETS = [
  { label: "1D", period: "1d", interval: "1m" },
  { label: "1W", period: "5d", interval: "15m" },
  { label: "1M", period: "1mo", interval: "1d" },
  { label: "3M", period: "3mo", interval: "1d" },
  { label: "6M", period: "6mo", interval: "1d" },
  { label: "1Y", period: "1y", interval: "1d" },
  { label: "YTD", period: "ytd", interval: "1d" },
  { label: "MAX", period: "max", interval: "1mo" },
] as const;

export type PresetKey = (typeof PRESETS)[number]["label"];

const CHART_HEIGHT = 500;

function getCssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
}

function toChartTime(date: string) {
  return Math.floor(new Date(date).getTime() / 1000);
}

function formatVolume(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

function formatChartPrice(value: number) {
  return formatUsd(value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPeriodReturn(pct: number) {
  const prefix = pct >= 0 ? "+" : "";
  return `${prefix}${pct.toFixed(2)}%`;
}

function computePeriodReturn(data: StockData[]) {
  if (data.length < 2) return null;
  const first = data[0].close;
  const last = data[data.length - 1].close;
  if (first === 0) return null;
  return ((last - first) / first) * 100;
}

function formatIntervalLabel(interval: string) {
  const labels: Record<string, string> = {
    "1m": "1 minute",
    "2m": "2 minutes",
    "5m": "5 minutes",
    "15m": "15 minutes",
    "30m": "30 minutes",
    "60m": "1 hour",
    "90m": "90 minutes",
    "1h": "1 hour",
    "1d": "Daily",
    "5d": "5 days",
    "1wk": "Weekly",
    "1mo": "Monthly",
    "3mo": "Quarterly",
  };

  return labels[interval] ?? interval.toUpperCase();
}

function formatChartDateRange(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const startLabel = startDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  const endLabel = endDate.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    ...(startDate.getFullYear() !== endDate.getFullYear()
      ? { year: "numeric" }
      : {}),
  });

  return `${startLabel} – ${endLabel}`;
}

function computeChartFooterStats(data: StockData[], interval: string) {
  if (data.length === 0) return null;

  let periodHigh = data[0].high;
  let periodLow = data[0].low;

  for (const bar of data) {
    if (bar.high > periodHigh) periodHigh = bar.high;
    if (bar.low < periodLow) periodLow = bar.low;
  }

  return {
    dateRange: formatChartDateRange(data[0].date, data[data.length - 1].date),
    intervalLabel: formatIntervalLabel(interval),
    periodHigh,
    periodLow,
  };
}

function crosshairTimeToUnix(time: unknown): number | null {
  if (typeof time === "number") return time;
  if (typeof time === "string")
    return Math.floor(new Date(time).getTime() / 1000);

  if (time && typeof time === "object" && "year" in time) {
    const businessDay = time as { year: number; month: number; day: number };
    return (
      Date.UTC(businessDay.year, businessDay.month - 1, businessDay.day) / 1000
    );
  }

  return null;
}

function ChartLegend({
  point,
  hovering,
}: {
  point: StockData;
  hovering: boolean;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute left-3 top-3 z-10 max-w-[calc(100%-1.5rem)] rounded-lg border border-border/80 bg-background/95 px-3 py-2 shadow-sm backdrop-blur-sm",
        !hovering && "opacity-80",
      )}
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
        {new Date(point.date).toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] tabular-nums">
        <span>
          <span className="text-muted">O </span>
          <span className="font-medium text-foreground">
            {formatChartPrice(point.open)}
          </span>
        </span>
        <span>
          <span className="text-muted">H </span>
          <span className="font-medium text-foreground">
            {formatChartPrice(point.high)}
          </span>
        </span>
        <span>
          <span className="text-muted">L </span>
          <span className="font-medium text-foreground">
            {formatChartPrice(point.low)}
          </span>
        </span>
        <span>
          <span className="text-muted">C </span>
          <span className="font-medium text-foreground">
            {formatChartPrice(point.close)}
          </span>
        </span>
        <span>
          <span className="text-muted">Vol </span>
          <span className="font-medium text-foreground">
            {formatVolume(point.volume)}
          </span>
        </span>
      </div>
    </div>
  );
}

function ChartOverlayLegendSwatch({ item }: { item: ChartOverlayLegendItem }) {
  if (item.kind === "band") {
    return (
      <span
        aria-hidden
        className="h-2.5 w-4 shrink-0 rounded-sm border"
        style={{
          backgroundColor: `${item.color}22`,
          borderColor: `${item.color}88`,
        }}
      />
    );
  }

  if (item.kind === "marker") {
    return (
      <span
        aria-hidden
        className="h-2 w-2 shrink-0 rounded-[2px]"
        style={{ backgroundColor: item.color }}
      />
    );
  }

  return (
    <span aria-hidden className="flex h-2.5 w-4 shrink-0 items-center">
      <span
        className="block h-0 w-full border-t-2"
        style={{
          borderColor: item.color,
          borderStyle: item.dashed ? "dashed" : "solid",
        }}
      />
    </span>
  );
}

function ChartOverlayLegend({ items }: { items: ChartOverlayLegendItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none absolute bottom-14 left-3 z-10 max-w-[min(100%-1.5rem,16rem)] rounded-lg border border-border/80 bg-background/92 px-2.5 py-2 shadow-sm backdrop-blur-sm">
      <p className="text-[9px] font-semibold uppercase tracking-wide text-muted">
        Chart overlays
      </p>
      <ul className="mt-1.5 space-y-1">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-2 text-[10px] leading-tight"
          >
            <ChartOverlayLegendSwatch item={item} />
            <span className="min-w-0">
              <span className="font-medium text-foreground">{item.label}</span>
              {item.subtitle ? (
                <span className="ml-1 tabular-nums text-muted">
                  {item.subtitle}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StockChart({
  data,
  symbol,
  period = "3mo",
  interval = "1d",
  onPeriodChange,
  onIntervalChange,
  loading = false,
  error = null,
  onRetry,
  chartIntelligence,
  enableChartIntelligence = true,
  autoSwitchToChartIntelligence = true,
  className,
}: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);

  const [selectedPeriod, setSelectedPeriod] = useState<string>(period);
  const [selectedInterval, setSelectedInterval] = useState<string>(interval);
  const [chartMode, setChartMode] = useState<ChartMode>("line");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<StockData | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenSupported, setFullscreenSupported] = useState(false);

  const currentPreset =
    PRESETS.find(
      (p) => p.period === selectedPeriod && p.interval === selectedInterval,
    )?.label ?? null;

  const dataByTime = useMemo(() => {
    const map = new Map<number, StockData>();
    for (const point of data) {
      map.set(toChartTime(point.date), point);
    }
    return map;
  }, [data]);

  const latestPoint = data.length > 0 ? data[data.length - 1] : null;
  const legendPoint = hoveredPoint ?? latestPoint;
  const periodReturn = useMemo(() => computePeriodReturn(data), [data]);
  const footerStats = useMemo(
    () => computeChartFooterStats(data, selectedInterval),
    [data, selectedInterval],
  );
  const activeChartIntelligence =
    enableChartIntelligence && chartMode === "candle"
      ? chartIntelligence
      : null;
  const overlayLegendItems = useMemo(
    () => buildChartIntelligenceLegendItems(activeChartIntelligence),
    [activeChartIntelligence],
  );

  useEffect(() => {
    setFullscreenSupported(
      typeof document !== "undefined" &&
        typeof document.documentElement.requestFullscreen === "function",
    );
  }, []);

  useEffect(() => {
    const syncFullscreen = () => {
      setIsFullscreen(document.fullscreenElement === sectionRef.current);
    };

    document.addEventListener("fullscreenchange", syncFullscreen);
    return () =>
      document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  useEffect(() => {
    void isFullscreen;
    if (!chartRef.current || !containerRef.current) return;

    const resizeChart = () => {
      if (!chartRef.current || !containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      if (clientWidth <= 0 || clientHeight <= 0) return;

      chartRef.current.applyOptions({
        width: clientWidth,
        height: clientHeight,
      });
      chartRef.current.timeScale().fitContent();
    };

    requestAnimationFrame(() => {
      requestAnimationFrame(resizeChart);
    });
    const timeout = window.setTimeout(resizeChart, 100);

    return () => window.clearTimeout(timeout);
  }, [isFullscreen]);

  useEffect(() => {
    if (
      enableChartIntelligence &&
      autoSwitchToChartIntelligence &&
      hasChartIntelligence(chartIntelligence)
    ) {
      setChartMode("candle");
    }
  }, [
    chartIntelligence,
    enableChartIntelligence,
    autoSwitchToChartIntelligence,
  ]);

  useEffect(() => {
    if (!containerRef.current) return;

    if (!data.length) {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      return;
    }

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const background = getCssVar("--color-secondary", "#ffffff");
    const foreground = getCssVar("--color-foreground", "#171717");
    const border = getCssVar("--color-border", "#e5e5e5");
    const accent = getCssVar("--color-accent-strong", "#2563eb");
    const upColor = "#22c55e";
    const downColor = "#ef4444";
    const { clientWidth, clientHeight } = containerRef.current;

    const chart = createChart(containerRef.current, {
      width: Math.max(clientWidth, 1),
      height: Math.max(clientHeight, CHART_HEIGHT),
      layout: {
        background: { color: background },
        textColor: foreground,
      },
      grid: {
        vertLines: { color: border },
        horzLines: { color: border },
      },
      crosshair: {
        vertLine: { labelBackgroundColor: accent },
        horzLine: { labelBackgroundColor: accent },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: border,
      },
      rightPriceScale: {
        borderColor: border,
      },
    });

    chartRef.current = chart;

    const candles = data.map((d) => ({
      time: toChartTime(d.date) as never,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    let priceSeries: ReturnType<typeof chart.addSeries>;

    if (chartMode === "line") {
      priceSeries = chart.addSeries(LineSeries, {
        color: accent,
        lineWidth: 2,
        crosshairMarkerRadius: 4,
      });
      priceSeries.setData(
        candles.map((bar) => ({ time: bar.time, value: bar.close })),
      );
    } else {
      priceSeries = chart.addSeries(CandlestickSeries, {
        upColor,
        downColor,
        borderVisible: false,
        wickUpColor: upColor,
        wickDownColor: downColor,
      });
      priceSeries.setData(candles);
    }

    applyChartIntelligenceOverlays(
      chart,
      priceSeries,
      data,
      activeChartIntelligence,
    );

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: upColor,
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });

    chart.priceScale("").applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    const volumes = data.map((d, i) => ({
      time: candles[i].time,
      value: d.volume,
      color:
        d.close >= d.open ? hexToRgba(upColor, 0.4) : hexToRgba(downColor, 0.4),
    }));

    volumeSeries.setData(volumes);
    chart.timeScale().fitContent();

    const handleCrosshairMove = (param: {
      time?: unknown;
      point?: { x: number; y: number };
    }) => {
      if (!param.time || !param.point) {
        setHoveredPoint(null);
        return;
      }

      const time = crosshairTimeToUnix(param.time);
      if (time == null) {
        setHoveredPoint(null);
        return;
      }

      setHoveredPoint(dataByTime.get(time) ?? null);
    };

    chart.subscribeCrosshairMove(handleCrosshairMove);

    const resizeChart = () => {
      if (!containerRef.current || !chartRef.current) return;
      const { clientWidth: width, clientHeight: height } = containerRef.current;
      if (width <= 0 || height <= 0) return;
      chartRef.current.applyOptions({ width, height });
    };

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(resizeChart)
        : null;
    resizeObserver?.observe(containerRef.current);
    window.addEventListener("resize", resizeChart);

    return () => {
      window.removeEventListener("resize", resizeChart);
      resizeObserver?.disconnect();
      chart.unsubscribeCrosshairMove(handleCrosshairMove);
      chart.remove();
      chartRef.current = null;
    };
  }, [activeChartIntelligence, chartMode, data, dataByTime]);

  useEffect(() => {
    setSelectedPeriod(period);
  }, [period]);

  useEffect(() => {
    setSelectedInterval(interval);
  }, [interval]);

  useEffect(() => {
    void data;
    void chartMode;
    void selectedPeriod;
    void selectedInterval;
    setHoveredPoint(null);
  }, [data, chartMode, selectedPeriod, selectedInterval]);

  const handlePresetClick = (preset: (typeof PRESETS)[number]) => {
    setSelectedPeriod(preset.period);
    setSelectedInterval(preset.interval);
    onPeriodChange?.(preset.period);
    onIntervalChange?.(preset.interval);
  };

  const handleReset = () => {
    handlePresetClick(PRESETS[3]);
  };

  const toggleFullscreen = async () => {
    if (!sectionRef.current) return;

    try {
      if (document.fullscreenElement === sectionRef.current) {
        await document.exitFullscreen();
      } else {
        await sectionRef.current.requestFullscreen();
      }
    } catch {
      // Browser blocked fullscreen or API unavailable.
    }
  };

  const hasData = data.length > 0;
  const chartState = error
    ? "error"
    : loading && !hasData
      ? "loading"
      : !hasData
        ? "empty"
        : "ready";

  const rangeLabel = currentPreset ?? `${selectedPeriod.toUpperCase()}`;

  return (
    <section
      ref={sectionRef}
      aria-label={`${symbol} price chart`}
      className={cn(
        "w-full overflow-hidden",
        isFullscreen && "flex h-dvh max-h-dvh flex-col",
        className,
      )}
    >
      <div className="shrink-0 space-y-3 border-b border-border px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
            {periodReturn != null && (
              <span
                className={cn(
                  "text-lg font-semibold tabular-nums",
                  periodReturn >= 0 ? "text-success" : "text-danger",
                )}
              >
                {formatPeriodReturn(periodReturn)}
              </span>
            )}
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted">
              {rangeLabel} return
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <fieldset className="flex rounded-lg border border-border bg-background/60 p-0.5">
              <legend className="sr-only">Chart style</legend>
              <button
                type="button"
                aria-pressed={chartMode === "line"}
                onClick={() => setChartMode("line")}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                  chartMode === "line"
                    ? "bg-foreground text-background"
                    : "text-muted hover:text-foreground",
                )}
              >
                <LineChart className="h-3.5 w-3.5" aria-hidden />
                Line
              </button>
              <button
                type="button"
                aria-pressed={chartMode === "candle"}
                onClick={() => setChartMode("candle")}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                  chartMode === "candle"
                    ? "bg-foreground text-background"
                    : "text-muted hover:text-foreground",
                )}
              >
                <CandlestickChart className="h-3.5 w-3.5" aria-hidden />
                Candles
              </button>
            </fieldset>

            <button
              type="button"
              aria-expanded={advancedOpen}
              onClick={() => setAdvancedOpen((open) => !open)}
              className={cn(
                "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition",
                advancedOpen
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background/60 text-muted hover:text-foreground",
              )}
            >
              Advanced
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition",
                  advancedOpen && "rotate-180",
                )}
                aria-hidden
              />
            </button>
          </div>
        </div>

        <fieldset className="flex flex-wrap gap-1">
          <legend className="sr-only">{symbol} chart time range</legend>
          {PRESETS.map((preset) => {
            const active = preset.label === currentPreset;
            return (
              <button
                key={preset.label}
                type="button"
                aria-pressed={active}
                aria-label={`${preset.label} time range`}
                onClick={() => handlePresetClick(preset)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-foreground hover:bg-background/60",
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </fieldset>
      </div>

      {advancedOpen && (
        <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border bg-background/40 px-4 py-3 text-xs">
          <label className="flex items-center gap-2">
            <span className="text-muted">Period</span>
            <select
              value={selectedPeriod}
              aria-label={`${symbol} chart period`}
              onChange={(e) => {
                const newPeriod = e.target.value;
                setSelectedPeriod(newPeriod);
                onPeriodChange?.(newPeriod);
              }}
              className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
            >
              <option value="1d">1 day</option>
              <option value="5d">5 days</option>
              <option value="1mo">1 month</option>
              <option value="3mo">3 months</option>
              <option value="6mo">6 months</option>
              <option value="1y">1 year</option>
              <option value="2y">2 years</option>
              <option value="5y">5 years</option>
              <option value="10y">10 years</option>
              <option value="ytd">Year to date</option>
              <option value="max">Max</option>
            </select>
          </label>

          <label className="flex items-center gap-2">
            <span className="text-muted">Interval</span>
            <select
              value={selectedInterval}
              aria-label={`${symbol} chart interval`}
              onChange={(e) => {
                const newInterval = e.target.value;
                setSelectedInterval(newInterval);
                onIntervalChange?.(newInterval);
              }}
              className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
            >
              <option value="1m">1 minute</option>
              <option value="2m">2 minutes</option>
              <option value="5m">5 minutes</option>
              <option value="15m">15 minutes</option>
              <option value="30m">30 minutes</option>
              <option value="60m">1 hour</option>
              <option value="90m">90 minutes</option>
              <option value="1h">1 hour</option>
              <option value="1d">1 day</option>
              <option value="5d">5 days</option>
              <option value="1wk">1 week</option>
              <option value="1mo">1 month</option>
              <option value="3mo">3 months</option>
            </select>
          </label>

          <button
            type="button"
            onClick={handleReset}
            className="ml-auto rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground transition hover:bg-background/60"
          >
            Reset to 3M
          </button>
        </div>
      )}

      <div
        ref={chartWrapperRef}
        className={cn("flex flex-col", isFullscreen && "min-h-0 flex-1")}
      >
        <div
          className={cn(
            "relative w-full",
            isFullscreen ? "min-h-0 flex-1" : "h-[500px]",
          )}
        >
          {legendPoint && chartState === "ready" && (
            <ChartLegend point={legendPoint} hovering={hoveredPoint != null} />
          )}

          {chartState === "ready" && overlayLegendItems.length > 0 && (
            <ChartOverlayLegend items={overlayLegendItems} />
          )}

          <div
            ref={containerRef}
            role="img"
            aria-label={`${symbol} ${chartMode} chart, ${selectedPeriod} period, ${selectedInterval} interval`}
            className="h-full w-full"
          />

          {chartState !== "ready" && (
            <div
              className={cn(
                "absolute inset-0 flex items-center justify-center",
                chartState === "loading" && "bg-secondary/80 backdrop-blur-sm",
                chartState === "error" && "bg-secondary/90",
                chartState === "empty" && "bg-secondary/60",
              )}
            >
              {chartState === "loading" && (
                <ThinkingSpinner message={`Loading ${symbol} chart`} />
              )}

              {chartState === "error" && (
                <div className="max-w-xs space-y-3 px-4 text-center">
                  <p className="text-sm text-danger">{error}</p>
                  {onRetry && (
                    <Button size="xs" variant="outline" onClick={onRetry}>
                      Try again
                    </Button>
                  )}
                </div>
              )}

              {chartState === "empty" && (
                <p className="px-4 text-center text-sm text-muted">
                  No price data for this time range.
                </p>
              )}
            </div>
          )}

          {chartState === "ready" && loading && (
            <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-background/95 px-2 py-1 text-[10px] font-medium text-muted ring-1 ring-border">
              Updating…
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border/60 bg-background/40 px-3 py-1.5">
          <div className="min-w-0 text-[11px] leading-relaxed text-muted">
            {footerStats ? (
              <p className="truncate">
                <span>{footerStats.dateRange}</span>
                <span aria-hidden="true"> · </span>
                <span>{footerStats.intervalLabel}</span>
                <span className="hidden tabular-nums sm:inline">
                  <span aria-hidden="true"> · </span>H{" "}
                  {formatChartPrice(footerStats.periodHigh)}
                  <span aria-hidden="true"> · </span>L{" "}
                  {formatChartPrice(footerStats.periodLow)}
                </span>
              </p>
            ) : chartState === "loading" ? (
              <p>Loading chart data…</p>
            ) : null}
            {isFullscreen && (
              <p className="mt-0.5 text-[10px] text-muted">Press Esc to exit</p>
            )}
          </div>

          {fullscreenSupported && (
            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              aria-pressed={isFullscreen}
              aria-label={
                isFullscreen
                  ? `Exit full screen chart for ${symbol}`
                  : `View ${symbol} chart full screen`
              }
              title={isFullscreen ? "Exit full screen (Esc)" : "Full screen"}
              className={cn(
                iconButtonClass,
                "h-8 w-8 text-base",
                isFullscreen && "bg-muted-bg text-foreground",
              )}
            >
              <span aria-hidden="true">⛶</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace("#", "");
  const bigint = parseInt(
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h,
    16,
  );
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
