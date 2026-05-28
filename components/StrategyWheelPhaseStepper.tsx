"use client";

import type { InvestmentStrategy, WheelPhase } from "@/app/types/strategy";
import {
  activeWheelPhaseIndex,
  wheelPhaseStepsForStrategy,
} from "@/lib/strategyPlaybook";
import { cn } from "@/lib/utils";

type Props = {
  strategy: InvestmentStrategy;
  phase: WheelPhase | null | undefined;
  className?: string;
};

export function StrategyWheelPhaseStepper({ strategy, phase, className }: Props) {
  const steps = wheelPhaseStepsForStrategy(strategy);
  if (steps.length === 0) return null;

  const activeIndex = activeWheelPhaseIndex(phase, steps);

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {steps.map((step, index) => {
        const isActive = index === activeIndex;
        const isPast = activeIndex >= 0 && index < activeIndex;

        return (
          <div key={step.id} className="flex items-center gap-1">
            {index > 0 && (
              <span
                className={cn(
                  "h-px w-2",
                  isPast || isActive ? "bg-accent/40" : "bg-border",
                )}
                aria-hidden
              />
            )}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[9px] font-medium",
                isActive
                  ? "bg-accent-muted/70 text-accent-strong ring-1 ring-accent/30"
                  : isPast
                    ? "bg-accent-muted/30 text-accent-strong/80"
                    : "bg-muted-bg text-muted",
              )}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
