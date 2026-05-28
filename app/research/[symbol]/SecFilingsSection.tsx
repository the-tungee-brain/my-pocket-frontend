"use client";

import { ExternalLink, FolderOpen } from "lucide-react";
import { useSecFilings, useSecLookup } from "@/app/hooks/useSecResearch";
import { useSession } from "next-auth/react";
import { buildSecFilingUrl } from "@/lib/secUtils";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";

type SecFilingsSectionProps = {
  symbol: string;
};

export function SecFilingsSection({ symbol }: SecFilingsSectionProps) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const { lookup } = useSecLookup(symbol, { accessToken });
  const { filings, isLoading, error } = useSecFilings(symbol, 12, {
    accessToken,
  });

  if (isLoading) {
    return <SkeletonList rows={5} rowClassName="h-10 rounded-lg" />;
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

  return (
    <ul className="divide-y divide-border rounded-xl border border-border">
      {filings.filings.map((filing) => {
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
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-accent-muted px-2 py-0.5 text-xs font-semibold text-accent-strong">
                  {filing.form}
                </span>
                <span className="text-xs text-muted">
                  Filed {formatDate(filing.filing_date)}
                </span>
                {filing.report_date && (
                  <span className="text-xs text-muted">
                    · Report {formatDate(filing.report_date)}
                  </span>
                )}
              </div>
              <p className="mt-1 truncate text-xs text-muted">
                {filing.accession_number}
              </p>
            </div>
            {href && (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-accent-strong hover:underline"
              >
                View
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            )}
          </li>
        );
      })}
    </ul>
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
