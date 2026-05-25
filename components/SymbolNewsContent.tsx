"use client";

import { useSession } from "next-auth/react";
import { CompanyNews } from "@/components/CompanyNews";
import { useCompanyNews } from "@/app/hooks/useCompanyNews";

type Props = {
  symbol: string;
};

export function SymbolNewsContent({ symbol }: Props) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;

  const {
    analytics,
    isLoading,
    error,
    lastUpdated,
    refetch,
  } = useCompanyNews(symbol, accessToken);

  return (
    <CompanyNews
      symbol={symbol}
      analytics={analytics}
      isLoading={isLoading}
      error={error}
      lastUpdated={lastUpdated}
      onRetry={refetch}
    />
  );
}
