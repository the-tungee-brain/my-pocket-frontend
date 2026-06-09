"use client";

import { RefreshCw } from "lucide-react";
import { useTradeReplay } from "@/app/hooks/useTradeReplay";
import type {
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
  severityClass,
} from "@/lib/tradeReplay";
import { cn } from "@/lib/utils";

type SessionReplaySectionProps = {
  symbol: string;
  accessToken?: string | null;
  workflow: TradeReplayWorkflow;
  enabled?: boolean;
  className?: string;
};

function formatEventTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function actionabilityClass(actionability: TradeReplayActionability): string {
  if (actionability === "active") return "border-success/40 text-success";
  if (actionability === "invalidated") return "border-danger/40 text-danger";
  return "border-warning/50 text-warning";
}

function sourceLabel(event: TradeReplayEvent): string | null {
  if (event.source === "realtime") return null;
  return event.source_freshness_label ?? event.source;
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

function SessionReplayEventRow({ event }: { event: TradeReplayEvent }) {
  const source = sourceLabel(event);

  return (
    <li className={cn("grid gap-3 border-l pl-4 sm:grid-cols-[7rem_minmax(0,1fr)]", severityClass(event.severity))}>
      <time className="text-xs font-medium tabular-nums text-muted">
        {formatEventTime(event.event_time)}
      </time>
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

export function SessionReplaySection({
  symbol,
  accessToken,
  workflow,
  enabled = true,
  className,
}: SessionReplaySectionProps) {
  const { replay, isLoading, isRefreshing, error, refetch } = useTradeReplay(
    symbol,
    accessToken ?? undefined,
    workflow,
    { enabled },
  );
  const events = replay?.events ?? [];
  const delayed =
    replay?.source === "delayed" ||
    events.some((event) => event.source === "delayed");

  return (
    <ResearchSection
      title="Today’s Missed Moves"
      className={className}
      action={
        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isLoading || isRefreshing}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition hover:text-foreground disabled:opacity-60"
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")}
            aria-hidden
          />
          Refresh
        </button>
      }
    >
      {isLoading ? (
        <SessionReplaySkeleton />
      ) : error ? (
        <p className="text-sm leading-relaxed text-muted">{error}</p>
      ) : events.length ? (
        <div className="space-y-4">
          {delayed ? (
            <p className="border-l border-warning/50 pl-3 text-sm font-medium text-warning">
              Replay uses delayed/polled data. Treat this as educational review,
              not live execution.
            </p>
          ) : null}
          <ol className="space-y-4">
            {events.map((event) => (
              <SessionReplayEventRow
                key={`${event.event_type}-${event.dedupe_key ?? event.id}`}
                event={event}
              />
            ))}
          </ol>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">
            No replay events yet.
          </p>
          <p className={researchMemo.rowBody}>
            Tomcrest will show triggered entries, targets, stops, and
            invalidations here as bars update.
          </p>
        </div>
      )}
    </ResearchSection>
  );
}
