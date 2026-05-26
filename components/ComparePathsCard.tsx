"use client";

import { ArrowRightLeft, CircleDollarSign, Timer } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { HeldOptionOutcomes } from "@/app/types/symbolAnalysis";
import { formatOptionExpiration } from "@/lib/dateUtils";
import { formatSignedUsd, formatUsd } from "@/lib/formatCurrency";
import { cn } from "@/lib/utils";

type Props = {
  outcome: HeldOptionOutcomes;
  className?: string;
};

const PATH_META: Record<
  "roll" | "close" | "hold",
  { icon: LucideIcon; accent: string }
> = {
  roll: {
    icon: ArrowRightLeft,
    accent: "border-accent/30 bg-accent-muted/15",
  },
  close: {
    icon: CircleDollarSign,
    accent: "border-border bg-background/60",
  },
  hold: {
    icon: Timer,
    accent: "border-border bg-background/60",
  },
};

function formatLegLabel(leg: HeldOptionOutcomes["currentLeg"]) {
  const side = leg.side === "call" ? "Call" : leg.side === "put" ? "Put" : "Option";
  return `${formatUsd(leg.strike, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${side} · ${formatOptionExpiration(leg.expiration)}`;
}

export function ComparePathsCard({ outcome, className }: Props) {
  const { drivers, currentLeg, comparePaths } = outcome;

  if (!comparePaths.length) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="rounded-xl border border-border bg-background/60 px-4 py-3">
        <p className="text-[11px] font-medium text-muted">Short option</p>
        <p className="mt-1 text-sm font-semibold text-foreground">
          {formatLegLabel(currentLeg)}
          {currentLeg.contracts != null && currentLeg.contracts > 0 && (
            <span className="ml-2 text-xs font-normal text-muted">
              × {currentLeg.contracts}
            </span>
          )}
        </p>
        {(drivers.actionTrigger ||
          drivers.portfolioWeightPct != null ||
          drivers.openPnl != null) && (
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
            {drivers.actionTrigger && <span>{drivers.actionTrigger}</span>}
            {drivers.portfolioWeightPct != null && (
              <span>{drivers.portfolioWeightPct.toFixed(1)}% portfolio weight</span>
            )}
            {drivers.openPnl != null && (
              <span>Open P/L {formatSignedUsd(drivers.openPnl)}</span>
            )}
            {drivers.openPnlPct != null && (
              <span>({drivers.openPnlPct.toFixed(1)}%)</span>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {comparePaths.map((path) => {
          const meta = PATH_META[path.path];
          const Icon = meta.icon;

          return (
            <div
              key={path.path}
              className={cn(
                "rounded-xl border px-3 py-3",
                meta.accent,
              )}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0 text-accent-strong" aria-hidden />
                <p className="text-sm font-semibold text-foreground">{path.title}</p>
              </div>
              <ul className="mt-2 space-y-1">
                {path.lines.map((line) => (
                  <li key={line} className="text-xs leading-relaxed text-muted">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
