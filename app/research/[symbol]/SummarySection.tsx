"use client";

import type { ReactNode } from "react";
import { FileText, Info } from "lucide-react";
import { useStockSummary } from "@/app/hooks/useStockSummary";
import { useSession } from "next-auth/react";
import { BigPictureArticle } from "@/components/BigPictureArticle";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { pageSectionClass } from "@/lib/pageLayout";
import { cn } from "@/lib/utils";

type SummarySectionProps = {
  symbol: string;
  className?: string;
};

function BigPictureShell({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("big-picture-article", className)}>{children}</div>;
}

export function SummarySection({
  symbol,
  className = pageSectionClass,
}: SummarySectionProps) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const symbolUpper = symbol.toUpperCase();

  const { summary, isLoading, error } = useStockSummary(symbol, {
    accessToken,
  });

  if (isLoading && !summary) {
    return (
      <BigPictureShell className={className}>
        <header className="big-picture-article__header" aria-hidden>
          <Skeleton className="h-8 w-48" />
        </header>
        <div className="space-y-4 pt-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </BigPictureShell>
    );
  }

  if (error && !summary) {
    return (
      <BigPictureShell className={className}>
        <ErrorBanner message={error} />
      </BigPictureShell>
    );
  }

  if (!summary) {
    return (
      <BigPictureShell className={className}>
        <header className="big-picture-article__header">
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent-strong">
              <Info className="h-4 w-4" aria-hidden />
            </div>
            <h2 className="text-sm font-semibold text-foreground">Big picture</h2>
          </div>
        </header>
        <EmptyState
          icon={FileText}
          title="Summary unavailable"
          description={`We don't have a summary for ${symbolUpper} right now.`}
          variant="solid"
          className="mt-4 py-6"
        />
      </BigPictureShell>
    );
  }

  return (
    <BigPictureArticle
      summary={summary}
      symbol={symbolUpper}
      className={className}
    />
  );
}
