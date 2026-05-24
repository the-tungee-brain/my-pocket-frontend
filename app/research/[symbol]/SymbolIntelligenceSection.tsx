"use client";

import { useSession } from "next-auth/react";
import { useSymbolIntelligence } from "@/app/hooks/useSymbolIntelligence";
import { SymbolIntelligencePanel } from "@/components/SymbolIntelligencePanel";

type Props = {
  symbol: string;
};

export function SymbolIntelligenceSection({ symbol }: Props) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;

  const { intelligence, loading, error, refetch } = useSymbolIntelligence(
    symbol,
    { accessToken },
  );

  return (
    <SymbolIntelligencePanel
      intelligence={intelligence}
      loading={loading}
      error={error}
      onRefresh={refetch}
      researchBasePath="/research"
    />
  );
}
