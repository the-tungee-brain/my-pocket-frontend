"use client";

import { useSecLookup } from "@/app/hooks/useSecResearch";
import { useSession } from "next-auth/react";

type SecCompanyBadgeProps = {
  symbol: string;
};

export function SecCompanyBadge({ symbol }: SecCompanyBadgeProps) {
  const { data: session } = useSession();
  const { lookup, isLoading, error } = useSecLookup(symbol, {
    accessToken: session?.accessToken,
  });

  if (isLoading) {
    return (
      <div className="h-10 animate-pulse rounded-xl border border-border bg-muted-bg/40" />
    );
  }

  if (error || !lookup) {
    return (
      <p className="rounded-xl border border-border bg-secondary/40 px-4 py-3 text-xs text-muted">
        SEC filing data is available for US-listed symbols. This ticker may not
        have SEC coverage.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-secondary/40 px-4 py-3">
      <p className="text-sm font-medium text-foreground">{lookup.name}</p>
      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
        <span>CIK {lookup.cik}</span>
        {lookup.exchanges[0] && <span>{lookup.exchanges[0]}</span>}
        {lookup.sic_description && <span>{lookup.sic_description}</span>}
        {lookup.category && <span>{lookup.category}</span>}
      </div>
    </div>
  );
}
