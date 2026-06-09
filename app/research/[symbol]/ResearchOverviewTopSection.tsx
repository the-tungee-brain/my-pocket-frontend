"use client";

import Link from "next/link";
import { CalendarClock, CalendarRange, TrendingUp } from "lucide-react";
import { useSession } from "next-auth/react";
import { useResearchEvents } from "@/app/hooks/useResearchEvents";
import type { EventTimelineEntry } from "@/app/types/intelligence";
import {
  ResearchRow,
  ResearchSection,
  researchMemo,
} from "@/components/research/ResearchMemoPrimitives";
import { TickerKeyStats } from "@/components/TickerKeyStats";
import { formatFriendlyDate } from "@/lib/dateUtils";
import { pageSectionClass } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";
import { ResearchStockChart } from "./ResearchStockChart";
import { useResearchSymbolIntelligence } from "./ResearchSymbolIntelligenceContext";

type Props = {
  symbol: string;
};

function EventsWarningsSection({
  events,
  eventsLoading,
  eventsError,
  warnings,
  className,
}: {
  events: EventTimelineEntry[];
  eventsLoading?: boolean;
  eventsError?: string | null;
  warnings: string[];
  className?: string;
}) {
  const visibleWarnings = warnings
    .map((warning) => warning.trim())
    .filter(Boolean)
    .filter((warning, index, all) => all.indexOf(warning) === index)
    .slice(0, 3);
  const visibleEvents = Array.from(
    new Map(
      events.map((event) => [
        `${event.date}-${event.title}-${event.kind ?? ""}-${event.url ?? ""}`,
        event,
      ]),
    ).values(),
  ).slice(0, 3);

  if (
    !visibleEvents.length &&
    !eventsLoading &&
    !eventsError &&
    !visibleWarnings.length
  ) {
    return null;
  }

  return (
    <ResearchSection title="Events / Warnings" className={className}>
      <div className="divide-y divide-border/60">
        {visibleEvents.map((event) => (
          <ResearchRow
            key={`${event.date}-${event.title}-${event.kind ?? ""}-${
              event.url ?? ""
            }`}
            label={formatFriendlyDate(event.date)}
            status={event.title}
          />
        ))}
        {eventsLoading && !events.length ? (
          <ResearchRow label="Events" status="Loading recent events" />
        ) : null}
        {eventsError ? (
          <ResearchRow label="Events" status="Unavailable" body={eventsError} />
        ) : null}
        {visibleWarnings.map((warning) => (
          <ResearchRow
            key={warning}
            label="Warning"
            status={warning.replace(/_/g, " ")}
            tone="muted"
          />
        ))}
      </div>
    </ResearchSection>
  );
}

type HorizonCardProps = {
  title: string;
  href: string;
  icon: typeof CalendarRange;
};

function HorizonCard({ title, href, icon: Icon }: HorizonCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex min-h-54 flex-col items-center justify-center gap-6 border border-border/70 bg-background px-6 py-7 text-center transition hover:-translate-y-0.5 hover:border-accent/45 hover:bg-muted-bg/25 hover:shadow-sm",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
      )}
    >
      <article className="contents">
        <div
          className="flex h-24 w-24 items-center justify-center text-accent-strong transition group-hover:scale-105 group-hover:text-foreground"
          aria-hidden
        >
          <Icon className="h-16 w-16 stroke-[1.5]" />
        </div>
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h3>
      </article>
    </Link>
  );
}

function DecisionHorizonsSection({
  symbol,
  className,
}: {
  symbol: string;
  className?: string;
}) {
  const symbolUpper = symbol.toUpperCase();

  return (
    <ResearchSection title="Decision Horizons" className={className}>
      <div className="grid gap-4 lg:grid-cols-3">
        <HorizonCard
          title="Day Trade"
          href={`/research/${encodeURIComponent(symbolUpper)}/day-trade`}
          icon={CalendarClock}
        />
        <HorizonCard
          title="Swing Trade"
          href={`/research/${encodeURIComponent(symbolUpper)}/swing-trade`}
          icon={TrendingUp}
        />
        <HorizonCard
          title="Long Term Investment"
          href={`/research/${encodeURIComponent(symbolUpper)}/long-term`}
          icon={CalendarRange}
        />
      </div>
    </ResearchSection>
  );
}

export function ResearchOverviewTopSection({ symbol }: Props) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;

  const symbolIntelligence = useResearchSymbolIntelligence();
  const intelligence = symbolIntelligence?.intelligence ?? null;
  const researchEvents = useResearchEvents(symbol, accessToken);
  const intelligenceTimeline = intelligence?.eventTimeline ?? [];
  const recentEventsTimeline = researchEvents.events.length
    ? researchEvents.events
    : intelligenceTimeline;
  const recentEventsLoading =
    researchEvents.isLoading && recentEventsTimeline.length === 0;
  const recentEventsError =
    recentEventsTimeline.length === 0 ? researchEvents.error : null;
  const dataGaps = intelligence?.dataGaps ?? [];
  const warnings = [symbolIntelligence?.error, ...dataGaps].filter(
    (item): item is string => Boolean(item),
  );

  return (
    <div className={researchMemo.pageGap}>
      <ResearchStockChart
        symbol={symbol}
        chartIntelligence={intelligence?.patternIntelligence?.chartIntelligence}
        autoSwitchToChartIntelligence={false}
      />

      <ResearchSection title="" className={pageSectionClass}>
        <TickerKeyStats symbol={symbol} variant="definition" />
      </ResearchSection>

      <EventsWarningsSection
        events={recentEventsTimeline.slice(0, 3)}
        eventsLoading={recentEventsLoading}
        eventsError={recentEventsError}
        warnings={warnings}
        className={pageSectionClass}
      />

      <DecisionHorizonsSection symbol={symbol} className={pageSectionClass} />
    </div>
  );
}
