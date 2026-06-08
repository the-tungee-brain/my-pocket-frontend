"use client";

import Link from "next/link";
import { ArrowRight, Target } from "lucide-react";
import { symbolHubPath } from "@/lib/symbolRoutes";
import { cn } from "@/lib/utils";

type Props = {
  symbol: string;
  className?: string;
};

export function OptionsTabPrompt({ symbol, className }: Props) {
  const symbolUpper = symbol.toUpperCase();

  return (
    <Link
      href={symbolHubPath(symbolUpper, "options")}
      className={cn(
        "flex items-center justify-between gap-3 border border-accent/25 bg-accent-muted/20 px-4 py-3 transition hover:border-accent/40 hover:bg-accent-muted/30",
        className,
      )}
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-accent-muted text-accent-strong">
          <Target className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium text-foreground">
            Options workspace
          </span>
          <span className="block truncate text-[11px] text-muted">
            Chain preview, rolls, and strike candidates
          </span>
        </span>
      </span>
      <ArrowRight
        className="h-4 w-4 shrink-0 text-accent-strong"
        aria-hidden="true"
      />
    </Link>
  );
}
