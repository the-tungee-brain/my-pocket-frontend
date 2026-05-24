"use client";

import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  FileText,
  GitCompareArrows,
  Newspaper,
  RefreshCw,
  Sparkles,
  Target,
} from "lucide-react";
import type { SymbolIntelligence } from "@/app/types/intelligence";
import type { IntelligenceSignal } from "@/app/types/intelligence";
import {
  hasSymbolIntelligenceContent,
  signalSeverityClass,
  signalSeverityLabel,
  signalToQuickActionId,
  sortSignalsBySeverity,
} from "@/lib/intelligence";
import { findQuickAction } from "@/lib/quickActions";
import { formatUsd } from "@/lib/formatCurrency";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { cn } from "@/lib/utils";

type Props = {
  intelligence: SymbolIntelligence | null;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onRunSignal?: (signal: IntelligenceSignal, actionId: string) => void;
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

function formatExpiration(expiration: string) {
  const date = new Date(`${expiration}T12:00:00`);
  if (Number.isNaN(date.getTime())) return expiration;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatStrikeSide(side: "call" | "put") {
  return side === "call" ? "Call" : "Put";
}

export function SymbolIntelligencePanel({
  intelligence,
  loading = false,
  error = null,
  onRefresh,
  onRunSignal,
  actionContext = "portfolio",
  compact = false,
  className,
  researchBasePath,
}: Props) {
  const hasContent = hasSymbolIntelligenceContent(intelligence);
  const signals = sortSignalsBySeverity(intelligence?.signals ?? []);
  const peers = intelligence?.peer_comparison;
  const timeline = intelligence?.event_timeline ?? [];
  const options = intelligence?.options_scorecard;
  const research = intelligence?.cached_research;
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

        {!!signals.length && (
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
              Signals
            </div>
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
          </div>
        )}

        {research &&
          (research.investment_thesis ||
            research.key_strengths.length > 0 ||
            research.key_risks.length > 0) && (
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
                <Sparkles className="h-3.5 w-3.5" aria-hidden />
                Cached thesis
                {research.sentiment && (
                  <span className="rounded-full bg-muted-bg px-2 py-0.5 text-[10px] capitalize text-muted">
                    {research.sentiment}
                  </span>
                )}
              </div>
              <div className="space-y-2 rounded-xl border border-border bg-background/60 px-3 py-3">
                {research.investment_thesis && (
                  <p className="text-sm leading-relaxed text-foreground">
                    {research.investment_thesis}
                  </p>
                )}
                {research.key_strengths.length > 0 && (
                  <div>
                    <p className="text-[11px] font-medium text-muted">Strengths</p>
                    <ul className="mt-1 list-inside list-disc text-sm text-foreground">
                      {research.key_strengths.slice(0, 3).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {research.key_risks.length > 0 && (
                  <div>
                    <p className="text-[11px] font-medium text-muted">Risks</p>
                    <ul className="mt-1 list-inside list-disc text-sm text-foreground">
                      {research.key_risks.slice(0, 3).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

        {peers && (peers.peers.length > 0 || peers.summary) && (
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
              <GitCompareArrows className="h-3.5 w-3.5" aria-hidden />
              Peer comparison
            </div>
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
                    <td className="px-3 py-2 font-mono">{peers.target_symbol}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {peers.target_one_year_return ?? "—"}
                    </td>
                    <td className="px-3 py-2 tabular-nums">
                      {peers.target_pe_trailing ?? "—"}
                    </td>
                  </tr>
                  {peers.peers.slice(0, compact ? 3 : 5).map((peer) => (
                    <tr key={peer.symbol} className="border-t border-border">
                      <td className="px-3 py-2 font-mono">{peer.symbol}</td>
                      <td className="px-3 py-2 tabular-nums">
                        {peer.one_year_return ?? "—"}
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {peer.pe_trailing ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!!timeline.length && (
          <div>
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              Recent events
            </div>
            <ul className="space-y-2">
              {timeline.slice(0, compact ? 4 : 8).map((entry, index) => {
                const Icon = timelineIcon(entry.kind);
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
                        {entry.date} · {entry.kind.replace(/_/g, " ")}
                      </p>
                      <p className="text-sm font-medium text-foreground">
                        {entry.title}
                      </p>
                      {entry.detail && (
                        <p className="mt-0.5 text-xs text-muted">{entry.detail}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {options &&
          (options.assignment_flags.length > 0 ||
            options.covered_call_candidates.length > 0 ||
            options.csp_candidates.length > 0) && (
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
                <Target className="h-3.5 w-3.5" aria-hidden />
                Options scorecard
                {options.underlying_price != null && (
                  <span className="font-mono normal-case text-foreground">
                    @ {formatUsd(options.underlying_price)}
                  </span>
                )}
              </div>

              {options.assignment_flags.length > 0 && (
                <ul className="mb-3 space-y-1">
                  {options.assignment_flags.map((flag) => (
                    <li
                      key={flag}
                      className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
                    >
                      {flag}
                    </li>
                  ))}
                </ul>
              )}

              {options.covered_call_candidates.length > 0 && (
                <OptionsCandidateTable
                  title="Covered call candidates"
                  candidates={options.covered_call_candidates.slice(0, 3)}
                />
              )}

              {options.csp_candidates.length > 0 && (
                <OptionsCandidateTable
                  title="Cash-secured put candidates"
                  candidates={options.csp_candidates.slice(0, 3)}
                  className="mt-3"
                />
              )}
            </div>
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
      </div>
    </section>
  );
}

function OptionsCandidateTable({
  title,
  candidates,
  className,
}: {
  title: string;
  candidates: NonNullable<
    SymbolIntelligence["options_scorecard"]
  >["covered_call_candidates"];
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-1.5 text-xs font-medium text-foreground">{title}</p>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[320px] text-left text-xs">
          <thead className="bg-background/60 text-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Strike</th>
              <th className="px-3 py-2 font-medium">Exp</th>
              <th className="px-3 py-2 font-medium">Delta</th>
              <th className="px-3 py-2 font-medium">OI</th>
              <th className="px-3 py-2 font-medium">Bid</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate) => (
              <tr
                key={`${candidate.side}-${candidate.strike}-${candidate.expiration}`}
                className="border-t border-border"
              >
                <td className="px-3 py-2">
                  {formatUsd(candidate.strike, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}{" "}
                  {formatStrikeSide(candidate.side)}
                </td>
                <td className="px-3 py-2">
                  {formatExpiration(candidate.expiration)}
                </td>
                <td className="px-3 py-2 tabular-nums">
                  {candidate.delta != null ? candidate.delta.toFixed(2) : "—"}
                </td>
                <td className="px-3 py-2 tabular-nums">
                  {candidate.open_interest ?? "—"}
                </td>
                <td className="px-3 py-2 tabular-nums">
                  {candidate.bid != null
                    ? formatUsd(candidate.bid, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
