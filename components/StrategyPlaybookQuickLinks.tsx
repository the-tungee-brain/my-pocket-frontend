"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useSession } from "next-auth/react";
import { useStrategyJourney } from "@/app/hooks/useStrategyJourney";
import {
  formatStrategyPlaybookTitle,
  symbolsFromProfile,
} from "@/lib/strategyPlaybook";

export function StrategyPlaybookQuickLinks() {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;
  const { profile, recommendations, catalog } = useStrategyJourney(accessToken, {
    enabled: !!accessToken,
  });

  const symbols = symbolsFromProfile(profile);
  if (!profile?.primaryStrategy || symbols.length === 0) {
    return null;
  }

  const catalogItem = catalog.find((item) => item.id === profile.primaryStrategy);
  const statuses = recommendations?.symbolStatuses ?? [];

  return (
    <section className="mb-6 rounded-2xl border border-accent/25 bg-accent-muted/15 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-accent-strong">
            Strategy playbook
          </p>
          <h2 className="mt-0.5 text-sm font-semibold text-foreground">
            {formatStrategyPlaybookTitle(profile.primaryStrategy, catalogItem)}
          </h2>
          <p className="mt-1 text-xs text-muted">
            Jump to symbols on your playbook — held status and next steps live on
            Portfolio.
          </p>
        </div>
        <Link
          href="/portfolio"
          className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground transition hover:border-accent/40"
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
              className="inline-flex min-w-0 flex-col rounded-xl border border-border bg-background px-3 py-2 transition hover:border-accent/40"
            >
              <span className="text-sm font-semibold text-foreground">{symbol}</span>
              <span className="text-[10px] text-muted">
                {status?.statusLabel ?? "On playbook"}
                {status ? ` · ${status.held ? "Held" : "Not held"}` : ""}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
