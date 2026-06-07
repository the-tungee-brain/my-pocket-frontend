"use client";

import { useState } from "react";
import { ExternalLink, FolderOpen } from "lucide-react";
import { useSecFilings, useSecLookup } from "@/app/hooks/useSecResearch";
import { useSession } from "next-auth/react";
import { buildSecFilingUrl } from "@/lib/secUtils";
import { pickHighlightFilings } from "@/lib/financialsPresentation";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";

type SecFilingsRecentSectionProps = {
  symbol: string;
};

export function SecFilingsRecentSection({ symbol }: SecFilingsRecentSectionProps) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const { lookup } = useSecLookup(symbol, { accessToken });
  const { filings, isLoading, error } = useSecFilings(symbol, 40, {
    accessToken,
  });
  const [showAll, setShowAll] = useState(false);

  if (isLoading) {
    return <SkeletonList rows={3} rowClassName="h-10" />;
  }

  if (error) {
    return <ErrorBanner message={error} />;
  }

  if (!filings?.filings.length) {
    return (
      <EmptyState
        icon={FolderOpen}
        title="No SEC filings"
        description="No recent SEC filings were found for this symbol."
        variant="solid"
        className="py-6"
      />
    );
  }

  const cikInt = lookup?.cik_int;
  const highlighted = pickHighlightFilings(filings.filings);
  const visible = showAll ? filings.filings : highlighted;
  const hasMore = filings.filings.length > highlighted.length;

  return (
    <div className="space-y-3">
      <ul className="divide-y divide-border border border-border">
        {visible.map((filing) => {
          const href =
            cikInt != null
              ? buildSecFilingUrl(
                  cikInt,
                  filing.accession_number,
                  filing.primary_document,
                )
              : undefined;

          return (
            <li
              key={filing.accession_number}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-accent-muted px-2 py-0.5 text-xs font-semibold text-accent-strong">
                    {filing.form}
                  </span>
                  <span className="text-xs text-muted">
                    Filed {formatDate(filing.filing_date)}
                  </span>
                  {filing.report_date ? (
                    <span className="text-xs text-muted">
                      · Report {formatDate(filing.report_date)}
                    </span>
                  ) : null}
                </div>
              </div>
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-accent-strong hover:underline"
                >
                  View
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              ) : null}
            </li>
          );
        })}
      </ul>

      {hasMore ? (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          className="text-xs font-medium text-accent-strong hover:underline"
        >
          {showAll ? "Show latest filings only" : "View all filings"}
        </button>
      ) : null}
    </div>
  );
}

function formatDate(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
