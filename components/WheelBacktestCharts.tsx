"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createChart,
  createSeriesMarkers,
  LineSeries,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from "lightweight-charts";
import type {
  WheelBacktestAnnualRow,
  WheelBacktestEquityPoint,
  WheelBacktestTrade,
} from "@/app/types/wheelBacktest";
import {
  buildTradeMarkers,
  buildWheelChartBundle,
  maxAnnualReturnMagnitude,
  phaseColor,
  phaseLabel,
  ZOOM_OPTIONS,
  type WheelChartHoverDetail,
  type WheelZoomPreset,
} from "@/lib/wheelBacktestChartData";
import { formatDateMMDDYYYY } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

const CHART_HEIGHT = 440;
const HOVER_PANEL_HEIGHT = 96;

type CrosshairNote = {
  time: string;
  detail: WheelChartHoverDetail | null;
  stock: number | null;
  putStrike: number | null;
  callStrike: number | null;
};

function getCssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
}

function chartTimeToKey(time: Time): string {
  if (typeof time === "string") {
    return time.slice(0, 10);
  }
  if (typeof time === "number") {
    return new Date(time * 1000).toISOString().slice(0, 10);
  }
  if ("year" in time) {
    const month = String(time.month).padStart(2, "0");
    const day = String(time.day).padStart(2, "0");
    return `${time.year}-${month}-${day}`;
  }
  return "";
}

function formatUsd(value: number, fraction = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: fraction,
    minimumFractionDigits: fraction,
  }).format(value);
}

type Props = {
  equityCurve: WheelBacktestEquityPoint[];
  trades: WheelBacktestTrade[];
  annualSummary: WheelBacktestAnnualRow[];
  startDate: string;
  endDate: string;
  startingCashUsd: number;
  className?: string;
};

export function WheelBacktestCharts({
  equityCurve,
  trades,
  annualSummary,
  startDate,
  endDate,
  startingCashUsd,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [zoom, setZoom] = useState<WheelZoomPreset>("full");
  const [note, setNote] = useState<CrosshairNote | null>(null);

  const bundle = useMemo(
    () => buildWheelChartBundle(equityCurve, trades, startDate, zoom),
    [equityCurve, trades, startDate, zoom],
  );

  const markers = useMemo(() => {
    const all = buildTradeMarkers(trades);
    if (!bundle.rangeLabel) return all;
    const [rangeStart] = bundle.rangeLabel.split(" – ");
    const rangeEnd = bundle.rangeLabel.split(" – ")[1] ?? endDate.slice(0, 10);
    return all.filter((m) => m.time >= rangeStart && m.time <= rangeEnd);
  }, [trades, bundle.rangeLabel, endDate]);

  const annualMax = useMemo(
    () => maxAnnualReturnMagnitude(annualSummary),
    [annualSummary],
  );

  const defaultNote = useMemo((): CrosshairNote | null => {
    const last = bundle.wheel[bundle.wheel.length - 1];
    if (!last) return null;
    const detail = bundle.hoverByTime.get(last.time) ?? null;
    return {
      time: last.time,
      detail,
      stock:
        bundle.stock.find((p) => p.time === last.time)?.value ??
        detail?.stockCloseUsd ??
        null,
      putStrike:
        bundle.putStrike.find((p) => p.time === last.time)?.value ??
        detail?.putStrike ??
        null,
      callStrike:
        bundle.callStrike.find((p) => p.time === last.time)?.value ??
        detail?.callStrike ??
        null,
    };
  }, [bundle]);

  const displayNote = note ?? defaultNote;

  useEffect(() => {
    if (!containerRef.current || bundle.wheel.length === 0) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const background = getCssVar("--color-secondary", "#ffffff");
    const foreground = getCssVar("--color-foreground", "#171717");
    const border = getCssVar("--color-border", "#e5e5e5");
    const accent = getCssVar("--color-accent-strong", "#2563eb");
    const muted = getCssVar("--color-muted", "#737373");
    const { clientWidth } = containerRef.current;

    const chart = createChart(containerRef.current, {
      width: Math.max(clientWidth, 1),
      height: CHART_HEIGHT,
      autoSize: false,
      layout: {
        background: { color: background },
        textColor: foreground,
      },
      grid: {
        vertLines: { color: border },
        horzLines: { color: border },
      },
      rightPriceScale: { borderColor: border },
      timeScale: {
        borderColor: border,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        vertLine: { color: muted },
        horzLine: { color: muted },
      },
    });

    const panes = chart.panes();
    panes[0]?.setStretchFactor(2.4);

    const wheelSeries = chart.addSeries(
      LineSeries,
      {
        color: accent,
        lineWidth: 2,
        title: "Wheel",
        priceLineVisible: false,
      },
      0,
    );
    wheelSeries.setData(
      bundle.wheel.map((p) => ({ time: p.time as Time, value: p.value })),
    );

    const bahSeries = chart.addSeries(
      LineSeries,
      {
        color: muted,
        lineWidth: 2,
        lineStyle: LineStyle.Dashed,
        title: "B&H",
        priceLineVisible: false,
      },
      0,
    );
    bahSeries.setData(
      bundle.buyAndHold.map((p) => ({ time: p.time as Time, value: p.value })),
    );

    if (markers.length > 0) {
      createSeriesMarkers(
        wheelSeries,
        markers.map((m) => ({ ...m, time: m.time as Time })),
      );
    }

    chart.addPane(false);
    chart.panes()[1]?.setStretchFactor(0.7);
    const drawdownSeries = chart.addSeries(
      LineSeries,
      {
        color: "#ef4444",
        lineWidth: 1,
        title: "DD %",
        priceLineVisible: false,
        lastValueVisible: true,
      },
      1,
    );
    drawdownSeries.setData(
      bundle.drawdown.map((p) => ({ time: p.time as Time, value: p.value })),
    );

    chart.addPane(false);
    chart.panes()[2]?.setStretchFactor(1.3);
    const stockSeries = chart.addSeries(
      LineSeries,
      {
        color: foreground,
        lineWidth: 2,
        title: "Stock",
        priceLineVisible: false,
      },
      2,
    );
    stockSeries.setData(
      bundle.stock.map((p) => ({ time: p.time as Time, value: p.value })),
    );

    const putSeries = chart.addSeries(
      LineSeries,
      {
        color: "#f59e0b",
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        title: "Put strike",
        priceLineVisible: false,
        lastValueVisible: false,
      },
      2,
    );
    putSeries.setData(
      bundle.putStrike.map((p) =>
        p.value != null
          ? { time: p.time as Time, value: p.value }
          : { time: p.time as Time },
      ),
    );

    const callSeries = chart.addSeries(
      LineSeries,
      {
        color: "#a855f7",
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        title: "Call strike",
        priceLineVisible: false,
        lastValueVisible: false,
      },
      2,
    );
    callSeries.setData(
      bundle.callStrike.map((p) =>
        p.value != null
          ? { time: p.time as Time, value: p.value }
          : { time: p.time as Time },
      ),
    );

    chart.subscribeCrosshairMove((param) => {
      if (!param.time) {
        setNote(null);
        return;
      }
      const key = chartTimeToKey(param.time);
      if (!key) {
        setNote(null);
        return;
      }

      const readLine = (series: ISeriesApi<"Line">): number | null => {
        const point = param.seriesData.get(series);
        if (!point || !("value" in point)) return null;
        const value = point.value;
        return typeof value === "number" ? value : null;
      };

      setNote({
        time: key,
        detail: bundle.hoverByTime.get(key) ?? null,
        stock: readLine(stockSeries),
        putStrike: readLine(putSeries),
        callStrike: readLine(callSeries),
      });
    });

    chart.timeScale().fitContent();
    chartRef.current = chart;

    const resize = () => {
      if (!chartRef.current || !containerRef.current) return;
      const w = containerRef.current.clientWidth;
      if (w > 0) {
        chartRef.current.applyOptions({
          width: w,
          height: CHART_HEIGHT,
          autoSize: false,
        });
      }
    };

    const observer = new ResizeObserver(resize);
    observer.observe(containerRef.current);
    resize();

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [bundle, markers]);

  if (equityCurve.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Backtest charts
          </p>
          <div className="flex flex-wrap gap-1">
            {ZOOM_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setZoom(opt.id)}
                className={cn(
                  "rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors",
                  zoom === opt.id
                    ? "bg-accent-muted text-accent-strong"
                    : "bg-secondary/60 text-muted hover:text-foreground",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <CrosshairNoteBar note={displayNote} />

        <div
          ref={containerRef}
          className="h-[440px] min-h-[440px] max-h-[440px] w-full shrink-0 overflow-hidden rounded-lg border border-border/60"
          style={{ height: CHART_HEIGHT, minHeight: CHART_HEIGHT, maxHeight: CHART_HEIGHT }}
        />
        {bundle.rangeLabel && (
          <p className="mt-1 text-[10px] text-muted">{bundle.rangeLabel}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted">
          <LegendSwatch color="var(--color-accent-strong)" label="Wheel equity" solid />
          <LegendSwatch color="var(--color-muted)" label="Buy & hold" dashed />
          <LegendSwatch color="#ef4444" label="Drawdown %" solid />
          <LegendSwatch color="var(--color-foreground)" label="Stock" solid />
          <LegendSwatch color="#f59e0b" label="Put strike" dashed />
          <LegendSwatch color="#a855f7" label="Call strike" dashed />
          <span className="text-muted">
            · P / A / C / $ on equity = put sold, assigned, called, deposit
          </span>
        </div>
      </div>

      {bundle.phaseStrip.length > 1 && (
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
            Strategy phase
          </p>
          <div className="flex h-3 w-full overflow-hidden rounded-md border border-border/50">
            {bundle.phaseStrip.map((segment, index) => (
              <div
                key={`${segment.date}-${index}`}
                className="min-w-px flex-1"
                style={{ backgroundColor: phaseColor(segment.phase) }}
                title={`${segment.date}: ${phaseLabel(segment.phase)}`}
              />
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted">
            {(["cash", "short_put", "long_stock", "short_call"] as const).map(
              (phase) => (
                <span key={phase} className="flex items-center gap-1">
                  <span
                    className="inline-block h-2 w-2 rounded-sm"
                    style={{ backgroundColor: phaseColor(phase) }}
                  />
                  {phaseLabel(phase)}
                </span>
              ),
            )}
          </div>
        </div>
      )}

      {annualSummary.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
            Return by year
          </p>
          <div className="flex items-end gap-2 rounded-lg border border-border/60 bg-secondary/20 px-3 py-3">
            {annualSummary.map((row) => {
              const heightPct = Math.min(
                100,
                (Math.abs(row.returnPct) / annualMax) * 100,
              );
              const positive = row.returnPct >= 0;
              return (
                <div
                  key={row.year}
                  className="flex min-w-0 flex-1 flex-col items-center gap-1"
                >
                  <span
                    className={cn(
                      "text-[10px] font-medium tabular-nums",
                      positive
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-600 dark:text-red-400",
                    )}
                  >
                    {positive ? "+" : ""}
                    {row.returnPct.toFixed(1)}%
                  </span>
                  <div className="flex h-20 w-full items-end justify-center">
                    <div
                      className={cn(
                        "w-full max-w-[2.5rem] rounded-t-sm",
                        positive ? "bg-emerald-500/70" : "bg-red-500/70",
                      )}
                      style={{ height: `${Math.max(heightPct, 6)}%` }}
                      title={`${row.year}: ${row.returnPct.toFixed(2)}%`}
                    />
                  </div>
                  <span className="text-[10px] text-muted">{row.year}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-[10px] leading-relaxed text-muted">
        Same {formatUsd(startingCashUsd, 0)} starting wallet as buy &amp; hold.
        Move the crosshair — the note above tracks stock and strike lines. Zoom
        narrows the window;
        PDF export remains tables for print-friendly layout.
      </p>
    </div>
  );
}

function CrosshairNoteBar({ note }: { note: CrosshairNote | null }) {
  if (!note) {
    return (
      <div
        className="mb-2 flex items-center rounded-lg border border-border/60 bg-secondary/30 px-3 py-2 text-[10px] text-muted"
        style={{ minHeight: HOVER_PANEL_HEIGHT }}
      >
        Move the crosshair on the chart to see stock and strike prices.
      </div>
    );
  }

  const detail = note.detail;

  return (
    <div
      className="mb-2 rounded-lg border border-border/60 bg-secondary/30 px-2.5 py-2"
      style={{ minHeight: HOVER_PANEL_HEIGHT }}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 text-[10px]">
        <span className="font-semibold text-foreground">
          {formatDateMMDDYYYY(note.time)}
        </span>
        {detail && (
          <span
            className="font-medium"
            style={{ color: phaseColor(detail.phase) }}
          >
            {phaseLabel(detail.phase)}
          </span>
        )}
        {detail && (
          <span className="text-muted">
            Wheel {formatUsd(detail.equityUsd)} · B&amp;H{" "}
            {formatUsd(detail.buyAndHoldUsd)} · DD{" "}
            <span
              className={cn(
                detail.drawdownPct < 0 &&
                  "text-red-600 dark:text-red-400",
              )}
            >
              {detail.drawdownPct.toFixed(1)}%
            </span>
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <PriceNoteChip
          label="Stock"
          value={note.stock}
          swatchColor="var(--color-foreground)"
          solid
        />
        <PriceNoteChip
          label="Put strike"
          value={note.putStrike}
          swatchColor="#f59e0b"
          dashed
        />
        <PriceNoteChip
          label="Call strike"
          value={note.callStrike}
          swatchColor="#a855f7"
          dashed
        />
      </div>
    </div>
  );
}

function PriceNoteChip({
  label,
  value,
  swatchColor,
  solid,
  dashed,
}: {
  label: string;
  value: number | null;
  swatchColor: string;
  solid?: boolean;
  dashed?: boolean;
}) {
  return (
    <div className="min-w-[6.5rem] flex-1 rounded-md border border-border/50 bg-background/50 px-2 py-1">
      <p className="flex items-center gap-1 text-[10px] text-muted">
        <span
          className={cn(
            "inline-block h-0.5 w-3 shrink-0 rounded-full",
            dashed && "border border-dashed bg-transparent",
          )}
          style={
            dashed
              ? { borderColor: swatchColor }
              : { background: swatchColor }
          }
        />
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
        {value != null ? formatUsd(value, 2) : "—"}
      </p>
    </div>
  );
}

function LegendSwatch({
  color,
  label,
  solid,
  dashed,
}: {
  color: string;
  label: string;
  solid?: boolean;
  dashed?: boolean;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={cn(
          "inline-block h-0.5 w-4 rounded-full",
          dashed && "border border-dashed bg-transparent",
        )}
        style={
          dashed
            ? { borderColor: color }
            : { background: color }
        }
      />
      {label}
    </span>
  );
}
