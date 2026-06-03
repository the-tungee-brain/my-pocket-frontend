"use client";

import type {
  DecisionSummary,
  MoverResearchInsight,
  RegimeCompact,
} from "@/lib/topMoversInsight";
import type { InsightLine } from "@/lib/topMovers";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2 } from "lucide-react";

type Props = {
  insight: MoverResearchInsight | null;
  loading?: boolean;
  className?: string;
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
      {children}
    </h3>
  );
}

function InsightBullets({
  lines,
  icon: Icon,
  tone,
}: {
  lines: InsightLine[];
  icon: typeof CheckCircle2;
  tone: "positive" | "warning";
}) {
  if (lines.length === 0) {
    return <p className="text-sm text-muted">—</p>;
  }
  return (
    <ul className="space-y-1.5">
      {lines.map((line) => (
        <li
          key={line.id}
          className="flex items-start gap-2 text-sm text-foreground"
        >
          <Icon
            className={cn(
              "mt-0.5 h-3.5 w-3.5 shrink-0",
              tone === "positive" ? "text-success" : "text-warning",
            )}
            aria-hidden
          />
          {line.label}
        </li>
      ))}
    </ul>
  );
}

function DecisionSummaryBlock({ summary }: { summary: DecisionSummary }) {
  return (
    <div className="mt-3 space-y-1.5 border-t border-border/80 pt-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        Decision summary
      </p>
      <p className="text-sm font-semibold text-foreground">{summary.headline}</p>
      <div className="space-y-0.5">
        <p className="text-xs font-medium text-muted">Reason</p>
        {summary.reasons.map((line, i) => (
          <p key={i} className="text-sm text-foreground">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

export function RegimeCompactCard({
  regime,
  className,
}: {
  regime: RegimeCompact;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border border-border bg-muted-bg/20 px-3 py-2.5",
        className,
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        Current regime
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">{regime.title}</p>
      <p className="mt-1 text-xs text-muted">
        <span className="font-medium text-foreground">Impact: </span>
        {regime.impact}
      </p>
    </section>
  );
}

export function MoverResearchSections({ insight, loading, className }: Props) {
  if (loading || !insight) {
    return (
      <div className={cn("space-y-3", className)} aria-busy={loading}>
        <div className="h-24 animate-pulse rounded-lg bg-muted-bg" />
        <div className="h-16 animate-pulse rounded-lg bg-muted-bg" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <section className="space-y-2 rounded-lg border border-border bg-muted-bg/25 px-3 py-3 sm:px-4 sm:py-4">
        <SectionLabel>Investment thesis</SectionLabel>
        <p className="text-sm leading-relaxed text-foreground">
          {insight.thesis}
        </p>
        <DecisionSummaryBlock summary={insight.decisionSummary} />
      </section>

      <section className="space-y-2">
        <SectionLabel>What supports the signal</SectionLabel>
        <InsightBullets
          lines={insight.supports}
          icon={CheckCircle2}
          tone="positive"
        />
      </section>

      <section className="space-y-2">
        <SectionLabel>What is still missing</SectionLabel>
        <InsightBullets
          lines={insight.missing}
          icon={AlertCircle}
          tone="warning"
        />
      </section>

      {insight.confirmations.length > 0 ? (
        <section className="space-y-1.5">
          <SectionLabel>Next confirmation to watch</SectionLabel>
          <ul className="space-y-1 text-sm text-foreground">
            {insight.confirmations.map((line) => (
              <li key={line.id} className="flex gap-2">
                <span className="font-bold text-muted aria-hidden">•</span>
                {line.label}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

export function PortfolioRoleLabel({ role }: { role: string | null }) {
  if (!role) return null;
  return (
    <p className="text-xs font-medium text-muted">
      Portfolio role: <span className="text-foreground">{role}</span>
    </p>
  );
}
