"use client";

import { ShieldCheck, ShieldAlert } from "lucide-react";
import type { FinancialStrength } from "@/app/hooks/useFundamentals";
import { cn } from "@/lib/utils";

type FinancialStrengthSectionProps = {
  strength: FinancialStrength | null | undefined;
  isLoading?: boolean;
};

const RATING_STYLES: Record<
  FinancialStrength["rating"],
  { label: string; badge: string; ring: string; listHeading: string }
> = {
  strong: {
    label: "Strong",
    badge: "border-accent/30 bg-accent-muted text-accent-strong",
    ring: "ring-accent/20",
    listHeading: "text-accent-strong",
  },
  solid: {
    label: "Solid",
    badge: "border-accent/25 bg-surface-elevated text-accent-strong",
    ring: "ring-accent/15",
    listHeading: "text-accent-strong",
  },
  mixed: {
    label: "Mixed",
    badge: "border-border bg-muted-bg text-foreground",
    ring: "ring-border",
    listHeading: "text-foreground",
  },
  weak: {
    label: "Weak",
    badge: "border-danger/30 bg-danger/10 text-danger",
    ring: "ring-danger/20",
    listHeading: "text-danger",
  },
};

export function FinancialStrengthSection({
  strength,
  isLoading,
}: FinancialStrengthSectionProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-16 animate-pulse rounded-xl bg-muted-bg" />
        <div className="h-24 animate-pulse rounded-xl bg-muted-bg" />
      </div>
    );
  }

  if (!strength) {
    return (
      <p className="text-sm text-muted">
        Financial strength summary isn&apos;t available for this symbol.
      </p>
    );
  }

  const style = RATING_STYLES[strength.rating];

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-background/60 p-4 ring-1",
        style.ring,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
              style.badge,
            )}
          >
            {strength.rating === "weak" || strength.rating === "mixed" ? (
              <ShieldAlert className="h-5 w-5" aria-hidden />
            ) : (
              <ShieldCheck className="h-5 w-5" aria-hidden />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide",
                  style.badge,
                )}
              >
                {style.label}
              </span>
              <span className="text-xs tabular-nums text-muted">
                Score {strength.score}/100
              </span>
            </div>
            <p className="mt-1 text-sm font-medium text-foreground">
              {strength.headline}
            </p>
          </div>
        </div>
      </div>

      {strength.highlights.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-foreground">
          {strength.highlights.map((item) => (
            <li key={item} className="leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {strength.strengths.length > 0 && (
          <div>
            <p
              className={cn(
                "mb-1.5 text-[10px] font-semibold uppercase tracking-wide",
                style.listHeading,
              )}
            >
              Strengths
            </p>
            <ul className="space-y-1 text-sm text-foreground">
              {strength.strengths.map((item) => (
                <li key={item} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
        {strength.risks.length > 0 && (
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-danger">
              Risks
            </p>
            <ul className="space-y-1 text-sm text-foreground">
              {strength.risks.map((item) => (
                <li key={item} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
