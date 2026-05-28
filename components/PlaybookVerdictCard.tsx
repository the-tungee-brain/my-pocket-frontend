"use client";

import type { PlaybookFactor, PlaybookVerdictContent } from "@/lib/playbookVerdict";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  CircleDot,
  LineChart,
  Newspaper,
  Target,
  XCircle,
} from "lucide-react";

type Props = {
  verdict: PlaybookVerdictContent;
  className?: string;
};

const TONE_STYLES = {
  positive: {
    icon: CheckCircle2,
    border: "border-success/30",
    bg: "bg-success/10",
    label: "text-success",
  },
  cautious: {
    icon: AlertTriangle,
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
    label: "text-amber-800 dark:text-amber-200",
  },
  negative: {
    icon: XCircle,
    border: "border-danger/30",
    bg: "bg-danger/10",
    label: "text-danger",
  },
  neutral: {
    icon: CircleDot,
    border: "border-border",
    bg: "bg-muted-bg/40",
    label: "text-foreground",
  },
} as const;

const FACTOR_ICONS = {
  business: Building2,
  financials: LineChart,
  news: Newspaper,
  strategy: Target,
  other: CircleDot,
} as const;

const FACTOR_STYLES = {
  business: "border-border/80 bg-background/50",
  financials: "border-border/80 bg-background/50",
  news: "border-border/80 bg-background/50",
  strategy: "border-accent/20 bg-accent-muted/10",
  other: "border-border/80 bg-background/50",
} as const;

function FactorRow({ factor }: { factor: PlaybookFactor }) {
  const Icon = FACTOR_ICONS[factor.category];

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2.5",
        FACTOR_STYLES[factor.category],
      )}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-muted" aria-hidden />
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
          {factor.label}
        </p>
      </div>
      <p className="text-[14px] leading-snug text-foreground">{factor.text}</p>
    </div>
  );
}

export function PlaybookVerdictCard({ verdict, className }: Props) {
  const tone = TONE_STYLES[verdict.tone];
  const Icon = tone.icon;
  const groupedFactors = verdict.factors.length > 0 ? verdict.factors : null;

  return (
    <div className={cn("space-y-3", className)}>
      <div
        className={cn(
          "rounded-xl border px-3.5 py-3",
          tone.border,
          tone.bg,
        )}
      >
        <div className="flex items-start gap-2.5">
          <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", tone.label)} aria-hidden />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
              Verdict
            </p>
            <p className={cn("mt-1 text-[15px] font-medium leading-snug", tone.label)}>
              {verdict.verdict}
            </p>
          </div>
        </div>
      </div>

      {groupedFactors ? (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            What drives this
          </p>
          <div className="grid gap-2">
            {groupedFactors.map((factor) => (
              <FactorRow key={`${factor.category}-${factor.text}`} factor={factor} />
            ))}
          </div>
        </div>
      ) : verdict.drivers.length > 0 ? (
        <div className="rounded-xl border border-border/80 bg-background/50 px-3.5 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            What drives this
          </p>
          <ul className="mt-2 space-y-2">
            {verdict.drivers.map((driver) => (
              <li
                key={driver}
                className="flex gap-2 text-[14px] leading-snug text-foreground"
              >
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-strong"
                  aria-hidden
                />
                <span>{driver}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {verdict.changeMind && (
        <div className="rounded-xl border border-dashed border-border/80 px-3.5 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            What would change my mind
          </p>
          <p className="mt-1 text-[14px] leading-snug text-foreground">
            {verdict.changeMind}
          </p>
        </div>
      )}

      {verdict.putZone && (
        <div className="rounded-xl border border-accent/25 bg-accent-muted/15 px-3.5 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-accent-strong">
            Put zone
          </p>
          <p className="mt-1 text-[14px] leading-snug text-foreground">
            {verdict.putZone}
          </p>
        </div>
      )}

      {verdict.remainder && (
        <MarkdownRenderer content={verdict.remainder} variant="conversational" />
      )}
    </div>
  );
}
