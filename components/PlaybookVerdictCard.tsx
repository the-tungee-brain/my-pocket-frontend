"use client";

import type { PlaybookVerdictContent } from "@/lib/playbookVerdict";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { AlertTriangle, CheckCircle2, CircleDot, XCircle } from "lucide-react";

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

export function PlaybookVerdictCard({ verdict, className }: Props) {
  const tone = TONE_STYLES[verdict.tone];
  const Icon = tone.icon;

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

      {verdict.drivers.length > 0 && (
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
      )}

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
