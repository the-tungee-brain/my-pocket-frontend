"use client";

import Link from "next/link";
import { WatchlistButton } from "@/components/WatchlistButton";
import { moversSectionHeadingClass } from "@/lib/moversUi";
import { symbolHubPath } from "@/lib/symbolRoutes";
import { BarChart3, LineChart } from "lucide-react";

type Props = {
  symbol: string;
};

export function MoversInvestigateFooter({ symbol }: Props) {
  const sym = symbol.toUpperCase();

  return (
    <div className="mt-auto space-y-2 border-t border-border pt-4">
      <p className={moversSectionHeadingClass}>Investigate next</p>
      <div className="flex flex-wrap gap-2">
        <Link
          href={symbolHubPath(sym, "overview")}
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-foreground px-3 text-xs font-semibold text-background hover:opacity-90"
        >
          <LineChart className="h-3.5 w-3.5" aria-hidden />
          Research
        </Link>
        <WatchlistButton symbol={sym} size="sm" />
        <Link
          href={symbolHubPath(sym, "overview")}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-xs font-semibold text-foreground hover:bg-muted-bg"
        >
          <BarChart3 className="h-3.5 w-3.5" aria-hidden />
          Chart
        </Link>
      </div>
    </div>
  );
}
