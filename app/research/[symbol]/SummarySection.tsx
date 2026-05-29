"use client";

import { FileText, Info } from "lucide-react";
import { useStockSummary } from "@/app/hooks/useStockSummary";
import { useSession } from "next-auth/react";
import {
  BigPictureArticle,
  BigPictureOverviewSkeleton,
} from "@/components/BigPictureArticle";
import { ResearchSectionCard } from "@/components/ResearchSectionCard";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { EmptyState } from "@/components/ui/EmptyState";

type SummarySectionProps = {
  symbol: string;
  className?: string;
};

export function SummarySection({ symbol, className }: SummarySectionProps) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken;
  const symbolUpper = symbol.toUpperCase();

  const { summary, isLoading, error } = useStockSummary(symbol, {
    accessToken,
  });

  if (isLoading && !summary) {
    return (
      <ResearchSectionCard
        className={className}
        title="Big picture"
        description="AI overview — thesis, valuation, strengths, and risks"
        icon={Info}
      >
        <BigPictureOverviewSkeleton />
      </ResearchSectionCard>
    );
  }

  if (error && !summary) {
    return (
      <div className={className}>
        <ErrorBanner message={error} />
      </div>
    );
  }

  if (!summary) {
    return (
      <ResearchSectionCard
        className={className}
        title="Big picture"
        description="AI overview — thesis, valuation, strengths, and risks"
        icon={Info}
      >
        <EmptyState
          icon={FileText}
          title="Summary unavailable"
          description={`We don't have a summary for ${symbolUpper} right now.`}
          variant="solid"
          className="py-4"
        />
      </ResearchSectionCard>
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
