"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useSecLookup } from "@/app/hooks/useSecResearch";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

type SecCompanyProfileSectionProps = {
  symbol: string;
};

export function SecCompanyProfileSection({ symbol }: SecCompanyProfileSectionProps) {
  const { data: session } = useSession();
  const [expanded, setExpanded] = useState(false);
  const { lookup, isLoading, error } = useSecLookup(symbol, {
    accessToken: session?.accessToken,
  });

  if (isLoading) {
    return <Skeleton className="h-8" />;
  }

  if (error || !lookup) {
    return (
      <p className="text-xs text-muted">
        SEC registrant details are available for most US-listed symbols.
      </p>
    );
  }

  const summaryParts = [
    lookup.exchanges[0],
    lookup.sic_description,
    lookup.category,
  ].filter(Boolean);

  return (
    <div className="border border-border bg-background/40">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
        aria-expanded={expanded}
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {lookup.name}
          </p>
          <p className="truncate text-xs text-muted">
            CIK {lookup.cik}
            {summaryParts.length ? ` · ${summaryParts.join(" · ")}` : ""}
          </p>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted transition-transform",
            expanded && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {expanded ? (
        <div className="border-t border-border px-3 py-2.5 text-xs text-muted">
          <dl className="grid gap-1.5 sm:grid-cols-2">
            <div>
              <dt className="text-[10px] uppercase tracking-wide">CIK</dt>
              <dd className="text-foreground">{lookup.cik}</dd>
            </div>
            {lookup.exchanges[0] ? (
              <div>
                <dt className="text-[10px] uppercase tracking-wide">Exchange</dt>
                <dd className="text-foreground">{lookup.exchanges[0]}</dd>
              </div>
            ) : null}
            {lookup.sic_description ? (
              <div className="sm:col-span-2">
                <dt className="text-[10px] uppercase tracking-wide">Industry (SIC)</dt>
                <dd className="text-foreground">{lookup.sic_description}</dd>
              </div>
            ) : null}
            {lookup.category ? (
              <div>
                <dt className="text-[10px] uppercase tracking-wide">Filer category</dt>
                <dd className="text-foreground">{lookup.category}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : null}
    </div>
  );
}
