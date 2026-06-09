"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRightLeft,
  CalendarDays,
  ChevronDown,
  ExternalLink,
  FileText,
  GitCompareArrows,
  Newspaper,
  RefreshCw,
  Sparkles,
  Target,
} from "lucide-react";
import Link from "next/link";
import { Fragment, type ReactNode, useState } from "react";
import type {
  EventTimelineEntry,
  IntelligenceSignal,
  OptionChainPreview,
  OptionChainSideQuote,
  OptionChainTableRow,
  SymbolIntelligence,
} from "@/app/types/intelligence";
import { PatternTrendForecastCard } from "@/components/PatternTrendForecastCard";
import { ResearchAsideCard } from "@/components/ResearchDetailBlocks";
import { SchwabConnectionBanner } from "@/components/SchwabConnectionBanner";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { IconButton } from "@/components/ui/IconButton";
import { Skeleton, SkeletonList } from "@/components/ui/Skeleton";
import { formatFriendlyDate, formatOptionExpiration } from "@/lib/dateUtils";
import { formatUsd } from "@/lib/formatCurrency";
import {
  buildOptionCandidatePrompt,
  buildRollSuggestionPrompt,
  formatOptionCandidateSummary,
  hasSymbolOptionsContent,
  hasSymbolResearchIntelligenceContent,
  signalSeverityClass,
  signalSeverityLabel,
  signalToQuickActionId,
  sortSignalsBySeverity,
} from "@/lib/intelligence";
import { findQuickAction } from "@/lib/quickActions";
import { cn } from "@/lib/utils";

type Props = {
  intelligence: SymbolIntelligence | null;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onRunSignal?: (signal: IntelligenceSignal, actionId: string) => void;
  onAnalyzeOption?: (prompt: string) => void;
  onGoDeeper?: () => void;
  actionContext?: "portfolio" | "research";
  compact?: boolean;
  hideRecentEvents?: boolean;
  hidePatternForecast?: boolean;
  hideNavigationLinks?: boolean;
  title?: string;
  description?: string;
  className?: string;
  researchBasePath?: string;
  isEtf?: boolean;
};

function PanelLoadingSkeleton({
  titleWidth = "w-56",
  rows = 2,
  rowClassName = "h-16",
}: {
  titleWidth?: string;
  rows?: number;
  rowClassName?: string;
}) {
  return (
    <div className="space-y-2" aria-hidden>
      <Skeleton className={cn("h-4", titleWidth)} />
      <SkeletonList rows={rows} rowClassName={rowClassName} />
    </div>
  );
}

function timelineIcon(kind: string) {
  switch (kind) {
    case "trade":
      return Target;
    case "filing":
      return FileText;
    case "earnings":
      return CalendarDays;
    case "press_release":
      return FileText;
    case "news":
      return Newspaper;
    default:
      return CalendarDays;
  }
}

function timelineKindLabel(kind: string): string {
  switch (kind) {
    case "press_release":
      return "Press release";
    case "news":
      return "News";
    case "earnings":
      return "Earnings";
    case "filing":
      return "SEC filing";
    case "trade":
      return "Trade";
    case "macro":
      return "Macro";
    default:
      return kind.replace(/_/g, " ");
  }
}

function formatStrikeSide(side: "call" | "put") {
  return side === "call" ? "Call" : "Put";
}

function formatOptionPrice(value?: number | null) {
  if (value == null || value === 0) return "—";
  return formatUsd(value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatOptionIv(value?: number | null) {
  if (value == null || Math.abs(value) >= 998 || value <= 0) return "—";
  const pct = value <= 1.5 ? value * 100 : value;
  return `${pct.toFixed(0)}%`;
}

function formatOptionDelta(value?: number | null) {
  if (value == null || Math.abs(value) >= 998) return "—";
  return value.toFixed(2);
}

function formatOptionTheta(value?: number | null) {
  if (value == null) return "—";
  return value.toFixed(3);
}

function isTimelineExternalLink(entry: {
  kind: string;
  url?: string | null;
}): entry is { kind: string; url: string } {
  return (
    !!entry.url && (entry.kind === "news" || entry.kind === "press_release")
  );
}

function IntelligenceSection({
  title,
  icon: Icon,
  defaultOpen = false,
  compact = false,
  className,
  children,
}: {
  title: string;
  icon: LucideIcon;
  defaultOpen?: boolean;
  compact?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (!compact) {
    return (
      <div className={className}>
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {title}
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-border bg-background/40">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {title}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted transition",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {open && (
        <div className="border-t border-border/70 px-3 pb-3 pt-1">
          {children}
        </div>
      )}
    </div>
  );
}

function IntelligenceRecentEventsList({
  timeline,
  limit,
}: {
  timeline: EventTimelineEntry[];
  limit: number;
}) {
  const entries = timelineEntriesWithKeys(timeline.slice(0, limit));

  return (
    <ul className="space-y-2">
      {entries.map(({ entry, key }) => {
        const Icon = timelineIcon(entry.kind);
        const linkable = isTimelineExternalLink(entry);

        return (
          <li
            key={key}
            className="flex gap-3 border-b border-border/60 py-2 last:border-b-0"
          >
            <Icon
              className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong"
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-muted">
                {formatFriendlyDate(entry.date, { weekday: true })} ·{" "}
                {timelineKindLabel(entry.kind)}
              </p>
              {linkable ? (
                <a
                  href={entry.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex max-w-full items-start gap-1 text-sm font-medium text-accent-strong hover:underline"
                >
                  <span className="min-w-0">{entry.title}</span>
                  <ExternalLink
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70 transition group-hover:opacity-100"
                    aria-hidden
                  />
                  <span className="sr-only"> (opens in new tab)</span>
                </a>
              ) : (
                <p className="text-sm font-medium text-foreground">
                  {entry.title}
                </p>
              )}
              {entry.detail && (
                <p className="mt-0.5 text-xs text-muted">{entry.detail}</p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function timelineEntryKeyBase(entry: EventTimelineEntry) {
  return [
    entry.kind,
    entry.date,
    entry.title || "untitled",
    entry.url || "no-url",
    entry.detail || "no-detail",
  ].join("|");
}

function timelineEntriesWithKeys(timeline: EventTimelineEntry[]) {
  const seen = new Map<string, number>();
  return timeline.map((entry) => {
    const base = timelineEntryKeyBase(entry);
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return { entry, key: `${base}|${count}` };
  });
}

export function IntelligenceRecentEventsPanel({
  timeline,
  loading = false,
  error = null,
  limit = 8,
  className,
}: {
  timeline: EventTimelineEntry[];
  loading?: boolean;
  error?: string | null;
  limit?: number;
  className?: string;
}) {
  if (loading && timeline.length === 0) {
    return (
      <ResearchAsideCard title="Recent events" className={className}>
        <SkeletonList rows={3} rowClassName="h-14" />
      </ResearchAsideCard>
    );
  }

  if (error) {
    return (
      <ResearchAsideCard title="Recent events" className={className}>
        <p className="text-sm text-muted">{error}</p>
      </ResearchAsideCard>
    );
  }

  if (!timeline.length) {
    return (
      <ResearchAsideCard title="Recent events" className={className}>
        <p className="text-sm text-muted">
          No recent public events are available yet.
        </p>
      </ResearchAsideCard>
    );
  }

  return (
    <ResearchAsideCard title="Recent events" className={className}>
      <IntelligenceRecentEventsList timeline={timeline} limit={limit} />
    </ResearchAsideCard>
  );
}

export function SymbolIntelligencePanel({
  intelligence,
  loading = false,
  error = null,
  onRefresh,
  onRunSignal,
  onGoDeeper,
  actionContext = "portfolio",
  compact = false,
  hideRecentEvents = false,
  hidePatternForecast = false,
  hideNavigationLinks = false,
  title,
  description,
  className,
  researchBasePath,
  isEtf = false,
}: Props) {
  const hasResearchContent = hasSymbolResearchIntelligenceContent(intelligence);
  const hasContent = hasResearchContent;
  const signals = sortSignalsBySeverity(intelligence?.signals ?? []);
  const peers = intelligence?.peerComparison;
  const timeline = intelligence?.eventTimeline ?? [];
  const research = intelligence?.cachedResearch;
  const symbol = intelligence?.symbol;
  const panelTitle =
    title ?? (symbol ? `${symbol} intelligence` : "Symbol intelligence");
  const panelDescription = description ?? "Signals, peers, and timeline";

  if (!loading && !error && !hasContent) {
    return null;
  }

  return (
    <Card className={className} aria-label={panelTitle}>
      <CardHeader>
        <CardTitle title={panelTitle} description={panelDescription} />
        {onRefresh && (
          <IconButton
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            aria-label="Refresh intelligence"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", loading && "animate-spin")}
              aria-hidden
            />
          </IconButton>
        )}
      </CardHeader>

      <CardBody className="space-y-4 py-4">
        {loading && !hasContent && <PanelLoadingSkeleton />}

        {error && <ErrorBanner message={error} />}

        {intelligence?.reauthRequired && (
          <SchwabConnectionBanner
            message="Reconnect Schwab to include live positions and option chain data in this panel."
            authorizationUrl={intelligence.authorizationUrl}
          />
        )}

        {intelligence?.partial && !intelligence.reauthRequired && (
          <p className="border border-border bg-background/60 px-3 py-2 text-xs text-muted">
            Some live Schwab data is unavailable. Research signals are still
            shown.
          </p>
        )}

        {intelligence?.patternForecast && !hidePatternForecast ? (
          <PatternTrendForecastCard
            forecast={intelligence.patternForecast}
            symbol={intelligence.symbol}
          />
        ) : null}

        {!!signals.length && (
          <IntelligenceSection
            title="Company signals"
            icon={AlertTriangle}
            defaultOpen
            compact={compact}
            className="pt-2"
          >
            <p className="text-sm leading-relaxed text-foreground">
              These company-specific signals highlight items that may affect
              risk, research quality, or follow-up work.
            </p>
            <ul className="space-y-2">
              {signals.slice(0, compact ? 3 : 6).map((signal) => {
                const actionId = signalToQuickActionId(signal, actionContext);
                const quickAction = actionId ? findQuickAction(actionId) : null;
                const ActionIcon = quickAction?.icon;

                return (
                  <li
                    key={`${signal.kind}-${signal.message}-${signal.symbol ?? ""}`}
                    className="border-b border-border/60 py-3 last:border-b-0"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "inline-flex shrink-0 border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                          signalSeverityClass(signal.severity),
                        )}
                      >
                        {signalSeverityLabel(signal.severity)}
                      </span>
                      <p className="flex-1 text-sm text-foreground">
                        {signal.message}
                      </p>
                    </div>
                    {actionId && onRunSignal && quickAction && ActionIcon && (
                      <button
                        type="button"
                        onClick={() => onRunSignal(signal, actionId)}
                        className="mt-2 inline-flex items-center gap-1 border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-accent-strong transition hover:border-accent/40 hover:bg-muted-bg"
                      >
                        <ActionIcon className="h-3 w-3" aria-hidden />
                        {quickAction.label}
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </IntelligenceSection>
        )}

        {research &&
          (research.investmentThesis ||
            (research.keyStrengths?.length ?? 0) > 0 ||
            (research.keyRisks?.length ?? 0) > 0) && (
            <IntelligenceSection
              title="Research thesis"
              icon={Sparkles}
              compact={compact}
            >
              <div className="space-y-3 border-b border-border/60 pb-4">
                {research.sentiment && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                    {research.sentiment}
                  </span>
                )}
                {research.investmentThesis && (
                  <p className="text-sm leading-relaxed text-foreground">
                    {research.investmentThesis}
                  </p>
                )}
                {(research.keyStrengths?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-[11px] font-medium text-muted">
                      Strengths
                    </p>
                    <ul className="mt-1 list-inside list-disc text-sm text-foreground">
                      {research.keyStrengths.slice(0, 3).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {(research.keyRisks?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-[11px] font-medium text-muted">Risks</p>
                    <ul className="mt-1 list-inside list-disc text-sm text-foreground">
                      {research.keyRisks.slice(0, 3).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </IntelligenceSection>
          )}

        {peers && (peers.peers.length > 0 || peers.summary) && (
          <IntelligenceSection
            title="Compared with peers"
            icon={GitCompareArrows}
            compact={compact}
          >
            {peers.summary && (
              <p className="mb-2 text-sm text-foreground">{peers.summary}</p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[280px] text-left text-xs">
                <thead className="text-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">Symbol</th>
                    <th className="px-3 py-2 font-medium">1Y return</th>
                    <th className="px-3 py-2 font-medium">P/E</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border/60 font-medium">
                    <td className="px-3 py-2 font-mono">
                      {peers.targetSymbol}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {peers.targetOneYearReturn ?? "—"}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {peers.targetPeTrailing ?? "—"}
                    </td>
                  </tr>
                  {peers.peers.slice(0, compact ? 3 : 5).map((peer) => (
                    <tr key={peer.symbol} className="border-t border-border/60">
                      <td className="px-3 py-2 font-mono">{peer.symbol}</td>
                      <td className="px-3 py-2 tabular-nums">
                        {peer.oneYearReturn ?? "—"}
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {peer.peTrailing ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </IntelligenceSection>
        )}

        {!!timeline.length && !hideRecentEvents && (
          <IntelligenceSection
            title="Recent events"
            icon={CalendarDays}
            compact={compact}
          >
            <IntelligenceRecentEventsList
              timeline={timeline}
              limit={compact ? 4 : 8}
            />
          </IntelligenceSection>
        )}

        {researchBasePath && symbol && !compact && !hideNavigationLinks && (
          <div className="flex flex-wrap gap-2 pt-1">
            {isEtf ? (
              <>
                <Link
                  href={`${researchBasePath}/${symbol}/holdings`}
                  className="text-xs font-medium text-accent-strong hover:underline"
                >
                  ETF composition →
                </Link>
                <Link
                  href={`${researchBasePath}/${symbol}/fundamentals`}
                  className="text-xs font-medium text-accent-strong hover:underline"
                >
                  Fund metrics →
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={`${researchBasePath}/${symbol}/earnings`}
                  className="text-xs font-medium text-accent-strong hover:underline"
                >
                  Earnings research →
                </Link>
                <Link
                  href={`${researchBasePath}/${symbol}/financials`}
                  className="text-xs font-medium text-accent-strong hover:underline"
                >
                  Financials →
                </Link>
              </>
            )}
          </div>
        )}

        {onGoDeeper && (
          <div className="border-t border-border/70 pt-3">
            <button
              type="button"
              onClick={onGoDeeper}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-strong transition hover:underline"
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {actionContext === "research"
                ? "Go deeper with AI research chat"
                : "Go deeper with full symbol analysis"}
            </button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

type SymbolOptionsWorkspaceProps = {
  intelligence: SymbolIntelligence | null;
  authoritativeUnderlyingPrice?: number | null;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onAnalyzeOption?: (prompt: string) => void;
  compact?: boolean;
  className?: string;
};

export function SymbolOptionsWorkspace({
  intelligence,
  authoritativeUnderlyingPrice,
  loading = false,
  error = null,
  onRefresh,
  onAnalyzeOption,
  compact = false,
  className,
}: SymbolOptionsWorkspaceProps) {
  const hasContent = hasSymbolOptionsContent(intelligence);
  const options = intelligence?.optionsScorecard;
  const optionChain = intelligence?.optionChainPreview
    ? {
        ...intelligence.optionChainPreview,
        underlyingPrice:
          authoritativeUnderlyingPrice ??
          intelligence.optionChainPreview.underlyingPrice,
      }
    : null;
  const rollSuggestions = intelligence?.rollSuggestions ?? [];
  const symbol = intelligence?.symbol;

  if (!loading && !error && !hasContent) {
    return null;
  }

  return (
    <Card
      className={cn("w-full max-w-none", className)}
      aria-label={symbol ? `${symbol} options` : "Symbol options"}
    >
      <CardHeader>
        <CardTitle
          title={symbol ? `${symbol} options` : "Options"}
          description="Chain, rolls, and strike candidates"
          icon={
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center bg-accent-muted text-accent-strong">
              <Target className="h-4 w-4" aria-hidden />
            </div>
          }
        />
        {onRefresh && (
          <IconButton
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            aria-label="Refresh options data"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", loading && "animate-spin")}
              aria-hidden
            />
          </IconButton>
        )}
      </CardHeader>

      <CardBody className="space-y-4 py-4">
        {loading && !hasContent && (
          <PanelLoadingSkeleton
            titleWidth="w-48"
            rows={1}
            rowClassName="h-32"
          />
        )}

        {error && <ErrorBanner message={error} />}

        {intelligence?.reauthRequired && (
          <SchwabConnectionBanner
            message="Reconnect Schwab to load live option chain and strike scoring."
            authorizationUrl={intelligence.authorizationUrl}
          />
        )}

        {intelligence?.partial && !intelligence.reauthRequired && (
          <p className="border border-border bg-background/60 px-3 py-2 text-xs text-muted">
            Some live option data is unavailable right now.
          </p>
        )}

        {!!rollSuggestions.length && symbol && (
          <IntelligenceSection
            title="Roll suggestions"
            icon={ArrowRightLeft}
            defaultOpen
            compact={compact}
          >
            <ul className="space-y-2">
              {rollSuggestions.slice(0, compact ? 2 : 4).map((suggestion) => (
                <li
                  key={`${suggestion.side}-${suggestion.currentStrike}-${suggestion.suggestedStrike}`}
                  className="border border-border bg-background/60 px-3 py-2.5"
                >
                  <p className="text-sm font-medium text-foreground">
                    {formatUsd(suggestion.currentStrike, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {formatStrikeSide(suggestion.side)} →{" "}
                    {formatUsd(suggestion.suggestedStrike, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}{" "}
                    · {formatOptionExpiration(suggestion.suggestedExpiration)}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">
                    {suggestion.rationale}
                  </p>
                  {onAnalyzeOption && (
                    <button
                      type="button"
                      onClick={() =>
                        onAnalyzeOption(
                          buildRollSuggestionPrompt(symbol, suggestion),
                        )
                      }
                      className="mt-2 inline-flex items-center gap-1 border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-accent-strong transition hover:border-accent/40 hover:bg-muted-bg"
                    >
                      Analyze roll
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </IntelligenceSection>
        )}

        {optionChain && (optionChain.rows?.length ?? 0) > 0 && (
          <IntelligenceSection
            title="Option chain"
            icon={Target}
            compact={compact}
          >
            <OptionChainPreviewTable
              preview={optionChain}
              compact={compact}
              hideTitle
            />
          </IntelligenceSection>
        )}

        {options &&
          ((options.assignmentFlags?.length ?? 0) > 0 ||
            (options.coveredCallCandidates?.length ?? 0) > 0 ||
            (options.cspCandidates?.length ?? 0) > 0) && (
            <IntelligenceSection
              title="Options scorecard"
              icon={Target}
              defaultOpen={(options.assignmentFlags?.length ?? 0) > 0}
              compact={compact}
            >
              <div>
                {(options.assignmentFlags?.length ?? 0) > 0 && (
                  <ul className="mb-3 space-y-1">
                    {options.assignmentFlags.map((flag) => (
                      <li
                        key={flag}
                        className="border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
                      >
                        {flag}
                      </li>
                    ))}
                  </ul>
                )}

                {(options.assignmentFlags?.length ?? 0) > 0 &&
                  onAnalyzeOption &&
                  symbol && (
                    <button
                      type="button"
                      onClick={() =>
                        onAnalyzeOption(
                          `Review assignment and call-away risk for my ${symbol} short options over the next two weeks. ${options.assignmentFlags?.join(" ") ?? ""}`,
                        )
                      }
                      className="mb-3 inline-flex items-center gap-1 border border-danger/30 bg-danger/10 px-2.5 py-1 text-[11px] font-medium text-danger transition hover:bg-danger/15"
                    >
                      Analyze assignment risk
                    </button>
                  )}

                {(options.coveredCallCandidates?.length ?? 0) > 0 && (
                  <OptionsCandidateTable
                    title="Covered call candidates"
                    symbol={symbol}
                    underlyingPrice={
                      authoritativeUnderlyingPrice ?? options.underlyingPrice
                    }
                    candidates={options.coveredCallCandidates.slice(0, 3)}
                    onAnalyzeOption={onAnalyzeOption}
                  />
                )}

                {(options.cspCandidates?.length ?? 0) > 0 && (
                  <OptionsCandidateTable
                    title="Cash-secured put candidates"
                    symbol={symbol}
                    underlyingPrice={
                      authoritativeUnderlyingPrice ?? options.underlyingPrice
                    }
                    candidates={options.cspCandidates.slice(0, 3)}
                    onAnalyzeOption={onAnalyzeOption}
                    className="mt-3"
                  />
                )}
              </div>
            </IntelligenceSection>
          )}
      </CardBody>
    </Card>
  );
}

function OptionSideMetrics({
  quote,
  className,
}: {
  quote?: OptionChainSideQuote | null;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4 lg:grid-cols-8",
        className,
      )}
    >
      <div>
        <p className="text-muted">Bid</p>
        <p className="mt-0.5 tabular-nums font-medium text-foreground">
          {formatOptionPrice(quote?.bid)}
        </p>
      </div>
      <div>
        <p className="text-muted">Ask</p>
        <p className="mt-0.5 tabular-nums font-medium text-foreground">
          {formatOptionPrice(quote?.ask)}
        </p>
      </div>
      <div>
        <p className="text-muted">Mark</p>
        <p className="mt-0.5 tabular-nums font-medium text-foreground">
          {formatOptionPrice(quote?.mark)}
        </p>
      </div>
      <div>
        <p className="text-muted">Last</p>
        <p className="mt-0.5 tabular-nums font-medium text-foreground">
          {formatOptionPrice(quote?.lastPrice)}
        </p>
      </div>
      <div>
        <p className="text-muted">Delta</p>
        <p className="mt-0.5 tabular-nums font-medium text-foreground">
          {formatOptionDelta(quote?.delta)}
        </p>
      </div>
      <div>
        <p className="text-muted">Theta</p>
        <p className="mt-0.5 tabular-nums font-medium text-foreground">
          {formatOptionTheta(quote?.theta)}
        </p>
      </div>
      <div>
        <p className="text-muted">Open interest</p>
        <p className="mt-0.5 tabular-nums font-medium text-foreground">
          {quote?.openInterest != null
            ? quote.openInterest.toLocaleString()
            : "—"}
        </p>
      </div>
      <div>
        <p className="text-muted">Impl vol</p>
        <p className="mt-0.5 tabular-nums font-medium text-foreground">
          {formatOptionIv(quote?.iv)}
        </p>
      </div>
    </div>
  );
}

function formatUnderlyingPrice(price: number) {
  return formatUsd(price, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function findAtmStrike(
  rows: OptionChainTableRow[],
  underlying: number | null | undefined,
): number | null {
  if (underlying == null || rows.length === 0) return null;

  return rows.reduce<number | null>((closest, row) => {
    if (closest == null) return row.strike;
    return Math.abs(row.strike - underlying) < Math.abs(closest - underlying)
      ? row.strike
      : closest;
  }, null);
}

function shouldInsertSpotDividerBeforeStrike<T extends { strike: number }>(
  item: T,
  index: number,
  items: T[],
  underlying: number,
) {
  if (index === 0) return item.strike > underlying;
  const previous = items[index - 1];
  return previous.strike < underlying && item.strike >= underlying;
}

function shouldInsertSpotDividerAfterStrike<T extends { strike: number }>(
  items: T[],
  underlying: number,
) {
  if (items.length === 0) return false;
  return items[items.length - 1].strike < underlying;
}

function OptionSpotPriceDivider({ price }: { price: number }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-accent/35" aria-hidden />
      <span className="shrink-0 border border-accent/40 bg-background px-3 py-1 text-xs font-semibold tabular-nums text-accent-strong shadow-sm">
        {formatUnderlyingPrice(price)}
      </span>
      <div className="h-px flex-1 bg-accent/35" aria-hidden />
    </div>
  );
}

function OptionChainSpotDividerRow({
  price,
  colSpan,
}: {
  price: number;
  colSpan: number;
}) {
  return (
    <tr className="bg-accent-muted/20">
      <td colSpan={colSpan} className="px-3 py-2">
        <OptionSpotPriceDivider price={price} />
      </td>
    </tr>
  );
}

const OPTION_CHAIN_COLUMN_COUNT = 17;

function OptionChainPreviewTable({
  preview,
  compact = false,
  hideTitle = false,
}: {
  preview: OptionChainPreview;
  compact?: boolean;
  hideTitle?: boolean;
}) {
  const rows = preview.rows.slice(0, compact ? 5 : preview.rows.length);
  const underlying = preview.underlyingPrice;
  const atmStrike = findAtmStrike(rows, underlying);

  return (
    <div className="w-full max-w-none">
      {!hideTitle && (
        <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium uppercase tracking-wide text-muted">
          <Target className="h-3.5 w-3.5" aria-hidden />
          Option chain
          {preview.expiration && (
            <span className="normal-case text-foreground">
              · {formatOptionExpiration(preview.expiration)}
            </span>
          )}
          {preview.strikeCount != null && (
            <span className="normal-case text-muted">
              · {preview.strikeCount} up/down strikes
            </span>
          )}
        </div>
      )}

      <div className="w-full max-w-none overflow-hidden border border-border">
        <p className="border-b border-border/70 px-3 py-2 text-[11px] text-muted">
          Bid and ask need a live quote. When they&apos;re missing, last is
          usually yesterday&apos;s close and mark is an estimated price.
        </p>

        <div className="max-h-[min(65vh,520px)] w-full overflow-y-auto md:hidden">
          <table className="w-full table-fixed text-left text-xs">
            <thead className="sticky top-0 z-10 bg-secondary/95 text-muted shadow-sm backdrop-blur-sm">
              <tr>
                <th className="px-3 py-2 font-medium">Strike</th>
                <th className="px-3 py-2 font-medium">Call mark</th>
                <th className="px-3 py-2 font-medium">Put mark</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={`mobile-${row.strike}`}
                  className={cn(
                    "border-t border-border",
                    atmStrike === row.strike &&
                      "bg-accent-muted/25 ring-1 ring-inset ring-accent/20",
                  )}
                >
                  <td className="px-3 py-2 font-mono font-medium tabular-nums">
                    {formatUsd(row.strike, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {formatOptionPrice(row.call?.mark)}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {formatOptionPrice(row.put?.mark)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="hidden max-h-[min(65vh,520px)] w-full overflow-x-auto overflow-y-auto scrollbar-dark md:block">
          <table className="w-full min-w-full table-fixed text-left text-xs">
            <thead className="sticky top-0 z-10 bg-secondary/95 text-muted shadow-sm backdrop-blur-sm">
              <tr>
                <th className="px-3 py-2 font-medium">Strike</th>
                <th className="px-3 py-2 font-medium">Call bid</th>
                <th className="px-3 py-2 font-medium">Call ask</th>
                <th className="px-3 py-2 font-medium">Call mark</th>
                <th className="px-3 py-2 font-medium">Call last</th>
                <th className="px-3 py-2 font-medium">Call delta</th>
                <th className="px-3 py-2 font-medium">Call theta</th>
                <th className="px-3 py-2 font-medium">Call open interest</th>
                <th className="px-3 py-2 font-medium">Call impl vol</th>
                <th className="px-3 py-2 font-medium">Put bid</th>
                <th className="px-3 py-2 font-medium">Put ask</th>
                <th className="px-3 py-2 font-medium">Put mark</th>
                <th className="px-3 py-2 font-medium">Put last</th>
                <th className="px-3 py-2 font-medium">Put delta</th>
                <th className="px-3 py-2 font-medium">Put theta</th>
                <th className="px-3 py-2 font-medium">Put open interest</th>
                <th className="px-3 py-2 font-medium">Put impl vol</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <Fragment key={row.strike}>
                  {underlying != null &&
                    shouldInsertSpotDividerBeforeStrike(
                      row,
                      index,
                      rows,
                      underlying,
                    ) && (
                      <OptionChainSpotDividerRow
                        price={underlying}
                        colSpan={OPTION_CHAIN_COLUMN_COUNT}
                      />
                    )}
                  <tr
                    className={cn(
                      "border-t border-border",
                      atmStrike === row.strike &&
                        "bg-accent-muted/25 ring-1 ring-inset ring-accent/20",
                    )}
                  >
                    <td className="px-3 py-2 font-mono font-medium tabular-nums">
                      {formatUsd(row.strike, {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                      })}
                      {atmStrike === row.strike && (
                        <span className="ml-1.5 text-[10px] font-sans font-semibold uppercase tracking-wide text-accent-strong">
                          ATM
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {formatOptionPrice(row.call?.bid)}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {formatOptionPrice(row.call?.ask)}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {formatOptionPrice(row.call?.mark)}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {formatOptionPrice(row.call?.lastPrice)}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {formatOptionDelta(row.call?.delta)}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {formatOptionTheta(row.call?.theta)}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {row.call?.openInterest != null
                        ? row.call.openInterest.toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {formatOptionIv(row.call?.iv)}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {formatOptionPrice(row.put?.bid)}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {formatOptionPrice(row.put?.ask)}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {formatOptionPrice(row.put?.mark)}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {formatOptionPrice(row.put?.lastPrice)}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {formatOptionDelta(row.put?.delta)}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {formatOptionTheta(row.put?.theta)}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {row.put?.openInterest != null
                        ? row.put.openInterest.toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {formatOptionIv(row.put?.iv)}
                    </td>
                  </tr>
                </Fragment>
              ))}
              {underlying != null &&
                shouldInsertSpotDividerAfterStrike(rows, underlying) && (
                  <OptionChainSpotDividerRow
                    price={underlying}
                    colSpan={OPTION_CHAIN_COLUMN_COUNT}
                  />
                )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function OptionsCandidateTable({
  title,
  symbol,
  underlyingPrice,
  candidates,
  onAnalyzeOption,
  className,
}: {
  title: string;
  symbol?: string;
  underlyingPrice?: number | null;
  candidates: NonNullable<
    SymbolIntelligence["optionsScorecard"]
  >["coveredCallCandidates"];
  onAnalyzeOption?: (prompt: string) => void;
  className?: string;
}) {
  const sortedCandidates = [...candidates].sort((a, b) => b.strike - a.strike);

  return (
    <div className={className}>
      <p className="mb-1.5 text-xs font-medium text-foreground">{title}</p>
      <ul className="space-y-2">
        {sortedCandidates.map((candidate) => (
          <li
            key={`${candidate.side}-${candidate.strike}-${candidate.expiration}`}
            className="border border-border bg-background/60 px-3 py-2.5"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {formatUsd(candidate.strike, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}{" "}
                  {formatStrikeSide(candidate.side)} ·{" "}
                  {formatOptionExpiration(candidate.expiration)}
                </p>
                <OptionSideMetrics quote={candidate} className="mt-2" />
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  {formatOptionCandidateSummary(candidate, underlyingPrice)}
                </p>
                <p className="mt-1 text-[11px] text-muted">
                  Strategy fit {candidate.score.toFixed(2)}
                </p>
              </div>
              {onAnalyzeOption && symbol && (
                <button
                  type="button"
                  onClick={() =>
                    onAnalyzeOption(
                      buildOptionCandidatePrompt(
                        symbol,
                        candidate,
                        underlyingPrice,
                      ),
                    )
                  }
                  className="shrink-0 border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-accent-strong transition hover:border-accent/40 hover:bg-muted-bg"
                >
                  Analyze strike
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
