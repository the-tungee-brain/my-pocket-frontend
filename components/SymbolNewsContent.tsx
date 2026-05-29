"use client";

import { useSession } from "next-auth/react";
import { ResearchNewsHub } from "@/components/ResearchNewsHub";
import { pageSectionClass } from "@/lib/pageLayout";

type Props = {
  symbol: string;
};

export function SymbolNewsContent({ symbol }: Props) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken as string | undefined;

  return (
    <ResearchNewsHub
      symbol={symbol}
      accessToken={accessToken}
      className={pageSectionClass}
    />
  );
}
