"use client";

import type { ConvictionTier } from "@/lib/topMovers";
import { cn } from "@/lib/utils";

type Props = {
  tier: ConvictionTier;
  label: string;
  className?: string;
};

const TONE: Record<ConvictionTier, string> = {
  elite: "bg-accent/15 text-accent",
  strong: "bg-success/15 text-success",
  rising: "bg-warning/15 text-warning",
  mixed: "bg-muted-bg text-muted",
};

export function ConvictionBadge({ tier, label, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex px-2.5 py-0.5 text-[11px] font-bold tracking-wide",
        TONE[tier],
        className,
      )}
      aria-label={`Conviction ${label}`}
    >
      {label}
    </span>
  );
}
