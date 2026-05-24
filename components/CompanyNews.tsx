"use client";

import { RotateCcw } from "lucide-react";
import { StockNewsView } from "@/app/hooks/useCompanyNews";
import NewsAnalytics from "./NewsAnalytics";
import { ThinkingSpinner } from "./ui/ThinkingSpinner";
import { Button } from "./ui/Button";

type Props = {
  analytics: StockNewsView | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  symbol?: string;
};

export function CompanyNews({
  analytics,
  isLoading,
  error,
  onRetry,
}: Props) {
  return (
    <section className="mt-6 flex justify-center">
      <div className="w-full max-w-3xl">
        {isLoading && (
          <ThinkingSpinner message="Fetching and analyzing news" />
        )}

        {error && !isLoading && (
          <div className="space-y-3 rounded-2xl border border-border bg-secondary/60 px-4 py-6 text-center">
            <p className="text-sm text-danger">{error}</p>
            <Button size="xs" variant="outline" onClick={onRetry}>
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              Try again
            </Button>
          </div>
        )}

        {!error && analytics && (
          <NewsAnalytics analytics={analytics} isLoading={isLoading} />
        )}

        {!error && !isLoading && !analytics && (
          <p className="text-center text-sm text-muted">
            No news analysis available for this symbol.
          </p>
        )}
      </div>
    </section>
  );
}
