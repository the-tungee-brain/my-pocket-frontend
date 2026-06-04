"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { appIconBoxClass } from "@/lib/appUi";

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
    <div
      className={cn(
        "rounded-xl border border-border bg-secondary/40 px-4 py-4",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(appIconBoxClass, "h-9 w-9 shrink-0 rounded-lg text-muted")}
          aria-hidden
        >
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
      </div>
      <dl className="mt-4 space-y-3 text-sm leading-relaxed">
        <div>
          <dt className="font-semibold text-foreground">What happened</dt>
          <dd className="mt-1 text-muted">{happened}</dd>
        </div>
        <div>
          <dt className="font-semibold text-foreground">What we&apos;re doing</dt>
          <dd className="mt-1 text-muted">{doing}</dd>
        </div>
        <div>
          <dt className="font-semibold text-foreground">What to expect next</dt>
          <dd className="mt-1 text-muted">{expectNext}</dd>
        </div>
      </dl>
    </div>
  );
}
