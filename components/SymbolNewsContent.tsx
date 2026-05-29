"use client";

import { useSession } from "next-auth/react";
import { CompanyNews } from "@/components/CompanyNews";
import { useCompanyNews } from "@/app/hooks/useCompanyNews";
import { pageSectionClass } from "@/lib/pageLayout";

type Props = {
  symbol: string;
};

export function SymbolNewsContent({ symbol }: Props) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;

  const {
    analytics,
    isLoading,
    isRefreshing,
    error,
    lastUpdated,
    refresh,
  } = useCompanyNews(symbol, accessToken, Boolean(symbol && accessToken));

  return (
    <CompanyNews
      symbol={symbol}
      analytics={analytics}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      error={error}
      lastUpdated={lastUpdated}
      onRetry={refresh}
      onRefresh={refresh}
      className={pageSectionClass}
    />
  );
}
