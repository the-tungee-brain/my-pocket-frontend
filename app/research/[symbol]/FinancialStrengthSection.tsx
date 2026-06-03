"use client";

import { ShieldCheck, ShieldAlert } from "lucide-react";
import type { FinancialStrength } from "@/app/hooks/useFundamentals";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/Skeleton";

type FinancialStrengthSectionProps = {
  strength: FinancialStrength | null | undefined;
  isLoading?: boolean;
};

type ProfileTone = "positive" | "neutral" | "caution" | "risk";

function profileTone(profile: string): ProfileTone {
  const lowered = profile.toLowerCase();
  if (
    lowered.includes("high risk") ||
    lowered.includes("turnaround") ||
    lowered.includes("speculative")
  ) {
    return lowered.includes("high growth") ? "caution" : "risk";
  }
  if (
    lowered.includes("financially strong") ||
    lowered.includes("compounder") ||
    lowered.includes("capital-intensive")
  ) {
    return lowered.includes("capital-intensive") ? "neutral" : "positive";
  }
  if (lowered.includes("cash-generating") || lowered.includes("mature")) {
    return "neutral";
  }
  return "neutral";
}

const TONE_STYLES: Record<
  ProfileTone,
  { badge: string; ring: string; bar: string }
> = {
  positive: {
    badge: "border-accent/30 bg-accent-muted text-accent-strong",
    ring: "ring-accent/20",
    bar: "bg-accent",
  },
  neutral: {
    badge: "border-border bg-muted-bg text-foreground",
    ring: "ring-border",
    bar: "bg-foreground/70",
  },
  caution: {
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    ring: "ring-amber-500/20",
    bar: "bg-amber-500",
  },
  risk: {
    badge: "border-danger/30 bg-danger/10 text-danger",
    ring: "ring-danger/20",
    bar: "bg-danger",
  },
};

const BREAKDOWN_LABELS: {
  key: keyof NonNullable<FinancialStrength["scoreBreakdown"]>;
  label: string;
  weight: string;
}[] = [
  { key: "growth", label: "Growth", weight: "30%" },
  { key: "profitability", label: "Profitability", weight: "30%" },
  { key: "cashFlow", label: "Cash flow", weight: "25%" },
  { key: "balanceSheet", label: "Balance sheet", weight: "15%" },
];

function ScoreBar({
  label,
  weight,
  score,
  rankLabel,
  barClass,
}: {
  label: string;
  weight: string;
  score: number;
  rankLabel: string;
  barClass: string;
}) {
  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <span className="text-muted">
          {label}{" "}
          <span className="text-muted/80">({weight})</span>
        </span>
        <span className="tabular-nums text-foreground">
          {score}/100 · {rankLabel}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted-bg">
        <div
          className={cn("h-full rounded-full transition-all", barClass)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}

export function FinancialStrengthSection({
  strength,
  isLoading,
}: FinancialStrengthSectionProps) {
  if (isLoading) {
    return <Skeleton className="h-32 rounded-xl" />;
  }

  if (!strength) {
    return (
      <p className="text-sm text-muted">
        Financial overview isn&apos;t available for this symbol.
      </p>
    );
  }

  const tone = profileTone(strength.profile);
  const style = TONE_STYLES[tone];
  const breakdown = strength.scoreBreakdown;
  const rawVerdict =
    strength.financialVerdict?.trim() || strength.scoreExplanation?.trim();
  const verdict = rawVerdict
    ? rawVerdict.charAt(0).toUpperCase() + rawVerdict.slice(1)
    : "";

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
            {tone === "risk" || tone === "caution" ? (
              <ShieldAlert className="h-5 w-5" aria-hidden />
            ) : (
              <ShieldCheck className="h-5 w-5" aria-hidden />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-md border px-2 py-0.5 text-xs font-semibold tracking-wide",
                  style.badge,
                )}
              >
                {strength.profile}
              </span>
              <span className="text-xs tabular-nums text-muted">
                Financial Health Score {strength.score}/100
              </span>
            </div>
            {strength.businessContext ? (
              <p className="mt-1 text-[11px] text-muted">
                {strength.businessContext}
              </p>
            ) : null}
            {verdict ? (
              <div className="mt-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                  Financial verdict
                </p>
                <p className="mt-0.5 text-sm leading-snug text-foreground">
                  {verdict}
                </p>
              </div>
            ) : null}
            {strength.headline ? (
              <p className="mt-1 text-xs text-muted">{strength.headline}</p>
            ) : null}
          </div>
        </div>
      </div>

      {breakdown ? (
        <div className="mt-4 space-y-2.5 border-t border-border pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
            Score drivers
          </p>
          {BREAKDOWN_LABELS.map(({ key, label, weight }) => {
            const row = breakdown[key];
            return (
              <ScoreBar
                key={key}
                label={label}
                weight={weight}
                score={row.score}
                rankLabel={row.rankLabel}
                barClass={style.bar}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
