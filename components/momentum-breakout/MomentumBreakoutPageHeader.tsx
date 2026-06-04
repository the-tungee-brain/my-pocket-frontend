"use client";

import { TrendingUp } from "lucide-react";
import { mbEyebrowClass } from "@/lib/momentumBreakoutUi";
import { appIconBoxClass } from "@/lib/appUi";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function MomentumBreakoutPageHeader({ className }: Props) {
  return (
    <header className={cn("border-b border-border/60 pb-5", className)}>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            appIconBoxClass,
            "h-11 w-11 shrink-0 rounded-xl text-accent-strong",
          )}
          aria-hidden
        >
          <TrendingUp className="h-5 w-5" />
        </div>
        <div className="min-w-0 space-y-1.5">
          <p className={mbEyebrowClass}>Educational strategy</p>
          <h1 className="font-mono text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Momentum Breakout
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted">
            Daily scan, manual symbol checks, and price alerts for breakout-style
            setups. We track plans for learning — we do not place trades for you.
          </p>
        </div>
      </div>
    </header>
  );
}
