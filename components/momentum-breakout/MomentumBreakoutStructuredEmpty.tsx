"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { appIconBoxClass, appPanelSubtleClass } from "@/lib/appUi";

type Props = {
  icon: LucideIcon;
  title: string;
  happened: string;
  doing: string;
  expect: string;
  className?: string;
};

export function MomentumBreakoutStructuredEmpty({
  icon: Icon,
  title,
  happened,
  doing,
  expect: expectNext,
  className,
}: Props) {
  return (
    <div className={cn(appPanelSubtleClass, "px-4 py-4", className)}>
      <div className="flex items-start gap-3">
        <div
          className={cn(appIconBoxClass, "h-9 w-9 shrink-0 text-muted")}
          aria-hidden
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">{happened}</p>
        </div>
      </div>
      <dl className="mt-4 grid gap-2 text-sm leading-relaxed sm:grid-cols-2">
        <div className="border border-border/60 bg-background/40 px-3 py-2.5">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
            Monitoring
          </dt>
          <dd className="mt-1 text-foreground/80">{doing}</dd>
        </div>
        <div className="border border-border/60 bg-background/40 px-3 py-2.5">
          <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
            Next
          </dt>
          <dd className="mt-1 text-muted">{expectNext}</dd>
        </div>
      </dl>
    </div>
  );
}
