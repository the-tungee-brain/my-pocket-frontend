"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Newspaper,
  TrendingUp,
} from "lucide-react";
import { useSession } from "next-auth/react";
import {
  useEarningsDetail,
  useEarningsList,
  type EarningsEvent,
} from "@/app/hooks/useEarnings";
import {
  ResearchAtAGlanceBox,
  ResearchBulletList,
  ResearchTextBlock,
} from "@/components/ResearchDetailBlocks";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { PageSplit } from "@/components/PageShell";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import {
  ResearchSectionSkeleton,
  Skeleton,
  SkeletonList,
} from "@/components/ui/Skeleton";
import {
  beatLabelText,
  formatEps,
  formatReportDate,
  formatRevenue,
  formatSurprisePct,
  timingLabel,
} from "@/lib/earningsUtils";
import { cn } from "@/lib/utils";
import { StreetEarningsEstimates } from "./StreetAnalysisSection";

type EarningsPageContentProps = {
  symbol: string;
};

function quarterKey(event: EarningsEvent, index: number) {
  return `${event.reportDate}-${event.fiscalPeriod}-${index}`;
}

function BeatBadge({ label }: { label: EarningsEvent["beatLabel"] }) {
  const classes =
    label === "beat"
      ? "border-accent/30 bg-accent-muted text-accent-strong"
      : label === "miss"
        ? "border-danger/30 bg-danger/10 text-danger"
        : label === "pending"
          ? "border-accent/20 bg-surface-elevated text-foreground"
          : "border-border bg-muted-bg text-muted";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        classes,
      )}
    >
      {beatLabelText(label)}
    </span>
  );
}

function MetricsGrid({ event }: { event: EarningsEvent }) {
  const rows = [
    { label: "Report date", value: formatReportDate(event.reportDate) },
    { label: "Timing", value: timingLabel(event.timing) },
    { label: "EPS actual", value: formatEps(event.epsActual) },
    { label: "EPS estimate", value: formatEps(event.epsEstimate) },
    { label: "EPS surprise", value: formatSurprisePct(event.epsSurprisePct) },
    { label: "Revenue actual", value: formatRevenue(event.revenueActual) },
    { label: "Revenue estimate", value: formatRevenue(event.revenueEstimate) },
    {
      label: "Revenue surprise",
      value: formatSurprisePct(event.revenueSurprisePct),
    },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="min-w-full divide-y divide-border text-sm">
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr
              key={row.label}
              className="bg-secondary/30 transition-colors hover:bg-surface-elevated/40"
            >
              <td className="px-4 py-2.5 text-muted">{row.label}</td>
              <td className="px-4 py-2.5 text-right font-medium tabular-nums text-foreground">
                {row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QuarterPicker({
  events,
  selectedKey,
  onSelect,
}: {
  events: EarningsEvent[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
}) {
  if (events.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-dark">
      {events.map((event, index) => {
        const key = quarterKey(event, index);
        const isActive = key === selectedKey;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            aria-pressed={isActive}
            className={cn(
              "flex flex-none cursor-pointer flex-col items-start rounded-lg border px-3 py-2 text-left transition-all",
              isActive
                ? "border-accent/40 bg-accent-muted/40 shadow-sm ring-1 ring-accent/20"
                : "border-border bg-surface-elevated/40 hover:border-accent/20 hover:bg-surface-elevated/70",
            )}
          >
            <span className="text-xs font-semibold text-foreground">
              {event.fiscalPeriod}
            </span>
            <span className="mt-0.5 text-[11px] text-muted">
              {formatReportDate(event.reportDate)}
            </span>
            <span className="mt-1.5">
              <BeatBadge label={event.beatLabel} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TranscriptSection({
  transcript,
}: {
  transcript: { speaker: string; role: string | null; text: string }[];
}) {
  const [open, setOpen] = useState(false);

  if (transcript.length === 0) {
    return (
      <p className="text-sm text-muted">
        No earnings call transcript is available for this quarter.
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between rounded-lg border border-border bg-surface-elevated/40 px-3 py-2 text-left text-sm font-medium text-foreground transition hover:bg-surface-elevated/70"
      >
        <span>View full transcript ({transcript.length} speakers)</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="mt-3 max-h-112 space-y-4 overflow-y-auto rounded-xl border border-border bg-secondary/20 p-4 scrollbar-dark">
          {transcript.map((segment, index) => (
            <div key={`${segment.speaker}-${index}`}>
              <p className="text-xs font-semibold text-accent-strong">
                {segment.speaker}
                {segment.role ? (
                  <span className="font-normal text-muted">
                    {" "}
                    · {segment.role}
                  </span>
                ) : null}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-foreground">
                {segment.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EarningsAnalysisSkeleton() {
  return (
    <div className="space-y-6 border-t border-border pt-6" aria-hidden>
      <Skeleton className="h-20 rounded-xl" />
      <ResearchSectionSkeleton
        headerWidth="w-20"
        rows={1}
        rowClassName="h-14 rounded-xl"
      />
      <ResearchSectionSkeleton
        headerWidth="w-28"
        rows={2}
        rowClassName="h-12 rounded-xl"
      />
      <ResearchSectionSkeleton
        headerWidth="w-32"
        rows={3}
        rowClassName="h-8 rounded-lg"
      />
      <Skeleton className="h-16 rounded-xl" />
    </div>
  );
}

function EarningsPageSkeleton() {
  return (
    <PageSplit
      main={
        <ResearchSectionCard
          title="Earnings history"
          description="Quarterly results, surprises, transcripts, and AI summaries"
          icon={TrendingUp}
        >
          <div className="space-y-6">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-16 w-28 flex-none rounded-lg"
                />
              ))}
            </div>
            <ResearchSectionSkeleton
              headerWidth="w-40"
              rows={1}
              rowClassName="h-12 rounded-xl"
            />
            <SkeletonList rows={8} rowClassName="h-10 rounded-lg" />
            <EarningsAnalysisSkeleton />
          </div>
        </ResearchSectionCard>
      }
      aside={
        <ResearchSectionCard
          title="Next earnings"
          description="Upcoming report date and current estimates"
          icon={CalendarDays}
        >
          <ResearchSectionSkeleton
            headerWidth="w-36"
            rows={3}
            rowClassName="h-12 rounded-xl"
          />
        </ResearchSectionCard>
      }
    />
  );
}

function EarningsDetailPanel({
  symbol,
  previewEvent,
}: {
  symbol: string;
  previewEvent: EarningsEvent;
}) {
  const { data: session } = useSession();
  const { data, isLoading, error } = useEarningsDetail(
    symbol,
    previewEvent.reportDate,
    {
      accessToken: session?.accessToken,
    },
  );

  const event = data?.event ?? previewEvent;
  const analysis = data?.analysis ?? null;
  const relatedNews = data?.relatedNews ?? [];
  const transcript = data?.transcript ?? [];
  const showAnalysisLoading = isLoading && !analysis;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {event.fiscalPeriod}
          </h3>
          <p className="text-xs text-muted">
            Reported {formatReportDate(event.reportDate)}
          </p>
        </div>
        <BeatBadge label={event.beatLabel} />
      </div>

      <MetricsGrid event={event} />

      {error && !analysis ? <ErrorBanner message={error} /> : null}

      {showAnalysisLoading ? <EarningsAnalysisSkeleton /> : null}

      {!showAnalysisLoading && analysis ? (
        <div className="space-y-6 border-t border-border pt-6">
          <div className="rounded-xl border border-accent/25 bg-accent-muted/30 px-4 py-3">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-accent-strong">
              Headline
            </h3>
            <p className="text-sm font-medium leading-relaxed text-foreground">
              {analysis.headline}
            </p>
          </div>

          <ResearchTextBlock title="Summary">
            <p>{analysis.summary}</p>
          </ResearchTextBlock>

          <ResearchTextBlock title="Context going in">
            <p>{analysis.context}</p>
          </ResearchTextBlock>

          <ResearchBulletList
            title="Key highlights"
            items={analysis.keyHighlights}
          />

          <ResearchTextBlock title="Guidance & outlook">
            <p>{analysis.guidanceAndOutlook}</p>
          </ResearchTextBlock>

          <ResearchTextBlock title="What surprised the market">
            <p>{analysis.whatSurprised}</p>
          </ResearchTextBlock>

          <ResearchAtAGlanceBox title="Investor takeaway">
            <p className="text-sm font-medium leading-relaxed text-foreground">
              {analysis.investorTakeaway}
            </p>
          </ResearchAtAGlanceBox>
        </div>
      ) : null}

      {!showAnalysisLoading && !analysis && !error && !isLoading ? (
        <p className="text-sm text-muted">
          AI analysis is not available for this quarter.
        </p>
      ) : null}

      {!showAnalysisLoading && relatedNews.length > 0 ? (
        <div className="border-t border-border pt-6">
          <div className="mb-3 flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-muted" aria-hidden="true" />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
              Related news
            </h3>
          </div>
          <ul className="space-y-2">
            {relatedNews.map((item) => (
              <li
                key={`${item.headline}-${item.datetime}`}
                className="rounded-lg border border-border bg-surface-elevated/40 px-3 py-2"
              >
                <p className="text-sm font-medium text-foreground">
                  {item.headline}
                </p>
                {item.summary ? (
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    {item.summary}
                  </p>
                ) : null}
                <p className="mt-1 text-[11px] text-muted">
                  {item.source}
                  {item.datetime ? ` · ${item.datetime.slice(0, 10)}` : ""}
                </p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!showAnalysisLoading ? (
        <div className="border-t border-border pt-6">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
            Earnings call transcript
          </h3>
          <TranscriptSection transcript={transcript} />
        </div>
      ) : null}
    </div>
  );
}

export function EarningsPageContent({ symbol }: EarningsPageContentProps) {
  const { data: session } = useSession();
  const { data, isLoading, error } = useEarningsList(symbol, {
    accessToken: session?.accessToken,
  });
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const historyWithKeys = useMemo(
    () =>
      (data?.history ?? []).map((event, index) => ({
        event,
        key: quarterKey(event, index),
      })),
    [data?.history],
  );

  useEffect(() => {
    if (!historyWithKeys.length) return;
    setSelectedKey((current) => {
      if (current && historyWithKeys.some((item) => item.key === current)) {
        return current;
      }
      return historyWithKeys[0]?.key ?? null;
    });
  }, [historyWithKeys]);

  const selectedItem = historyWithKeys.find((item) => item.key === selectedKey);

  if (isLoading && !data) {
    return <EarningsPageSkeleton />;
  }

  if (error) {
    return <ErrorBanner message={error} />;
  }

  if (!data) {
    return (
      <p className="text-sm text-muted">Earnings data is not available.</p>
    );
  }

  const hasHistory = historyWithKeys.length > 0;

  const upcomingCard = data.upcoming ? (
    <ResearchSectionCard
      title="Next earnings"
      description="Upcoming report date and current estimates"
      icon={CalendarDays}
    >
      <div className="app-stack">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              {data.upcoming.fiscalPeriod}
            </p>
            <p className="text-xs text-muted">
              {formatReportDate(data.upcoming.reportDate)} ·{" "}
              {timingLabel(data.upcoming.timing)}
            </p>
          </div>
          <BeatBadge label="pending" />
        </div>
        <MetricsGrid event={data.upcoming} />
        <StreetEarningsEstimates
          street={data.streetAnalysis}
          embedded
          defaultEstimatePeriod="0q"
        />
      </div>
    </ResearchSectionCard>
  ) : (
    <ResearchSectionCard
      title="Analyst estimates"
      description="Next-quarter Wall Street EPS and revenue consensus"
      icon={CalendarDays}
    >
      <StreetEarningsEstimates
        street={data.streetAnalysis ?? null}
        embedded={false}
      />
    </ResearchSectionCard>
  );

  const historyCard = (
    <ResearchSectionCard
      title="Earnings history"
      description="Quarterly results, surprises, transcripts, and AI summaries"
      icon={TrendingUp}
    >
      {!hasHistory ? (
        <p className="text-sm text-muted">
          No earnings history is available for this symbol yet.
        </p>
      ) : (
        <div className="space-y-6">
          <QuarterPicker
            events={data.history}
            selectedKey={selectedKey}
            onSelect={setSelectedKey}
          />

          {selectedItem ? (
            <EarningsDetailPanel
              key={selectedItem.key}
              symbol={symbol}
              previewEvent={selectedItem.event}
            />
          ) : null}
        </div>
      )}
    </ResearchSectionCard>
  );

  return (
    <div className="app-stack">
      <PageSplit main={historyCard} aside={upcomingCard ?? undefined} />
    </div>
  );
}
