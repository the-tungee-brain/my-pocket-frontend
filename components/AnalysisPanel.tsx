"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Filter,
  Lightbulb,
  LockKeyhole,
  MessageSquare,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import type { PositionMap } from "@/components/AccountPositionList";
import { AlertBadge } from "@/components/AlertBadge";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { ThinkingSpinner } from "@/components/ui/ThinkingSpinner";
import { usePositionsContext } from "@/app/Providers";
import { useInsights } from "@/app/hooks/useInsights";
import { Position } from "@/app/types/schwab";
import { formatSignedUsd, formatUsd } from "@/lib/formatCurrency";
import {
  isCashSecuredPut,
  isHighlightedOptionStrategy,
  optionStrategyLabel,
} from "@/lib/optionStrategyLabel";
import {
  openProfitLossPct,
  positionOpenProfitLoss,
  positionOpenProfitLossPct,
  sumCostBasis,
  sumOpenProfitLoss,
  sumPortfolioWeight,
} from "@/lib/positionMetrics";
import type { SymbolAlertSummary } from "@/lib/intelligence";
import { SEVERITY_ORDER } from "@/lib/intelligence";
import {
  ANALYZE_PORTFOLIO_EVENT,
  ANALYZE_POSITION_EVENT,
  PORTFOLIO_ANALYSIS_SECTION_ID,
  SYMBOL_ANALYSIS_SECTION_ID,
} from "@/lib/positionAnalysis";
import { scrollToChat } from "@/lib/scrollToChat";
import { symbolHubPath } from "@/lib/symbolRoutes";
import { cn } from "@/lib/utils";

type PortfolioProps = {
  mode: "portfolio";
  positions: Position[];
  positionMap: PositionMap;
  liquidationValue?: number | null;
  symbolAlertMap?: Record<string, SymbolAlertSummary>;
};

type SymbolProps = {
  mode: "symbol";
  symbol: string;
  positions: Position[];
};

type CommonProps = {
  className?: string;
  onAskFollowUp?: () => void;
  onLoadingChange?: (loading: boolean) => void;
  autoStart?: boolean;
};

export type AnalysisPanelProps = CommonProps & (PortfolioProps | SymbolProps);

type SymbolSummary = {
  symbol: string;
  positions: Position[];
  totalValue: number;
  dayPL: number;
  openPL: number | null;
  costBasis: number | null;
  weightPct: number | null;
};

type SortKey = "weight" | "value" | "openPL" | "dayPL" | "alerts";

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "weight", label: "Weight" },
  { id: "value", label: "Value" },
  { id: "openPL", label: "Open P/L" },
  { id: "dayPL", label: "Today" },
  { id: "alerts", label: "Alerts" },
];

function StatChip({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-background/50 px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p
        className={cn(
          "mt-0.5 text-sm font-semibold tabular-nums",
          tone === "positive" && "text-success",
          tone === "negative" && "text-danger",
          tone === "neutral" && "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function AnalyzePrompt({
  isPortfolio,
  symbol,
  label,
  loading,
  onClick,
}: {
  isPortfolio: boolean;
  symbol: string | null;
  label: string;
  loading: boolean;
  onClick: () => void;
}) {
  const title = isPortfolio
    ? "Get an AI read on your portfolio"
    : `Get an AI read on ${symbol}`;

  const description = isPortfolio
    ? "Summarizes concentration, options risk, notable movers, and one recommended next step — without leaving this page."
    : "Summarizes your holdings, P/L, options risk, and one recommended next step — without leaving this page.";

  return (
    <div className="border-t border-border bg-linear-to-b from-surface-elevated/30 to-transparent px-4 py-6 sm:py-7">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/25 bg-accent-muted/70 text-accent-strong shadow-sm">
          <Sparkles className="h-5 w-5" aria-hidden />
        </div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p>
        <button
          type="button"
          disabled={loading}
          onClick={onClick}
          className={cn(
            "mt-5 inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            loading
              ? "cursor-wait border-border bg-muted-bg text-muted"
              : "border-accent/35 bg-accent-muted/50 text-accent-strong shadow-sm hover:border-accent/55 hover:bg-accent-muted active:scale-[0.98]",
          )}
        >
          <Sparkles
            className={cn(
              "h-4 w-4",
              loading && "animate-pulse motion-reduce:animate-none",
            )}
            aria-hidden
          />
          {loading ? "Analyzing…" : label}
        </button>
      </div>
    </div>
  );
}

function PositionTypeChip({
  position,
  siblingPositions,
}: {
  position: Position;
  siblingPositions: Position[];
}) {
  const chipLabel = optionStrategyLabel(position, siblingPositions);
  if (!chipLabel) return null;

  const highlighted = isHighlightedOptionStrategy(position, siblingPositions);
  const isCsp = isCashSecuredPut(position);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        highlighted
          ? "bg-accent/15 text-accent-strong"
          : "bg-muted-bg text-muted",
      )}
    >
      {isCsp && <LockKeyhole className="h-3 w-3 shrink-0" aria-hidden />}
      {chipLabel}
    </span>
  );
}

function positionKey(p: Position) {
  return `${p.instrument.symbol}-${p.instrument.cusip}-${p.longQuantity}-${p.shortQuantity}`;
}

function positionLabel(p: Position) {
  return p.instrument.description ?? p.instrument.assetType ?? "Position";
}

function buildSymbolSummaries(
  positionMap: PositionMap,
  liquidationValue?: number | null,
): SymbolSummary[] {
  return Object.entries(positionMap).map(([sym, rows]) => {
    const totalValue = rows.reduce((sum, p) => sum + p.marketValue, 0);
    const openPL = sumOpenProfitLoss(rows);
    const costBasis = sumCostBasis(rows);

    return {
      symbol: sym,
      positions: rows,
      totalValue,
      dayPL: rows.reduce((sum, p) => sum + p.currentDayProfitLoss, 0),
      openPL,
      costBasis,
      weightPct: sumPortfolioWeight(rows, liquidationValue),
    };
  });
}

function compareByAlerts(
  a: SymbolSummary,
  b: SymbolSummary,
  symbolAlertMap: Record<string, SymbolAlertSummary>,
) {
  const alertA = symbolAlertMap[a.symbol];
  const alertB = symbolAlertMap[b.symbol];
  if (alertA && !alertB) return -1;
  if (!alertA && alertB) return 1;
  if (alertA && alertB) {
    const severityDiff =
      SEVERITY_ORDER[alertA.topSeverity] - SEVERITY_ORDER[alertB.topSeverity];
    if (severityDiff !== 0) return severityDiff;
    return alertB.count - alertA.count;
  }
  return b.totalValue - a.totalValue;
}

function sortSummaries(
  summaries: SymbolSummary[],
  sortKey: SortKey,
  symbolAlertMap: Record<string, SymbolAlertSummary>,
) {
  return [...summaries].sort((a, b) => {
    switch (sortKey) {
      case "weight":
        return (b.weightPct ?? 0) - (a.weightPct ?? 0);
      case "value":
        return b.totalValue - a.totalValue;
      case "openPL":
        return (
          (b.openPL ?? Number.NEGATIVE_INFINITY) -
          (a.openPL ?? Number.NEGATIVE_INFINITY)
        );
      case "dayPL":
        return b.dayPL - a.dayPL;
      case "alerts":
        return compareByAlerts(a, b, symbolAlertMap);
      default:
        return 0;
    }
  });
}

function PortfolioHoldingsTable({
  summaries,
  symbolAlertMap,
}: {
  summaries: SymbolSummary[];
  symbolAlertMap: Record<string, SymbolAlertSummary>;
}) {
  const router = useRouter();

  return (
    <>
      <div className="hidden sm:block">
        <table className="w-full table-fixed text-sm">
          <thead className="border-b border-border bg-surface-elevated/60 text-[11px] font-medium uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-2.5 text-left">Symbol</th>
              <th className="px-4 py-2.5 text-right">Weight</th>
              <th className="px-4 py-2.5 text-right">Value</th>
              <th className="px-4 py-2.5 text-right">Open P/L</th>
              <th className="px-4 py-2.5 text-right">Today</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map(
              ({ symbol, totalValue, dayPL, openPL, costBasis, weightPct }) => {
                const openPLPctVal = openProfitLossPct(openPL, costBasis);

                return (
                  <tr
                    key={symbol}
                    role="link"
                    tabIndex={0}
                    onClick={() =>
                      router.push(symbolHubPath(symbol, "overview"))
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        router.push(symbolHubPath(symbol, "overview"));
                      }
                    }}
                    className="cursor-pointer border-t border-border transition-colors hover:bg-muted-bg/40"
                  >
                    <td className="px-4 py-3 text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-foreground">
                          {symbol}
                        </span>
                        {symbolAlertMap[symbol] && (
                          <AlertBadge
                            summary={symbolAlertMap[symbol]}
                            compact
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted">
                      {weightPct != null ? `${weightPct.toFixed(1)}%` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatUsd(totalValue)}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right tabular-nums",
                        openPL == null
                          ? "text-muted"
                          : openPL >= 0
                            ? "text-success"
                            : "text-danger",
                      )}
                    >
                      {openPL != null ? (
                        <>
                          {formatSignedUsd(openPL)}
                          {openPLPctVal != null && (
                            <span className="block text-[11px] opacity-80">
                              ({openPLPctVal >= 0 ? "+" : ""}
                              {openPLPctVal.toFixed(1)}%)
                            </span>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-3 text-right tabular-nums",
                        dayPL >= 0 ? "text-success" : "text-danger",
                      )}
                    >
                      {formatSignedUsd(dayPL)}
                    </td>
                  </tr>
                );
              },
            )}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-border sm:hidden">
        {summaries.map(
          ({ symbol, totalValue, dayPL, openPL, costBasis, weightPct }) => {
            const openPLPctVal = openProfitLossPct(openPL, costBasis);

            return (
              <Link
                key={symbol}
                href={symbolHubPath(symbol, "overview")}
                className="flex items-center justify-between gap-3 px-4 py-3 transition hover:bg-muted-bg/40"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-foreground">
                      {symbol}
                    </span>
                    {symbolAlertMap[symbol] && (
                      <AlertBadge summary={symbolAlertMap[symbol]} compact />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    {weightPct != null ? `${weightPct.toFixed(1)}% · ` : ""}
                    {formatUsd(totalValue)}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      "text-xs tabular-nums font-medium",
                      dayPL >= 0 ? "text-success" : "text-danger",
                    )}
                  >
                    {formatSignedUsd(dayPL)}
                  </p>
                  {openPL != null && (
                    <p
                      className={cn(
                        "text-[11px] tabular-nums",
                        openPL >= 0 ? "text-success" : "text-danger",
                      )}
                    >
                      {formatSignedUsd(openPL)}
                    </p>
                  )}
                </div>
              </Link>
            );
          },
        )}
      </div>
    </>
  );
}

function SymbolLegsTable({ positions }: { positions: Position[] }) {
  const sorted = [...positions].sort(
    (a, b) => b.longQuantity - b.shortQuantity - (a.longQuantity - a.shortQuantity),
  );

  if (sorted.length === 1) {
    const p = sorted[0];
    const qty = p.longQuantity - p.shortQuantity;
    const openPL = positionOpenProfitLoss(p);
    const openPLPctVal = positionOpenProfitLossPct(p);

    return (
      <div className="px-4 py-3 text-sm">
        <p className="font-medium text-foreground">{positionLabel(p)}</p>
        <div className="mt-1">
          <PositionTypeChip position={p} siblingPositions={sorted} />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <div>
            <p className="text-muted">Qty</p>
            <p className="mt-0.5 tabular-nums font-medium">{qty.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted">Value</p>
            <p className="mt-0.5 tabular-nums font-medium">{formatUsd(p.marketValue)}</p>
          </div>
          <div>
            <p className="text-muted">Open P/L</p>
            <p
              className={cn(
                "mt-0.5 tabular-nums font-medium",
                openPL == null
                  ? "text-muted"
                  : openPL >= 0
                    ? "text-success"
                    : "text-danger",
              )}
            >
              {openPL != null ? formatSignedUsd(openPL) : "—"}
              {openPLPctVal != null && ` (${openPLPctVal.toFixed(1)}%)`}
            </p>
          </div>
          <div>
            <p className="text-muted">Today</p>
            <p
              className={cn(
                "mt-0.5 tabular-nums font-medium",
                p.currentDayProfitLoss >= 0 ? "text-success" : "text-danger",
              )}
            >
              {formatSignedUsd(p.currentDayProfitLoss)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="hidden sm:block">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface-elevated/60 text-[11px] font-medium uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-2.5 text-left">Leg</th>
              <th className="px-4 py-2.5 text-right">Qty</th>
              <th className="px-4 py-2.5 text-right">Value</th>
              <th className="px-4 py-2.5 text-right">Open P/L</th>
              <th className="px-4 py-2.5 text-right">Today</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => {
              const qty = p.longQuantity - p.shortQuantity;
              const openPL = positionOpenProfitLoss(p);
              const openPLPctVal = positionOpenProfitLossPct(p);

              return (
                <tr
                  key={positionKey(p)}
                  className="border-t border-border transition-colors hover:bg-muted-bg/30"
                >
                  <td className="px-4 py-3 text-left">
                    <p className="text-sm text-foreground">{positionLabel(p)}</p>
                    <PositionTypeChip position={p} siblingPositions={sorted} />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {qty.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatUsd(p.marketValue)}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right tabular-nums",
                      openPL == null
                        ? "text-muted"
                        : openPL >= 0
                          ? "text-success"
                          : "text-danger",
                    )}
                  >
                    {openPL != null ? formatSignedUsd(openPL) : "—"}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 text-right tabular-nums",
                      p.currentDayProfitLoss >= 0 ? "text-success" : "text-danger",
                    )}
                  >
                    {formatSignedUsd(p.currentDayProfitLoss)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-border sm:hidden">
        {sorted.map((p) => {
          const qty = p.longQuantity - p.shortQuantity;
          const openPL = positionOpenProfitLoss(p);

          return (
            <div key={positionKey(p)} className="px-4 py-3">
              <p className="text-sm font-medium text-foreground">
                {positionLabel(p)}
              </p>
              <div className="mt-1">
                <PositionTypeChip position={p} siblingPositions={sorted} />
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted">Qty</p>
                  <p className="tabular-nums font-medium">{qty.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted">Value</p>
                  <p className="tabular-nums font-medium">{formatUsd(p.marketValue)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function AnalysisPanel(props: AnalysisPanelProps) {
  const { className, onAskFollowUp, onLoadingChange, autoStart = false } = props;
  const isPortfolio = props.mode === "portfolio";
  const symbol = isPortfolio ? null : props.symbol.toUpperCase();
  const positions = props.positions;

  const { account, sessionAccessToken } = usePositionsContext();
  const [requested, setRequested] = useState(autoStart);
  const [sortKey, setSortKey] = useState<SortKey>("weight");
  const [alertsOnly, setAlertsOnly] = useState(false);

  const symbolAlertMap = isPortfolio ? (props.symbolAlertMap ?? {}) : {};
  const positionMap = isPortfolio ? props.positionMap : null;
  const liquidationValue = isPortfolio ? props.liquidationValue : null;

  const label = useMemo(
    () => (positions.length ? (symbol ?? "PORTFOLIO") : null),
    [symbol, positions.length],
  );

  const prompt = useMemo(
    () =>
      symbol
        ? `Review my ${symbol} position — holdings breakdown, open and day P/L, options exposure, assignment risk, and the single best action I should take today. Be concise and actionable.`
        : `Review my portfolio — concentration, top risks, options exposure, notable movers, and the single best action I should take today. Be concise and actionable.`,
    [symbol],
  );

  const { loading, error, content, refetch } = useInsights(
    {
      label,
      positions,
      account,
      accessToken: sessionAccessToken || null,
      enabled: requested,
      prompt,
    },
    "gpt-5.4",
  );

  useEffect(() => {
    if (autoStart) setRequested(true);
  }, [autoStart]);

  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  useEffect(() => {
    const handlePositionAnalyze = (event: Event) => {
      if (isPortfolio) return;
      const detail = (event as CustomEvent<{ symbol?: string }>).detail;
      if (symbol && detail?.symbol && detail.symbol !== symbol) return;
      setRequested(true);
    };

    const handlePortfolioAnalyze = () => {
      if (!isPortfolio) return;
      setRequested(true);
    };

    window.addEventListener(ANALYZE_POSITION_EVENT, handlePositionAnalyze);
    window.addEventListener(ANALYZE_PORTFOLIO_EVENT, handlePortfolioAnalyze);
    return () => {
      window.removeEventListener(ANALYZE_POSITION_EVENT, handlePositionAnalyze);
      window.removeEventListener(ANALYZE_PORTFOLIO_EVENT, handlePortfolioAnalyze);
    };
  }, [isPortfolio, symbol]);

  const symbolSummaries = useMemo(() => {
    if (!isPortfolio || !positionMap) return [];
    const base = buildSymbolSummaries(positionMap, liquidationValue);
    const filtered = alertsOnly
      ? base.filter((row) => symbolAlertMap[row.symbol])
      : base;
    return sortSummaries(filtered, sortKey, symbolAlertMap);
  }, [
    alertsOnly,
    isPortfolio,
    liquidationValue,
    positionMap,
    sortKey,
    symbolAlertMap,
  ]);

  if (!positions.length) return null;

  const sectionId = isPortfolio
    ? PORTFOLIO_ANALYSIS_SECTION_ID
    : SYMBOL_ANALYSIS_SECTION_ID;

  const title = isPortfolio ? "Portfolio" : symbol!;
  const analyzeLabel = isPortfolio ? "Analyze portfolio" : "Analyze position";
  const hasContent = !!content;
  const isIdle = !requested && !hasContent && !loading && !error;
  const showAnalysisOutput = requested || hasContent || error;

  const totalValue = positions.reduce((sum, p) => sum + p.marketValue, 0);
  const openPL = sumOpenProfitLoss(positions);
  const costBasis = sumCostBasis(positions);
  const openPLPctVal = openProfitLossPct(openPL, costBasis);
  const dayPL = positions.reduce((sum, p) => sum + p.currentDayProfitLoss, 0);
  const openTone =
    openPL == null ? "neutral" : openPL >= 0 ? "positive" : "negative";
  const dayTone = dayPL >= 0 ? "positive" : "negative";

  const alertSymbolCount = isPortfolio
    ? Object.keys(symbolAlertMap).filter((s) => positionMap?.[s]).length
    : 0;

  const symbolCount = isPortfolio ? Object.keys(positionMap ?? {}).length : 0;

  const handleStart = () => setRequested(true);

  const handleRefresh = () => {
    if (hasContent || error) refetch();
    else setRequested(true);
  };

  const handleFollowUp = () => {
    if (onAskFollowUp) {
      onAskFollowUp();
      return;
    }
    scrollToChat();
  };

  return (
    <section
      id={sectionId}
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-secondary/60 shadow-sm",
        className,
      )}
    >
      <div className="border-b border-border bg-surface-elevated/50 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent-strong">
              <Lightbulb className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-foreground">{title}</h2>
              <p className="text-[11px] text-muted">
                {isPortfolio
                  ? `${symbolCount} symbols · holdings & AI review`
                  : `${positions.length} ${positions.length === 1 ? "leg" : "legs"} · holdings & AI review`}
              </p>
            </div>
          </div>
          {requested && (
            <button
              type="button"
              disabled={loading}
              onClick={handleRefresh}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium text-muted transition hover:bg-muted-bg hover:text-foreground disabled:opacity-60"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", loading && "animate-spin")}
                aria-hidden
              />
              Refresh
            </button>
          )}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <StatChip label="Value" value={formatUsd(totalValue)} />
          <StatChip
            label="Open P/L"
            value={
              openPL != null
                ? `${formatSignedUsd(openPL)}${
                    openPLPctVal != null
                      ? ` (${openPLPctVal >= 0 ? "+" : ""}${openPLPctVal.toFixed(1)}%)`
                      : ""
                  }`
                : "—"
            }
            tone={openTone}
          />
          <StatChip label="Today" value={formatSignedUsd(dayPL)} tone={dayTone} />
        </div>
      </div>

      {isPortfolio && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
            Holdings
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {alertSymbolCount > 0 && (
              <button
                type="button"
                onClick={() => setAlertsOnly((on) => !on)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
                  alertsOnly
                    ? "border-accent/40 bg-accent-muted text-accent-strong"
                    : "border-border bg-background text-muted hover:text-foreground",
                )}
              >
                <Filter className="h-3 w-3" aria-hidden />
                Alerts ({alertSymbolCount})
              </button>
            )}
            <div className="flex flex-wrap gap-1 rounded-lg bg-muted-bg/50 p-0.5">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSortKey(option.id)}
                  className={cn(
                    "rounded-md px-2 py-1 text-[11px] font-medium transition",
                    sortKey === option.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted hover:text-foreground",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {!isPortfolio && positions.length > 1 && (
        <div className="border-b border-border px-4 py-2.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
            Holdings
          </p>
        </div>
      )}

      <div className="border-b border-border bg-background/20">
        {isPortfolio ? (
          alertsOnly && symbolSummaries.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">
              No holdings match the alert filter.
            </p>
          ) : (
            <PortfolioHoldingsTable
              summaries={symbolSummaries}
              symbolAlertMap={symbolAlertMap}
            />
          )
        ) : (
          <SymbolLegsTable positions={positions} />
        )}
      </div>

      {isIdle && (
        <AnalyzePrompt
          isPortfolio={isPortfolio}
          symbol={symbol}
          label={analyzeLabel}
          loading={loading}
          onClick={handleStart}
        />
      )}

      {showAnalysisOutput && (
        <div className="px-4 py-4">
          {loading && !content && (
            <ThinkingSpinner
              message={`Analyzing ${isPortfolio ? "portfolio" : symbol}…`}
            />
          )}

          {error && (
            <ErrorBanner message={error} onRetry={refetch} className="mb-3" />
          )}

          {content && (
            <div
              className={cn(
                "text-sm leading-relaxed text-foreground",
                loading && "opacity-90",
              )}
            >
              <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-muted">
                AI analysis
              </p>
              <MarkdownRenderer content={content} />
              {loading && (
                <p className="mt-3 text-[11px] text-muted">Still writing…</p>
              )}
            </div>
          )}

          {requested && !loading && !error && !content && (
            <div className="space-y-3 py-4 text-center">
              <p className="text-sm text-muted">Analysis unavailable right now.</p>
              <button
                type="button"
                onClick={refetch}
                className="text-sm font-medium text-accent-strong hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {hasContent && !loading && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-3">
              <p className="text-[11px] text-muted">
                Generated from your Schwab holdings
              </p>
              <button
                type="button"
                onClick={handleFollowUp}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-accent-strong transition hover:underline"
              >
                <MessageSquare className="h-3.5 w-3.5" aria-hidden />
                Ask a follow-up in chat
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
