"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRightLeft,
  CalendarDays,
  ChevronDown,
  FileText,
  GitCompareArrows,
  Newspaper,
  RefreshCw,
  Sparkles,
  Target,
  ExternalLink,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import type {
  IntelligenceSignal,
  OptionChainPreview,
  OptionChainSideQuote,
  OptionsStrikeCandidate,
  SymbolIntelligence,
} from "@/app/types/intelligence";
import {
  buildOptionCandidatePrompt,
  buildRollSuggestionPrompt,
  hasSymbolIntelligenceContent,
  signalSeverityClass,
  signalSeverityLabel,
  signalToQuickActionId,
  sortSignalsBySeverity,
} from "@/lib/intelligence";
import { findQuickAction } from "@/lib/quickActions";
import { formatUsd } from "@/lib/formatCurrency";
import { formatFriendlyDate, formatOptionExpiration } from "@/lib/dateUtils";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { SchwabConnectionBanner } from "@/components/SchwabConnectionBanner";
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
  className?: string;
  researchBasePath?: string;
};

function timelineIcon(kind: string) {
  switch (kind) {
    case "trade":
      return Target;
    case "filing":
      return FileText;
    case "earnings":
      return CalendarDays;
    case "news":
    case "press_release":
      return Newspaper;
    default:
      return CalendarDays;
  }
}

function formatStrikeSide(side: "call" | "put") {
  return side === "call" ? "Call" : "Put";
}

function formatOptionPrice(value?: number | null) {
  if (value == null || value === 0) return "—";
  return formatUsd(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
    !!entry.url &&
    (entry.kind === "news" || entry.kind === "press_release")
  );
}

function IntelligenceSection({
  title,
  icon: Icon,
  defaultOpen = false,
  compact = false,
  children,
}: {
  title: string;
  icon: LucideIcon;
  defaultOpen?: boolean;
  compact?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  if (!compact) {
    return (
      <div>
        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {title}
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background/40">
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
        <div className="border-t border-border/70 px-3 pb-3 pt-1">{children}</div>
      )}
    </div>
  );
}

export function SymbolIntelligencePanel({
  intelligence,
  loading = false,
  error = null,
  onRefresh,
  onRunSignal,
  onAnalyzeOption,
  onGoDeeper,
  actionContext = "portfolio",
  compact = false,
  className,
  researchBasePath,
}: Props) {
  const hasContent = hasSymbolIntelligenceContent(intelligence);
  const signals = sortSignalsBySeverity(intelligence?.signals ?? []);
  const peers = intelligence?.peerComparison;
  const timeline = intelligence?.eventTimeline ?? [];
  const options = intelligence?.optionsScorecard;
  const optionChain = intelligence?.optionChainPreview;
  const rollSuggestions = intelligence?.rollSuggestions ?? [];
  const research = intelligence?.cachedResearch;
  const symbol = intelligence?.symbol;

  if (!loading && !error && !hasContent) {
    return null;
  }

  return (
    <section
      className={cn(
        "mx-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-secondary shadow-sm",
        className,
      )}
      aria-label={symbol ? `${symbol} intelligence` : "Symbol intelligence"}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border bg-surface-elevated/50 px-4 py-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent-strong">
            <Sparkles className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">
              {symbol ? `${symbol} intelligence` : "Symbol intelligence"}
            </h2>
            <p className="text-[11px] text-muted">
              Signals, peers, timeline, and options scoring
            </p>
          </div>
        </div>
        {onRefresh && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0"
            onClick={onRefresh}
            disabled={loading}
            aria-label="Refresh intelligence"
          >
            <RefreshCw
              className={cn("h-3.5 w-3.5", loading && "animate-spin")}
              aria-hidden
            />
          </Button>
        )}
      </div>

      <div className="space-y-4 px-4 py-4">
        {loading && !hasContent && (
          <div className="space-y-2">
            <div className="h-4 w-56 animate-pulse rounded bg-muted-bg" />
            <div className="h-16 animate-pulse rounded-xl bg-muted-bg" />
            <div className="h-16 animate-pulse rounded-xl bg-muted-bg" />
          </div>
        )}

        {error && <ErrorBanner message={error} />}

        {intelligence?.reauthRequired && (
          <SchwabConnectionBanner
            message="Reconnect Schwab to include live positions and option chain data in this panel."
            authorizationUrl={intelligence.authorizationUrl}
          />
        )}

        {intelligence?.partial && !intelligence.reauthRequired && (
          <p className="rounded-lg border border-border bg-background/60 px-3 py-2 text-xs text-muted">
            Some live Schwab data is unavailable. Research signals are still shown.
          </p>
        )}

        {!!signals.length && (
          <IntelligenceSection
            title="Signals"
            icon={AlertTriangle}
            defaultOpen
            compact={compact}
          >
            <ul className="space-y-2">
              {signals.slice(0, compact ? 3 : 6).map((signal, index) => {
                const actionId = signalToQuickActionId(signal, actionContext);
                const quickAction = actionId ? findQuickAction(actionId) : null;
                const ActionIcon = quickAction?.icon;

                return (
                <li
                  key={`${signal.kind}-${index}`}
                  className="rounded-xl border border-border bg-background/60 px-3 py-2"
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={cn(
                        "mt-0.5 inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        signalSeverityClass(signal.severity),
                      )}
                    >
                      {signalSeverityLabel(signal.severity)}
                    </span>
                    <p className="flex-1 text-sm text-foreground">{signal.message}</p>
                  </div>
                  {actionId && onRunSignal && quickAction && ActionIcon && (
                    <button
                      type="button"
                      onClick={() => onRunSignal(signal, actionId)}
                      className="mt-2 inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-accent-strong transition hover:border-accent/40 hover:bg-muted-bg"
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
            title="Cached thesis"
            icon={Sparkles}
            compact={compact}
          >
              <div className="space-y-2 rounded-xl border border-border bg-background/60 px-3 py-3">
                {research.sentiment && (
                  <span className="inline-flex rounded-full bg-muted-bg px-2 py-0.5 text-[10px] capitalize text-muted">
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
                    <p className="text-[11px] font-medium text-muted">Strengths</p>
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
            title="Peer comparison"
            icon={GitCompareArrows}
            compact={compact}
          >
            {peers.summary && (
              <p className="mb-2 text-sm text-foreground">{peers.summary}</p>
            )}
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[280px] text-left text-xs">
                <thead className="bg-background/60 text-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium">Symbol</th>
                    <th className="px-3 py-2 font-medium">1Y return</th>
                    <th className="px-3 py-2 font-medium">P/E</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-border bg-accent-muted/20 font-medium">
                    <td className="px-3 py-2 font-mono">{peers.targetSymbol}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {peers.targetOneYearReturn ?? "—"}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {peers.targetPeTrailing ?? "—"}
                    </td>
                  </tr>
                  {peers.peers.slice(0, compact ? 3 : 5).map((peer) => (
                    <tr key={peer.symbol} className="border-t border-border">
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

        {!!timeline.length && (
          <IntelligenceSection
            title="Recent events"
            icon={CalendarDays}
            compact={compact}
          >
            <ul className="space-y-2">
              {timeline.slice(0, compact ? 4 : 8).map((entry, index) => {
                const Icon = timelineIcon(entry.kind);
                const linkable = isTimelineExternalLink(entry);
                return (
                  <li
                    key={`${entry.kind}-${entry.date}-${index}`}
                    className="flex gap-3 rounded-xl border border-border bg-background/60 px-3 py-2"
                  >
                    <Icon
                      className="mt-0.5 h-4 w-4 shrink-0 text-accent-strong"
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-wide text-muted">
                        {formatFriendlyDate(entry.date, { weekday: true })} ·{" "}
                        {entry.kind.replace(/_/g, " ")}
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
          </IntelligenceSection>
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
                  className="rounded-xl border border-border bg-background/60 px-3 py-2.5"
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
                        onAnalyzeOption(buildRollSuggestionPrompt(symbol, suggestion))
                      }
                      className="mt-2 inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-accent-strong transition hover:border-accent/40 hover:bg-muted-bg"
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
          <IntelligenceSection title="Option chain" icon={Target} compact={compact}>
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
              {options.underlyingPrice != null && (
                <p className="mb-2 font-mono text-xs text-foreground">
                  Underlying @ {formatUsd(options.underlyingPrice)}
                </p>
              )}

              {(options.assignmentFlags?.length ?? 0) > 0 && (
                <ul className="mb-3 space-y-1">
                  {options.assignmentFlags.map((flag) => (
                    <li
                      key={flag}
                      className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
                    >
                      {flag}
                    </li>
                  ))}
                </ul>
              )}

              {(options.assignmentFlags?.length ?? 0) > 0 && onAnalyzeOption && symbol && (
                <button
                  type="button"
                  onClick={() =>
                    onAnalyzeOption(
                      `Review assignment and call-away risk for my ${symbol} short options over the next two weeks. ${options.assignmentFlags?.join(" ") ?? ""}`,
                    )
                  }
                  className="mb-3 inline-flex items-center gap-1 rounded-lg border border-danger/30 bg-danger/10 px-2.5 py-1 text-[11px] font-medium text-danger transition hover:bg-danger/15"
                >
                  Analyze assignment risk
                </button>
              )}

              {(options.coveredCallCandidates?.length ?? 0) > 0 && (
                <OptionsCandidateTable
                  title="Covered call candidates"
                  symbol={symbol}
                  candidates={options.coveredCallCandidates.slice(0, 3)}
                  onAnalyzeOption={onAnalyzeOption}
                />
              )}

              {(options.cspCandidates?.length ?? 0) > 0 && (
                <OptionsCandidateTable
                  title="Cash-secured put candidates"
                  symbol={symbol}
                  candidates={options.cspCandidates.slice(0, 3)}
                  onAnalyzeOption={onAnalyzeOption}
                  className="mt-3"
                />
              )}
            </div>
          </IntelligenceSection>
        )}

        {researchBasePath && symbol && !compact && (
          <div className="flex flex-wrap gap-2 pt-1">
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
      </div>
    </section>
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
    <div className={cn("grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4 lg:grid-cols-8", className)}>
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
          {quote?.openInterest != null ? quote.openInterest.toLocaleString() : "—"}
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

  return (
    <div>
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
          {preview.underlyingPrice != null && (
            <span className="normal-case text-foreground">
              · {formatUsd(preview.underlyingPrice)}
            </span>
          )}
        </div>
      )}
      <p className="mb-2 text-[11px] text-muted">
        Bid/ask require live OPR quotes. When Schwab returns null bid/ask, last uses
        prior close and mark uses the model price.
      </p>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[1240px] text-left text-xs">
          <thead className="bg-background/60 text-muted">
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
            {rows.map((row) => (
              <tr key={row.strike} className="border-t border-border">
                <td className="px-3 py-2 font-mono font-medium tabular-nums">
                  {formatUsd(row.strike, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-3 py-2 tabular-nums">{formatOptionPrice(row.call?.bid)}</td>
                <td className="px-3 py-2 tabular-nums">{formatOptionPrice(row.call?.ask)}</td>
                <td className="px-3 py-2 tabular-nums">{formatOptionPrice(row.call?.mark)}</td>
                <td className="px-3 py-2 tabular-nums">{formatOptionPrice(row.call?.lastPrice)}</td>
                <td className="px-3 py-2 tabular-nums">{formatOptionDelta(row.call?.delta)}</td>
                <td className="px-3 py-2 tabular-nums">{formatOptionTheta(row.call?.theta)}</td>
                <td className="px-3 py-2 tabular-nums">
                  {row.call?.openInterest != null
                    ? row.call.openInterest.toLocaleString()
                    : "—"}
                </td>
                <td className="px-3 py-2 tabular-nums">{formatOptionIv(row.call?.iv)}</td>
                <td className="px-3 py-2 tabular-nums">{formatOptionPrice(row.put?.bid)}</td>
                <td className="px-3 py-2 tabular-nums">{formatOptionPrice(row.put?.ask)}</td>
                <td className="px-3 py-2 tabular-nums">{formatOptionPrice(row.put?.mark)}</td>
                <td className="px-3 py-2 tabular-nums">{formatOptionPrice(row.put?.lastPrice)}</td>
                <td className="px-3 py-2 tabular-nums">{formatOptionDelta(row.put?.delta)}</td>
                <td className="px-3 py-2 tabular-nums">{formatOptionTheta(row.put?.theta)}</td>
                <td className="px-3 py-2 tabular-nums">
                  {row.put?.openInterest != null
                    ? row.put.openInterest.toLocaleString()
                    : "—"}
                </td>
                <td className="px-3 py-2 tabular-nums">{formatOptionIv(row.put?.iv)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function OptionsCandidateTable({
  title,
  symbol,
  candidates,
  onAnalyzeOption,
  className,
}: {
  title: string;
  symbol?: string;
  candidates: NonNullable<
    SymbolIntelligence["optionsScorecard"]
  >["coveredCallCandidates"];
  onAnalyzeOption?: (prompt: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-1.5 text-xs font-medium text-foreground">{title}</p>
      <ul className="space-y-2">
        {candidates.map((candidate) => (
          <li
            key={`${candidate.side}-${candidate.strike}-${candidate.expiration}`}
            className="rounded-xl border border-border bg-background/60 px-3 py-2.5"
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
                <p className="mt-2 text-[11px] text-muted">
                  Score {candidate.score.toFixed(2)}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-foreground">
                  {candidate.rationale}
                </p>
              </div>
              {onAnalyzeOption && symbol && (
                <button
                  type="button"
                  onClick={() =>
                    onAnalyzeOption(
                      buildOptionCandidatePrompt(symbol, candidate),
                    )
                  }
                  className="shrink-0 rounded-lg border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-accent-strong transition hover:border-accent/40 hover:bg-muted-bg"
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
