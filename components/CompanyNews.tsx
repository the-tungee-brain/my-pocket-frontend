"use client";

import { StockNewsView } from "@/app/hooks/useCompanyNews";
import NewsAnalytics from "./NewsAnalytics";
import { ThinkingSpinner } from "./ui/ThinkingSpinner";

type Props = {
  analytics: StockNewsView | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  symbol?: string;
};

export function CompanyNews({ analytics, isLoading }: Props) {
  return (
    <section className="mt-6 flex justify-center">
      <div className="w-full max-w-3xl">
        {isLoading && <ThinkingSpinner message="Fetching and analyzing news" />}
        {analytics && (
          <NewsAnalytics analytics={analytics} isLoading={isLoading} />
        )}
      </div>
    </section>
  );
}
