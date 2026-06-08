"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useStrategyContext } from "@/app/contexts/StrategyContext";
import {
  formatStrategyPlaybookTitle,
  playbookHoldBadge,
  symbolNeedsAttention,
  symbolsFromProfile,
} from "@/lib/strategyPlaybook";
import { cn } from "@/lib/utils";

export function StrategyPlaybookQuickLinks() {
  const { profile, recommendations, catalog } = useStrategyContext();

  const symbols = symbolsFromProfile(profile);
  if (!profile?.primaryStrategy || symbols.length === 0) {
    return null;
  }

  const catalogItem = catalog.find(
    (item) => item.id === profile.primaryStrategy,
  );
  const statuses = recommendations?.symbolStatuses ?? [];

  return (
    <section className="mb-6 border border-border bg-muted-bg/40 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Strategy playbook
          </p>
          <h2 className="mt-0.5 text-sm font-semibold text-foreground">
            {formatStrategyPlaybookTitle(profile.primaryStrategy, catalogItem)}
          </h2>
          <p className="mt-1 text-xs text-muted">
            Jump to a playbook symbol — status and next steps appear on each
            research page.
          </p>
        </div>
        <Link
          href="/portfolio"
          className="inline-flex items-center gap-1 bg-muted-bg px-2.5 py-1 text-[11px] font-medium text-foreground transition hover:bg-secondary"
        >
          Open playbook
          <ArrowRight className="h-3 w-3" aria-hidden />
        </Link>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {symbols.map((symbol) => {
          const status = statuses.find((item) => item.symbol === symbol);
          return (
            <Link
              key={symbol}
              href={`/research/${encodeURIComponent(symbol)}/overview`}
              className={cn(
                "inline-flex min-w-0 flex-col border border-border bg-muted-bg/30 px-3 py-2 transition hover:bg-muted-bg/60",
                status && symbolNeedsAttention(status) && "bg-accent-muted/25",
              )}
            >
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                {status && symbolNeedsAttention(status) && (
                  <span className="h-1.5 w-1.5 bg-accent-strong" aria-hidden />
                )}
                {symbol}
              </span>
              <span className="text-[10px] text-muted">
                {status?.statusLabel ?? "On playbook"}
                {status ? ` · ${playbookHoldBadge(status)}` : ""}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
