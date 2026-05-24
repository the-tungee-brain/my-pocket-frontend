"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CompanySnapshot } from "./CompanySnapshot";
import { ResearchTabBar } from "@/components/ResearchTabBar";

type Props = {
  symbol: string;
  children: React.ReactNode;
};

export function ResearchSymbolShell({ symbol, children }: Props) {
  return (
    <div className="mx-auto w-full max-w-3xl pb-8">
      <Link
        href="/research"
        className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-muted transition hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to search
      </Link>

      <div className="sticky top-0 z-20 -mx-4 space-y-4 border-b border-border bg-background/95 px-4 pb-4 backdrop-blur-md">
        <CompanySnapshot symbol={symbol} />
        <ResearchTabBar symbol={symbol} />
      </div>

      <div className="mt-6 space-y-4">{children}</div>
    </div>
  );
}
