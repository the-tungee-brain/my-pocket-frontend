"use client";

import { useEffect, useRef } from "react";
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
};

function getCssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
}

export function StockChart({ data, symbol }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);

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
        top: 0.85,
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
        d.close >= d.open
          ? `${hexToRgba(upColor, 0.5)}`
          : `${hexToRgba(downColor, 0.5)}`,
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
  }, [data]);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <h2
        className="mb-2 text-lg font-semibold"
        style={{ color: "var(--color-foreground)" }}
      >
        {symbol}
      </h2>
      <div ref={containerRef} className="w-full rounded-2xl overflow-hidden" />
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
