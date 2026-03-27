"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
} from "lightweight-charts";

type StockData = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

type Props = {
  data: StockData[];
  symbol: string;
  period?: string;
  interval?: string;
  onPeriodChange?: (period: string) => void;
  onIntervalChange?: (interval: string) => void;
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

function getCssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
}

export function StockChart({
  data,
  symbol,
  period = "3mo",
  interval = "1d",
  onPeriodChange,
  onIntervalChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);

  const [selectedPeriod, setSelectedPeriod] = useState<string>(period);
  const [selectedInterval, setSelectedInterval] = useState<string>(interval);

  const currentPreset =
    PRESETS.find(
      (p) => p.period === selectedPeriod && p.interval === selectedInterval,
    )?.label ?? null;

  useEffect(() => {
    if (!containerRef.current) return;
    if (!data || data.length === 0) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const background = getCssVar("--color-secondary", "#ffffff");
    const foreground = getCssVar("--color-foreground", "#171717");
    const border = getCssVar("--color-border", "#e5e5e5");

    const gridColor = border;
    const width = containerRef.current.clientWidth;

    const chart = createChart(containerRef.current, {
      width,
      height: 400,
      layout: {
        background: { color: background },
        textColor: foreground,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: gridColor,
      },
      rightPriceScale: {
        borderColor: gridColor,
      },
    });

    chartRef.current = chart;

    const upColor = "#22c55e";
    const downColor = "#ef4444";

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor,
      downColor,
      borderVisible: false,
      wickUpColor: upColor,
      wickDownColor: downColor,
    });

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

    const candles = data.map((d) => ({
      time: (new Date(d.date).getTime() / 1000) as any,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    const volumes = data.map((d, i) => ({
      time: candles[i].time,
      value: d.volume,
      color:
        d.close >= d.open ? hexToRgba(upColor, 0.4) : hexToRgba(downColor, 0.4),
    }));

    candleSeries.setData(candles);
    volumeSeries.setData(volumes);

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (!containerRef.current || !chartRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      chartRef.current.applyOptions({ width: newWidth });
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [data, selectedPeriod, selectedInterval]);

  useEffect(() => {
    setSelectedPeriod(period);
  }, [period]);

  useEffect(() => {
    setSelectedInterval(interval);
  }, [interval]);

  const handlePresetClick = (preset: (typeof PRESETS)[number]) => {
    setSelectedPeriod(preset.period);
    setSelectedInterval(preset.interval);
    onPeriodChange?.(preset.period);
    onIntervalChange?.(preset.interval);
  };

  const handleReset = () => {
    handlePresetClick(PRESETS[3]);
  };

  return (
    <div className="w-full max-w-3xl mx-auto mt-4">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h2
            className="text-lg font-semibold tracking-tight"
            style={{ color: "var(--color-foreground)" }}
          >
            {symbol}
          </h2>
          <p
            className="text-xs opacity-70"
            style={{ color: "var(--color-foreground)" }}
          >
            {selectedPeriod.toUpperCase()} • {selectedInterval.toUpperCase()}
          </p>
        </div>

        {currentPreset && (
          <span
            className="rounded-full px-2 py-1 text-[10px] font-medium"
            style={{
              backgroundColor: "var(--color-secondary)",
              color: "var(--color-foreground)",
              border: "1px solid var(--color-border)",
            }}
          >
            {currentPreset} preset
          </span>
        )}
      </div>

      <div
        className="relative rounded-2xl border shadow-sm"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-secondary)",
        }}
      >
        <div
          ref={containerRef}
          className="w-full overflow-hidden rounded-2xl border-b"
          style={{ borderColor: "var(--color-border)" }}
        />

        <div className="flex flex-col gap-2 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span
              className="text-[11px] uppercase tracking-wide opacity-70"
              style={{ color: "var(--color-foreground)" }}
            >
              Time range
            </span>

            <div className="flex flex-wrap gap-1">
              {PRESETS.map((p) => {
                const active = p.label === currentPreset;
                return (
                  <button
                    key={p.label}
                    onClick={() => handlePresetClick(p)}
                    className="rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors"
                    style={{
                      backgroundColor: active
                        ? "var(--color-foreground)"
                        : "transparent",
                      color: active
                        ? "var(--color-background)"
                        : "var(--color-foreground)",
                      border: `1px solid var(--color-border)`,
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className="h-px w-full"
            style={{ backgroundColor: "var(--color-border)" }}
          />

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <label className="flex items-center gap-2">
              <span className="opacity-80">Period</span>
              <select
                value={selectedPeriod}
                onChange={(e) => {
                  const newPeriod = e.target.value;
                  setSelectedPeriod(newPeriod);
                  onPeriodChange?.(newPeriod);
                }}
                className="rounded-md border px-2 py-1 text-xs"
                style={{
                  backgroundColor: "var(--color-background)",
                  color: "var(--color-foreground)",
                  borderColor: "var(--color-border)",
                }}
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
              <span className="opacity-80">Interval</span>
              <select
                value={selectedInterval}
                onChange={(e) => {
                  const newInterval = e.target.value;
                  setSelectedInterval(newInterval);
                  onIntervalChange?.(newInterval);
                }}
                className="rounded-md border px-2 py-1 text-xs"
                style={{
                  backgroundColor: "var(--color-background)",
                  color: "var(--color-foreground)",
                  borderColor: "var(--color-border)",
                }}
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
              onClick={handleReset}
              className="ml-auto rounded-md border px-2 py-1 text-xs font-medium transition-colors"
              style={{
                backgroundColor: "transparent",
                color: "var(--color-foreground)",
                borderColor: "var(--color-border)",
              }}
            >
              Reset to 3M
            </button>
          </div>
        </div>
      </div>
    </div>
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
