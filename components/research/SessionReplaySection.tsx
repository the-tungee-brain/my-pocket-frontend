"use client";

import { RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import {
  useMissedMovesSummary,
  useTradeReplay,
} from "@/app/hooks/useTradeReplay";
import type {
  DayTradeReplayDirectionMode,
  MissedMoveOutcome,
  MissedMoveSummaryRow,
  MissedMovesRange,
  MissedMovesSort,
  TradeReplayActionability,
  TradeReplayEvent,
  TradeReplayWorkflow,
} from "@/app/types/tradeReplay";
import {
  ResearchSection,
  researchMemo,
} from "@/components/research/ResearchMemoPrimitives";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  actionabilityLabel,
  eventTitle,
  formatReplayEventTime,
  replaySessionLabel,
  severityClass,
} from "@/lib/tradeReplay";
import { cn } from "@/lib/utils";

type SessionReplaySectionProps = {
  symbol: string;
  accessToken?: string | null;
  workflow: TradeReplayWorkflow;
  enabled?: boolean;
  className?: string;
  direction?: "long" | "short" | "both";
};

const RANGE_OPTIONS: { value: MissedMovesRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "last_5_trading_days", label: "Last 5 Trading Days" },
];

function directionToBackendMode(
  direction: "long" | "short" | "both",
): DayTradeReplayDirectionMode {
  if (direction === "long") return "long_only";
  if (direction === "short") return "short_only";
  return "long_and_short";
}

const SORT_OPTIONS: { value: MissedMovesSort; label: string }[] = [
  { value: "most_recent", label: "Most recent" },
  { value: "biggest_move", label: "Biggest move" },
  { value: "highest_setup_quality", label: "Highest setup quality" },
];

function actionabilityClass(actionability: TradeReplayActionability): string {
  if (actionability === "active") return "border-success/40 text-success";
  if (actionability === "invalidated") return "border-danger/40 text-danger";
  return "border-warning/50 text-warning";
}

function outcomeLabel(outcome: MissedMoveOutcome): string {
  const labels: Record<MissedMoveOutcome, string> = {
    target_hit: "Target Hit",
    extended: "Extended",
    invalidated: "Invalidated",
    stopped: "Stopped",
  };
  return labels[outcome];
}

function outcomeClass(outcome: MissedMoveOutcome): string {
  if (outcome === "target_hit") return "border-success/40 text-success";
  if (outcome === "extended") return "border-warning/50 text-warning";
  if (outcome === "stopped") return "border-danger/40 text-danger";
  return "border-muted/40 text-muted";
}

function formatReplayDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function formatPrice(value: number | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatMove(value: number | null): string {
  if (value == null) return "—";
  const normalized = Math.abs(value) > 1 ? value / 100 : value;
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(normalized);
}

function sourceLabel(event: TradeReplayEvent): string | null {
  if (event.source === "realtime") return null;
  return event.source_freshness_label ?? event.source;
}

function textDirection(value: string): "long" | "short" | "neutral" {
  const lower = value.toLowerCase();
  if (/\bshort\b|breakdown|below|downside/.test(lower)) return "short";
  if (/\blong\b|breakout|above|upside/.test(lower)) return "long";
  return "neutral";
}

function eventMatchesDirection(
  event: TradeReplayEvent,
  direction: "long" | "short" | "both",
): boolean {
  if (direction === "both") return true;
  const inferred = textDirection(`${event.event_type} ${event.message}`);
  return inferred === "neutral" || inferred === direction;
}

function summaryRowMatchesDirection(
  row: MissedMoveSummaryRow,
  direction: "long" | "short" | "both",
): boolean {
  if (direction === "both") return true;
  const inferred = textDirection(row.setup_type);
  return inferred === "neutral" || inferred === direction;
}

function SessionReplaySkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

function MissedMovesDisclaimer() {
  return (
    <p className="border-l border-warning/50 pl-3 text-sm font-medium text-warning">
      Replay uses delayed/polled data. Treat this as educational review, not
      live execution.
    </p>
  );
}

function SessionReplayEventRow({ event }: { event: TradeReplayEvent }) {
  const source = sourceLabel(event);
  const session = replaySessionLabel(event.event_time);

  return (
    <li
      className={cn(
        "grid gap-3 border-l pl-4 sm:grid-cols-[7rem_minmax(0,1fr)]",
        severityClass(event.severity),
      )}
    >
      <div className="space-y-1">
        <time className="block text-xs font-medium tabular-nums text-muted">
          {formatReplayEventTime(event.event_time)}
        </time>
        {session ? (
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            {session}
          </p>
        ) : null}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-foreground">
            {eventTitle(event.event_type)}
          </p>
          <span
            className={cn(
              "inline-flex border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
              actionabilityClass(event.actionability),
            )}
          >
            {actionabilityLabel(event.actionability)}
          </span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          {event.message}
        </p>
        {source ? (
          <p className="mt-1 text-[11px] font-medium text-muted">{source}</p>
        ) : null}
      </div>
    </li>
  );
}

function SessionReplayTimeline({
  events,
  delayed,
}: {
  events: TradeReplayEvent[];
  delayed: boolean;
}) {
  return (
    <div className="space-y-4">
      {delayed ? <MissedMovesDisclaimer /> : null}
      <ol className="space-y-4">
        {events.map((event) => (
          <SessionReplayEventRow
            key={`${event.event_type}-${event.dedupe_key ?? event.id}`}
            event={event}
          />
        ))}
      </ol>
    </div>
  );
}

function MissedMoveSummaryItem({
  row,
  selected,
  onSelect,
}: {
  row: MissedMoveSummaryRow;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "grid w-full gap-3 border border-border bg-background px-3 py-3 text-left transition hover:border-accent/60 sm:grid-cols-[5.5rem_4rem_minmax(0,1fr)_6rem_6rem]",
        selected && "border-accent/70 bg-muted-bg/40",
      )}
      aria-pressed={selected}
    >
      <div>
        <p className="text-xs font-medium tabular-nums text-muted">
          {formatReplayDate(row.date)}
        </p>
        <p className="mt-1 text-xs font-semibold text-foreground">
          {row.symbol.toUpperCase()}
        </p>
      </div>
      <div className="sm:hidden">
        <span
          className={cn(
            "inline-flex border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            outcomeClass(row.outcome),
          )}
        >
          {outcomeLabel(row.outcome)}
        </span>
      </div>
      <div className="min-w-0 sm:col-span-2">
        <p className="truncate text-sm font-semibold text-foreground">
          {row.setup_type}
        </p>
        <p className="mt-1 text-xs text-muted">
          Trigger {formatPrice(row.trigger_price)}
        </p>
      </div>
      <p className="text-xs font-semibold tabular-nums text-foreground">
        {formatMove(row.max_move_after_trigger_pct)}
      </p>
      <div className="hidden sm:block">
        <span
          className={cn(
            "inline-flex border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            outcomeClass(row.outcome),
          )}
        >
          {outcomeLabel(row.outcome)}
        </span>
      </div>
    </button>
  );
}

export function SessionReplaySection({
  symbol,
  accessToken,
  workflow,
  enabled = true,
  className,
  direction = "both",
}: SessionReplaySectionProps) {
  const [range, setRange] = useState<MissedMovesRange>("today");
  const [sort, setSort] = useState<MissedMovesSort>("most_recent");
  const [selectedRow, setSelectedRow] = useState<MissedMoveSummaryRow | null>(
    null,
  );
  const summaryEnabled = enabled && range === "last_5_trading_days";
  const selectedWorkflow = selectedRow?.workflow ?? workflow;
  const directionMode =
    workflow === "day_trade" ? directionToBackendMode(direction) : undefined;
  const selectedDirectionMode =
    selectedWorkflow === "day_trade"
      ? directionToBackendMode(direction)
      : undefined;
  const { replay, isLoading, isRefreshing, error, refetch } = useTradeReplay(
    symbol,
    accessToken ?? undefined,
    workflow,
    {
      enabled: enabled && range === "today",
      directionMode,
    },
  );
  const summary = useMissedMovesSummary(
    symbol,
    accessToken ?? undefined,
    workflow,
    "last_5_trading_days",
    sort,
    { enabled: summaryEnabled },
  );
  const selectedReplay = useTradeReplay(
    selectedRow?.symbol,
    accessToken ?? undefined,
    selectedWorkflow,
    {
      enabled: summaryEnabled && Boolean(selectedRow),
      refreshOnLoad: false,
      date: selectedRow?.date,
      missedMoveId: selectedRow?.id,
      directionMode: selectedDirectionMode,
    },
  );
  const events = (replay?.events ?? []).filter((event) =>
    eventMatchesDirection(event, direction),
  );
  const delayed =
    replay?.source === "delayed" ||
    events.some((event) => event.source === "delayed");
  const selectedEvents = (selectedReplay.replay?.events ?? []).filter((event) =>
    eventMatchesDirection(event, direction),
  );
  const selectedDelayed =
    selectedReplay.replay?.source === "delayed" ||
    selectedEvents.some((event) => event.source === "delayed");
  const selectedRowKey = selectedRow ? String(selectedRow.id) : null;
  const rows = summary.rows.filter((row) =>
    summaryRowMatchesDirection(row, direction),
  );
  const rangeTabs = useMemo(
    () =>
      RANGE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => {
            setRange(option.value);
            setSelectedRow(null);
          }}
          className={cn(
            "border px-3 py-1.5 text-xs font-semibold transition",
            range === option.value
              ? "border-accent/70 bg-muted-bg text-foreground"
              : "border-border text-muted hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      )),
    [range],
  );

  return (
    <ResearchSection
      title={
        workflow === "day_trade" ? "Setup Timeline" : "Today’s Missed Moves"
      }
      className={className}
      action={
        <button
          type="button"
          onClick={() => {
            if (range === "today") {
              void refetch();
              return;
            }
            void summary.refetch();
          }}
          disabled={
            isLoading ||
            isRefreshing ||
            summary.isLoading ||
            summary.isRefreshing
          }
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition hover:text-foreground disabled:opacity-60"
        >
          <RefreshCw
            className={cn(
              "h-3.5 w-3.5",
              (isRefreshing || summary.isLoading || summary.isRefreshing) &&
                "animate-spin",
            )}
            aria-hidden
          />
          Refresh
        </button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">{rangeTabs}</div>
      {range === "today" ? (
        isLoading ? (
          <SessionReplaySkeleton />
        ) : error ? (
          <p className="text-sm leading-relaxed text-muted">{error}</p>
        ) : events.length ? (
          <SessionReplayTimeline events={events} delayed={delayed} />
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">
              No qualifying missed moves in the selected period.
            </p>
            <p className={researchMemo.rowBody}>
              Tomcrest will show triggered entries, targets, stops, and
              invalidations here as bars update.
            </p>
          </div>
        )
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <MissedMovesDisclaimer />
            <label className="flex items-center gap-2 text-xs font-medium text-muted">
              Sort
              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value as MissedMovesSort);
                  setSelectedRow(null);
                }}
                className="border border-border bg-background px-2 py-1.5 text-xs font-semibold text-foreground"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {summary.isLoading ? (
            <SessionReplaySkeleton />
          ) : summary.error ? (
            <p className="text-sm leading-relaxed text-muted">
              {summary.error}
            </p>
          ) : rows.length ? (
            <div className="space-y-3">
              <div className="hidden grid-cols-[5.5rem_4rem_minmax(0,1fr)_6rem_6rem] gap-3 px-3 text-[10px] font-semibold uppercase tracking-wide text-muted sm:grid">
                <span>Date</span>
                <span>Symbol</span>
                <span>Setup type</span>
                <span>Max move</span>
                <span>Outcome</span>
              </div>
              <div className="space-y-2">
                {rows.map((row) => (
                  <MissedMoveSummaryItem
                    key={row.id}
                    row={row}
                    selected={selectedRowKey === String(row.id)}
                    onSelect={() => setSelectedRow(row)}
                  />
                ))}
              </div>
              {selectedRow ? (
                <div className="border-t border-border pt-4">
                  {selectedReplay.isLoading ? (
                    <SessionReplaySkeleton />
                  ) : selectedReplay.error ? (
                    <p className="text-sm leading-relaxed text-muted">
                      {selectedReplay.error}
                    </p>
                  ) : selectedEvents.length ? (
                    <SessionReplayTimeline
                      events={selectedEvents}
                      delayed={selectedDelayed}
                    />
                  ) : (
                    <p className="text-sm font-semibold text-foreground">
                      No qualifying missed moves in the selected period.
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          ) : (
            <p className="text-sm font-semibold text-foreground">
              No qualifying missed moves in the selected period.
            </p>
          )}
        </div>
      )}
    </ResearchSection>
  );
}
