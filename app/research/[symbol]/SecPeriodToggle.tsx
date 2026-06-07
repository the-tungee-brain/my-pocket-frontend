"use client";

import type { SecPeriod } from "@/lib/secUtils";
import { cn } from "@/lib/utils";

type SecPeriodToggleProps = {
  period: SecPeriod;
  onChange: (period: SecPeriod) => void;
  className?: string;
};

export function SecPeriodToggle({
  period,
  onChange,
  className,
}: SecPeriodToggleProps) {
  return (
    <div
      className={cn(
        "inline-flex border border-border bg-muted-bg/50 p-0.5",
        className,
      )}
    >
      {(
        [
          ["annual", "Annual"],
          ["quarterly", "Quarterly"],
        ] as const
      ).map(([value, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={cn(
            "px-3 py-1 text-xs font-medium transition-colors",
            period === value
              ? "bg-secondary text-foreground shadow-sm"
              : "text-muted hover:text-foreground",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
