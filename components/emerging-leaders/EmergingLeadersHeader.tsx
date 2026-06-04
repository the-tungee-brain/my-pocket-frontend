"use client";

import { MoversSectionNav } from "@/components/movers/MoversSectionNav";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function EmergingLeadersHeader({ className }: Props) {
  return (
    <header className={cn("space-y-3", className)}>
      <MoversSectionNav />
      <div className="space-y-1">
        <h1 className="font-mono text-2xl font-semibold tracking-tight text-foreground">
          Emerging Leaders
        </h1>
        <p className="text-sm text-muted">
          Setup quality before the move — consolidation, not momentum
        </p>
      </div>
    </header>
  );
}
